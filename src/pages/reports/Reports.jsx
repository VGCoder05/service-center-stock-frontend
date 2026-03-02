import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import reportService, { downloadBlob } from '../../services/reportService';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG } from '../../utils/constants';
import ClientExcelService from '../../services/clientExcelService';

const REPORT_TYPES = [
  {
    id: 'valuation',
    name: 'Stock Valuation',
    description: 'Summary and details of all categories',
    icon: '📊'
  },
  {
    id: 'in-stock',
    name: 'IN STOCK (Bill-wise)',
    description: 'In-stock items grouped by bill',
    icon: '📦'
  },
  {
    id: 'spu-pending',
    name: 'SPU Pending',
    description: 'Pending SPU items grouped by SPU ID',
    icon: '🔴'
  },
  {
    id: 'spu-cleared',
    name: 'SPU Cleared',
    description: 'Cleared SPU items grouped by SPU ID',
    icon: '🟢'
  }
];

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('valuation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const fetchPreview = async () => {
    setLoading(true);
    setPreviewData(null);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let response;
      switch (selectedReport) {
        case 'valuation':
          response = await reportService.getStockValuation(params);
          break;
        case 'in-stock':
          response = await reportService.getInStockByBill(params);
          break;
        case 'spu-pending':
          response = await reportService.getSPUReport({ ...params, status: 'pending' });
          break;
        case 'spu-cleared':
          response = await reportService.getSPUReport({ ...params, status: 'cleared' });
          break;
        default:
          return;
      }
      setPreviewData(response);
    } catch (err) {
      showToast.error('Failed to load report preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [selectedReport, startDate, endDate]);

  const handleExport = async () => {
    setExporting(true);

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let apiResponse;
      let filename;
      let buffer;
      const dateStr = startDate && endDate ? `${startDate}_to_${endDate}` : 'all-time';

      switch (selectedReport) {
        case 'valuation':
          apiResponse = await reportService.exportStockValuation(params);
          buffer = await ClientExcelService.generateStockValuation(apiResponse.data, { startDate, endDate });
          filename = `StockValuation_${dateStr}.xlsx`;
          break;
        case 'in-stock':
          apiResponse = await reportService.exportInStockByBill(params);
          buffer = await ClientExcelService.generateBillWiseReport(apiResponse.data, { startDate, endDate });
          filename = `InStock_BillWise_${dateStr}.xlsx`;
          break;
        case 'spu-pending':
          apiResponse = await reportService.exportSPUReport({ ...params, status: 'pending' });
          buffer = await ClientExcelService.generateSPUReport(apiResponse.data, { startDate, endDate, status: 'SPU_PENDING' });
          filename = `SPU_Pending_${dateStr}.xlsx`;
          break;
        case 'spu-cleared':
          apiResponse = await reportService.exportSPUReport({ ...params, status: 'cleared' });
          buffer = await ClientExcelService.generateSPUReport(apiResponse.data, { startDate, endDate, status: 'SPU_CLEARED' });
          filename = `SPU_Cleared_${dateStr}.xlsx`;
          break;
        default:
          return;
      }

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      downloadBlob(blob, filename);
      showToast.success('Report exported successfully!');

    } catch (err) {
      console.error('Export error:', err);
      showToast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd-MM-yyyy');
    } catch {
      return '-';
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading preview...
        </div>
      );
    }

    if (!previewData) {
      return (
        <div className="text-center py-12 text-gray-500">
          Select filters and click to preview
        </div>
      );
    }

    switch (selectedReport) {
      case 'valuation':
        return renderValuationPreview();
      case 'in-stock':
        return renderInStockPreview();
      case 'spu-pending':
      case 'spu-cleared':
        return renderSPUPreview();
      default:
        return null;
    }
  };

  // =====================
  // VALUATION PREVIEW
  // =====================
  const renderValuationPreview = () => {
    const rawData = previewData.data || previewData || {};
    const categories = rawData.categories || {};
    let totalQty = 0;
    let totalValue = 0;

    Object.values(categories).forEach(cat => {
      totalQty += cat.count;
      totalValue += cat.totalValue;
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Value</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(categories).map(([key, data]) => {
              const config = CATEGORY_CONFIG[key];
              const percentage = totalValue > 0 ? ((data.totalValue / totalValue) * 100).toFixed(1) : 0;
              return (
                <tr key={key} className={config?.bgColor || ''}>
                  <td className={`px-4 py-3 font-medium ${config?.textColor || ''}`}>
                    {config?.label || key}
                  </td>
                  <td className="px-4 py-3 text-right">{data.count}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(data.totalValue)}</td>
                  <td className="px-4 py-3 text-right">{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-bold">
            <tr>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">{totalQty}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totalValue)}</td>
              <td className="px-4 py-3 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // =====================
  // IN STOCK PREVIEW — matches Excel: Voucher No., Company Bill, Supplier, Bill Date, Serial No., Part Name, Unit Price, Location
  // =====================
  const renderInStockPreview = () => {
    const rawData = previewData.data || previewData || {};
    const bills = Array.isArray(rawData) ? rawData : rawData.bills || [];
    const summary = rawData.summary || previewData.summary || {};

    // Flatten bills into serial-level rows for preview
    const flatRows = [];
    let totalSerials = 0;
    bills.forEach(bill => {
      (bill.serials || []).forEach((serial, idx) => {
        flatRows.push({
          // Show bill info only on first serial of each group
          isFirstInGroup: idx === 0,
          voucherNumber: bill.voucherNumber,
          companyBillNumber: bill.companyBillNumber || '-',
          supplierName: bill.supplierName || '-',
          billDate: bill.billDate,
          // Serial-level
          serialNumber: serial.serialNumber,
          partName: serial.partName,
          unitPrice: serial.unitPrice,
          location: serial.context?.location || '-'
        });
        totalSerials++;
      });
    });

    const MAX_PREVIEW_ROWS = 50;

    return (
      <div>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Bills</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalBills || bills.length || 0}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalItems || totalSerials}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.totalValue)}</p>
          </div>
        </div>

        {/* Detailed table matching Excel */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Voucher No.</th>
                <th className="px-3 py-2 text-left font-semibold">Company Bill</th>
                <th className="px-3 py-2 text-left font-semibold">Supplier</th>
                <th className="px-3 py-2 text-left font-semibold">Bill Date</th>
                <th className="px-3 py-2 text-left font-semibold">Serial No.</th>
                <th className="px-3 py-2 text-left font-semibold">Part Name</th>
                <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                <th className="px-3 py-2 text-left font-semibold">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flatRows.slice(0, MAX_PREVIEW_ROWS).map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-blue-50 ${row.isFirstInGroup && i !== 0 ? 'border-t-2 border-blue-200' : ''}`}
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.isFirstInGroup ? row.voucherNumber : ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isFirstInGroup ? row.companyBillNumber : ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isFirstInGroup ? row.supplierName : ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isFirstInGroup ? formatDate(row.billDate) : ''}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.serialNumber}</td>
                  <td className="px-3 py-2 text-xs">{row.partName}</td>
                  <td className="px-3 py-2 text-right text-xs">{formatCurrency(row.unitPrice)}</td>
                  <td className="px-3 py-2 text-xs">{row.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {flatRows.length > MAX_PREVIEW_ROWS && (
            <p className="text-center text-sm text-gray-500 py-2">
              Showing {MAX_PREVIEW_ROWS} of {flatRows.length} items. Export for full data.
            </p>
          )}
          {flatRows.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No in-stock items found.</p>
          )}
        </div>
      </div>
    );
  };

  // =====================
  // SPU PREVIEW — matches Excel: SPU ID, Ticket ID, Customer, SPU Date, Voucher No., Company Bill No., Bill Date, Serial No., Part Name, Unit Price, Chargeable, Charge Amt, Payment, Note
  // =====================
  const renderSPUPreview = () => {
    const rawData = previewData.data || previewData || {};
    const spus = Array.isArray(rawData) ? rawData : rawData.spus || rawData.groups || [];
    const summary = rawData.summary || previewData.summary || {};

    // Flatten SPUs into serial-level rows
    const flatRows = [];
    let totalSerials = 0;
    spus.forEach(spu => {
      (spu.serials || []).forEach((serial, idx) => {
        flatRows.push({
          isFirstInGroup: idx === 0,
          // SPU-level (show only on first)
          spuId: spu.spuId || '-',
          ticketId: spu.ticketId || '-',
          customerName: spu.customerName || '-',
          spuDate: spu.spuDate,
          // Serial-level (show on every row)
          voucherNumber: serial.voucherNumber || '-',
          companyBillNumber: serial.companyBillNumber || '-',
          billDate: serial.billDate,
          serialNumber: serial.serialNumber,
          partName: serial.partName,
          unitPrice: serial.unitPrice,
          isChargeable: serial.context?.isChargeable || false,
          chargeAmount: serial.context?.chargeAmount || 0,
          paymentStatus: serial.context?.paymentStatus || '-',
          notes: serial.context?.remarks || serial.context?.notes || '-'
        });
        totalSerials++;
      });
    });

    const MAX_PREVIEW_ROWS = 50;

    return (
      <div>
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total SPUs</p>
            <p className="text-2xl font-bold text-red-700">{summary.totalSPUs || spus.length || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-red-700">{summary.totalItems || totalSerials}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(summary.totalValue)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Chargeable</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(summary.totalChargeable)}</p>
          </div>
        </div>

        {/* Detailed table matching Excel */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">SPU ID</th>
                <th className="px-3 py-2 text-left font-semibold">Ticket ID</th>
                <th className="px-3 py-2 text-left font-semibold">Customer</th>
                <th className="px-3 py-2 text-left font-semibold">SPU Date</th>
                <th className="px-3 py-2 text-left font-semibold">Voucher No.</th>
                <th className="px-3 py-2 text-left font-semibold">Company Bill No.</th>
                <th className="px-3 py-2 text-left font-semibold">Bill Date</th>
                <th className="px-3 py-2 text-left font-semibold">Serial No.</th>
                <th className="px-3 py-2 text-left font-semibold">Part Name</th>
                <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                <th className="px-3 py-2 text-center font-semibold">Chargeable</th>
                <th className="px-3 py-2 text-right font-semibold">Charge Amt</th>
                <th className="px-3 py-2 text-left font-semibold">Payment</th>
                <th className="px-3 py-2 text-left font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flatRows.slice(0, MAX_PREVIEW_ROWS).map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-red-50 ${row.isFirstInGroup && i !== 0 ? 'border-t-2 border-red-200' : ''}`}
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.isFirstInGroup ? row.spuId : ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isFirstInGroup ? row.ticketId : ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isFirstInGroup ? row.customerName : ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isFirstInGroup ? formatDate(row.spuDate) : ''}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.voucherNumber}</td>
                  <td className="px-3 py-2 text-xs">{row.companyBillNumber}</td>
                  <td className="px-3 py-2 text-xs">{formatDate(row.billDate)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.serialNumber}</td>
                  <td className="px-3 py-2 text-xs">{row.partName}</td>
                  <td className="px-3 py-2 text-right text-xs">{formatCurrency(row.unitPrice)}</td>
                  <td className="px-3 py-2 text-center text-xs">
                    {row.isChargeable ? (
                      <span className="text-orange-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {row.isChargeable ? formatCurrency(row.chargeAmount) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isChargeable ? row.paymentStatus : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[200px] truncate" title={row.notes}>
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flatRows.length > MAX_PREVIEW_ROWS && (
            <p className="text-center text-sm text-gray-500 py-2">
              Showing {MAX_PREVIEW_ROWS} of {flatRows.length} items. Export for full data.
            </p>
          )}
          {flatRows.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No SPU items found.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and export stock reports</p>
      </div>

      {/* Report Selection & Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="label">Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{report.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-gray-500">{report.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">From Date (Bill Date)</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {startDate || endDate ? (
              <>
                Filtering parts received {startDate ? `from ${format(new Date(startDate), 'dd MMM yyyy')}` : ''}
                {endDate ? ` to ${format(new Date(endDate), 'dd MMM yyyy')}` : ''}
              </>
            ) : (
              'Showing all-time data'
            )}
          </p>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Preview & Export */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {REPORT_TYPES.find(r => r.id === selectedReport)?.name} Preview
          </h2>
          <button
            onClick={handleExport}
            disabled={exporting || loading || !previewData}
            className="btn-primary disabled:opacity-50"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export to Excel
              </span>
            )}
          </button>
        </div>

        {renderPreview()}
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">📋 Report Information</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Stock Valuation:</strong> Summary of all categories with detailed sheets per category</li>
          <li>• <strong>IN STOCK:</strong> Items currently in stock, grouped by the bill they came from</li>
          <li>• <strong>SPU Reports:</strong> SPU items grouped by SPU ID, with customer and chargeable info</li>
          <li>• Date filter uses <strong>Bill Date</strong> (when parts were received), showing their <strong>current category</strong></li>
          <li>• Excel files include color-coded rows matching category colors</li>
        </ul>
      </div>
    </div>
  );
};

export default Reports;