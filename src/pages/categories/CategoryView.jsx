import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import categoryService from '../../services/categoryService';
import CategorizeModal from '../../components/serials/CategorizeModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG, CATEGORIES } from '../../utils/constants';

const CategoryView = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { isViewer } = useAuth();

  // Validate category
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Invalid Category</h2>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // State
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [summary, setSummary] = useState({ count: 0, totalValue: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch serials
  const fetchSerials = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await categoryService.getByCategory(category, params);
      setSerials(response.data);
      setPagination(response.pagination);
      setSummary(response.summary);
    } catch (err) {
      showToast.error('Failed to fetch serial numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSerials();
    setSelectedSerials([]);
  }, [category, search, startDate, endDate, pagination.page]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSerials(serials.map(s => s._id));
    } else {
      setSelectedSerials([]);
    }
  };

  // Handle individual select
  const handleSelect = (id) => {
    setSelectedSerials(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle bulk category change
  const handleBulkCategoryChange = async () => {
    if (!bulkCategory || selectedSerials.length === 0) return;

    setIsProcessing(true);
    try {
      // For now, just change category without context
      // In a full implementation, you'd show a form for context fields
      await categoryService.bulkCategorize({
        serialIds: selectedSerials,
        category: bulkCategory,
        context: {},
        reason: `Bulk changed to ${bulkCategory}`
      });

      showToast.success(`${selectedSerials.length} serial(s) updated successfully`);
      setIsBulkConfirmOpen(false);
      setSelectedSerials([]);
      setBulkCategory('');
      fetchSerials();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Bulk update failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get context display
  const getContextDisplay = (serial) => {
    const ctx = serial.context;
    if (!ctx) return '-';

    switch (category) {
      case 'SPU_PENDING':
      case 'SPU_CLEARED':
        return (
          <div className="text-xs">
            <p className="font-medium">{ctx.spuId}</p>
            <p className="text-gray-500">{ctx.customerName}</p>
          </div>
        );
      case 'AMC':
        return (
          <div className="text-xs">
            <p className="font-medium">{ctx.customerName}</p>
            <p className="text-gray-500">{ctx.amcNumber || '-'}</p>
          </div>
        );
      case 'OG':
        return (
          <div className="text-xs">
            <p className="font-medium">{ctx.customerName}</p>
            <p className="text-orange-600">{formatCurrency(ctx.cashAmount)}</p>
          </div>
        );
      case 'RETURN':
        return (
          <div className="text-xs">
            <p className="text-gray-600 truncate max-w-xs">{ctx.returnReason}</p>
          </div>
        );
      case 'RECEIVED_FOR_OTHERS':
        return (
          <div className="text-xs">
            <p className="font-medium">{ctx.receivedFor}</p>
            <span className={`badge ${ctx.transferStatus === 'TRANSFERRED' ? 'badge-spu-cleared' : 'badge-spu-pending'}`}>
              {ctx.transferStatus || 'PENDING'}
            </span>
          </div>
        );
      case 'IN_STOCK':
        return ctx.location || '-';
      default:
        return '-';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{config.label}</h1>
            <span className={`${config.badgeClass} text-sm`}>
              {summary.count} items
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            Total Value: {formatCurrency(summary.totalValue)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="label">Search</label>
            <input
              type="text"
              placeholder="Serial, part name, customer, SPU ID..."
              className="input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="label">From Date (Bill Date)</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>
        </div>

        {/* Active Filters & Reset */}
        {(search || startDate || endDate) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {!isViewer && selectedSerials.length > 0 && (
        <div className="card mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-800">
                {selectedSerials.length} item(s) selected
              </span>
              <button
                onClick={() => setSelectedSerials([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="input py-1 text-sm"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
              >
                <option value="">Move to category...</option>
                {Object.entries(CATEGORY_CONFIG)
                  .filter(([key]) => key !== category)
                  .map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))
                }
              </select>
              <button
                onClick={() => setIsBulkConfirmOpen(true)}
                disabled={!bulkCategory}
                className="btn-primary text-sm disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {!isViewer && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      checked={selectedSerials.length === serials.length && serials.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isViewer ? 7 : 8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : serials.length === 0 ? (
                <tr>
                  <td colSpan={isViewer ? 7 : 8} className="px-4 py-8 text-center text-gray-500">
                    No serial numbers in {config.label}
                  </td>
                </tr>
              ) : (
                serials.map((serial) => (
                  <tr key={serial._id} className={`hover:bg-gray-50 ${selectedSerials.includes(serial._id) ? 'bg-blue-50' : ''}`}>
                    {!isViewer && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          checked={selectedSerials.includes(serial._id)}
                          onChange={() => handleSelect(serial._id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link
                        to={`/serials/${serial._id}`}
                        className="font-mono text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {serial.serialNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{serial.partName}</div>
                      {serial.partCode && (
                        <div className="text-xs text-gray-500">{serial.partCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/bills/${serial.billId?._id || serial.billId}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {serial.voucherNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {serial.billDate ? format(new Date(serial.billDate), 'dd-MM-yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(serial.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      {getContextDisplay(serial)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/serials/${serial._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Totals */}
        {serials.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} items
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-sm text-gray-600">Total Value: </span>
                <span className="text-lg font-bold">{formatCurrency(summary.totalValue)}</span>
              </div>
              {pagination.pages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats for specific categories */}
      {category === 'OG' && serials.length > 0 && (
        <div className="mt-4 card">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-lg font-bold text-green-700">
                {serials.filter(s => s.context?.paymentStatus === 'PAID').length}
              </p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-lg font-bold text-yellow-700">
                {serials.filter(s => s.context?.paymentStatus === 'PENDING').length}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Cash</p>
              <p className="text-lg font-bold text-orange-700">
                {formatCurrency(serials.reduce((sum, s) => sum + (s.context?.cashAmount || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Change Confirmation */}
      <ConfirmDialog
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkCategoryChange}
        title="Confirm Bulk Category Change"
        message={`Are you sure you want to move ${selectedSerials.length} serial number(s) to "${CATEGORY_CONFIG[bulkCategory]?.label}"? This will update all selected items.`}
        confirmText="Yes, Move All"
        isLoading={isProcessing}
        variant="primary"
      />
    </div>
  );
};

export default CategoryView;