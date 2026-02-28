import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import reportService, { downloadBlob } from '../../services/reportService';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG } from '../../utils/constants';
import ClientExcelService from '../../services/clientExcelService'; // Adjust path if needed

// Report type options
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
  // State
  const [selectedReport, setSelectedReport] = useState('valuation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Fetch preview data
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

  // Auto-fetch on filter change
  useEffect(() => {
    fetchPreview();
  }, [selectedReport, startDate, endDate]);

  // Handle export
  // const handleExport = async () => {
  //   setExporting(true);

  //   try {
  //     const params = {};
  //     if (startDate) params.startDate = startDate;
  //     if (endDate) params.endDate = endDate;

  //     let response;
  //     let filename;
  //     const dateStr = startDate && endDate ? `${startDate}_to_${endDate}` : 'all-time';

  //     switch (selectedReport) {
  //       case 'valuation':
  //         response = await reportService.exportStockValuation(params);
  //         filename = `StockValuation_${dateStr}.xlsx`;
  //         break;
  //       case 'in-stock':
  //         response = await reportService.exportInStockByBill(params);
  //         filename = `InStock_BillWise_${dateStr}.xlsx`;
  //         break;
  //       case 'spu-pending':
  //         response = await reportService.exportSPUReport({ ...params, status: 'pending' });
  //         filename = `SPU_Pending_${dateStr}.xlsx`;
  //         break;
  //       case 'spu-cleared':
  //         response = await reportService.exportSPUReport({ ...params, status: 'cleared' });
  //         filename = `SPU_Cleared_${dateStr}.xlsx`;
  //         break;
  //       default:
  //         return;
  //     }

  //     downloadBlob(response.data, filename);
  //     showToast.success('Report exported successfully!');
  //   } catch (err) {
  //     showToast.error('Failed to export report');
  //   } finally {
  //     setExporting(false);
  //   }
  // };
  // Handle export
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

      // 1. Fetch JSON Data & 2. Generate Buffer
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

      // 3. Convert Buffer to Blob
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // 4. Trigger Download
      downloadBlob(blob, filename);
      showToast.success('Report exported successfully!');
      
    } catch (err) {
      console.error('Export error:', err);
      showToast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Render preview based on report type
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

  // Valuation preview
  const renderValuationPreview = () => {
    const categories = previewData.data?.categories || {};
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

  // IN_STOCK preview
  const renderInStockPreview = () => {
    const bills = previewData.data || [];
    const summary = previewData.summary || {};

    return (
      <div>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Bills</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalBills || 0}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalItems || 0}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.totalValue)}</p>
          </div>
        </div>

        {/* Bill list */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Voucher No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills.slice(0, 20).map((bill) => (
                <tr key={bill._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{bill.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm">{bill.supplierName || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {bill.billDate ? format(new Date(bill.billDate), 'dd-MM-yyyy') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">{bill.count}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(bill.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bills.length > 20 && (
            <p className="text-center text-sm text-gray-500 py-2">
              Showing 20 of {bills.length} bills. Export for full data.
            </p>
          )}
        </div>
      </div>
    );
  };

  // SPU preview
  const renderSPUPreview = () => {
    const spus = previewData.data || [];
    const summary = previewData.summary || {};

    return (
      <div>
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total SPUs</p>
            <p className="text-2xl font-bold text-red-700">{summary.totalSPUs || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-red-700">{summary.totalItems || 0}</p>
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

        {/* SPU list */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SPU ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SPU Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Chargeable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {spus.slice(0, 20).map((spu) => (
                <tr key={spu._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{spu.spuId || '-'}</td>
                  <td className="px-4 py-3 text-sm">{spu.customerName || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {spu.spuDate ? format(new Date(spu.spuDate), 'dd-MM-yyyy') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">{spu.count}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(spu.totalValue)}</td>
                  <td className="px-4 py-3 text-right">
                    {spu.chargeableAmount > 0 ? (
                      <span className="text-orange-600">{formatCurrency(spu.chargeableAmount)}</span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {spus.length > 20 && (
            <p className="text-center text-sm text-gray-500 py-2">
              Showing 20 of {spus.length} SPUs. Export for full data.
            </p>
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
          {/* Report Type */}
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

          {/* Date Filters */}
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

        {/* Date info */}
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
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
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

        {/* Preview Content */}
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