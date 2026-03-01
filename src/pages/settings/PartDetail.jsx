import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import partsService from '../../services/partsService';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG } from '../../utils/constants';

const PartDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isViewer } = useAuth();

  const [part, setPart] = useState(null);
  const [stock, setStock] = useState(null);
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serialsLoading, setSerialsLoading] = useState(false);

  // ═══════════════════════════════════════════
  // Filters & Pagination
  // ═══════════════════════════════════════════
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // ═══════════════════════════════════════════
  // Single API call — fetches stock + serials
  // ═══════════════════════════════════════════
  const fetchPartData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      else setSerialsLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };
      if (categoryFilter) params.currentCategory = categoryFilter;
      if (search) params.search = search;

      const response = await partsService.getPartStock(id, params);
      const { part, stock, serials } = response.data.data;

      setPart(part);
      setStock(stock);
      setSerials(serials);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (err) {
      showToast.error('Failed to load part details');
      if (isInitialLoad) navigate('/parts');
    } finally {
      setLoading(false);
      setSerialsLoading(false);
    }
  }, [id, pagination.page, pagination.limit, categoryFilter, search, sortBy, sortOrder, navigate]);

  // ═══════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════

  // Initial load
  useEffect(() => {
    fetchPartData(true);
  }, [id]);

  // Refetch when filters/pagination change (not initial)
  useEffect(() => {
    if (part) fetchPartData(false);
  }, [pagination.page, categoryFilter, search, sortBy, sortOrder]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [categoryFilter, search]);

  // ═══════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCategoryBadge = (category) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.UNCATEGORIZED;
    return (
      <span className={config.badgeClass}>
        {config.label}
      </span>
    );
  };

  // ═══════════════════════════════════════════
  // Loading / Not Found states
  // ═══════════════════════════════════════════
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="p-6 text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Part not found
        </h2>
        <Link to="/parts" className="text-blue-600 hover:text-blue-800 
                                     mt-2 inline-block">
          ← Back to Parts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* ═══════════════ Header ═══════════════ */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/parts" className="text-gray-500 hover:text-gray-700">
              ← Parts
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-bold text-gray-900">
              {part.partName}
            </h1>
          </div>
          <p className="text-gray-600 font-mono">{part.partCode}</p>
        </div>
        <span className={`badge ${part.isActive 
          ? 'badge-spu-cleared' 
          : 'badge-uncategorized'}`}
        >
          {part.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* ═══════════════ Info Cards ═══════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Category</p>
          <p className="font-semibold">{part.category || 'Uncategorized'}</p>
          <p className="text-sm text-gray-500">Unit: {part.unit}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Avg Unit Price</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(part.avgUnitPrice)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Total Serial Numbers</p>
          <p className="text-xl font-bold text-gray-900">
            {stock?.totalSerials || 0}
          </p>
          <p className="text-sm text-gray-500">
            Value: {formatCurrency(stock?.totalValue)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Reorder Point</p>
          <p className="text-xl font-bold text-gray-900">
            {part.reorderPoint || 0}
          </p>
          {stock?.categoryBreakdown?.IN_STOCK && 
           stock.categoryBreakdown.IN_STOCK.count <= part.reorderPoint && (
            <p className="text-sm text-red-600 font-medium">
              ⚠ Below reorder point
            </p>
          )}
        </div>
      </div>

      {/* ═══════════════ Category Breakdown ═══════════════ */}
      {stock && stock.totalSerials > 0 && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Stock by Category
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stock.categoryBreakdown).map(
              ([category, data]) => {
                const config = CATEGORY_CONFIG[category] || 
                               CATEGORY_CONFIG.UNCATEGORIZED;
                return (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(
                      categoryFilter === category ? '' : category
                    )}
                    className={`px-3 py-2 rounded-lg border transition-all
                      ${categoryFilter === category 
                        ? `${config.bgColor} ${config.borderColor} ring-2 ring-offset-1` 
                        : `${config.bgColor} ${config.borderColor} hover:shadow-sm`
                      }`}
                  >
                    <span className={`text-sm font-medium ${config.textColor}`}>
                      {config.label}: {data.count}
                    </span>
                    <span className={`block text-xs ${config.textColor} opacity-75`}>
                      {formatCurrency(data.value)}
                    </span>
                  </button>
                );
              }
            )}
          </div>
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter('')}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              ← Clear filter
            </button>
          )}
        </div>
      )}

      {/* ═══════════════ Description ═══════════════ */}
      {part.description && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Description
          </h3>
          <p className="text-gray-600">{part.description}</p>
        </div>
      )}

      {/* ═══════════════ Serial Numbers Table ═══════════════ */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex 
                        justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            Serial Numbers 
            ({pagination.total || serials.length})
            {categoryFilter && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                — filtered by {CATEGORY_CONFIG[categoryFilter]?.label || 
                              categoryFilter}
              </span>
            )}
          </h3>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 
                       text-sm w-64 focus:outline-none focus:ring-2 
                       focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Serial Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Bill</th>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Bill Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold 
                               text-gray-600 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold 
                               text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {serialsLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center 
                                             text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : serials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center 
                                             text-gray-500">
                    {categoryFilter || search
                      ? 'No serial numbers match your filters' 
                      : 'No serial numbers linked to this part'}
                  </td>
                </tr>
              ) : (
                serials.map((serial) => (
                  <tr key={serial._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/serials/${serial._id}`}
                        className="font-mono text-sm text-blue-600 
                                   hover:text-blue-800 font-medium"
                      >
                        {serial.serialNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {serial.billId ? (
                        <Link
                          to={`/bills/${serial.billId._id || serial.billId}`}
                          className="text-sm text-blue-600 
                                     hover:text-blue-800"
                        >
                          {serial.voucherNumber || 
                           serial.billId.voucherNumber}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {serial.billDate 
                        ? format(new Date(serial.billDate), 'dd-MM-yyyy')
                        : serial.billId?.billDate 
                          ? format(
                              new Date(serial.billId.billDate), 
                              'dd-MM-yyyy'
                            )
                          : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatCurrency(serial.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      {getCategoryBadge(serial.currentCategory)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/serials/${serial._id}`}
                        className="text-blue-600 hover:text-blue-800 
                                   text-sm font-medium"
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex 
                          items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(
                pagination.page * pagination.limit, pagination.total
              )} of {pagination.total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ 
                  ...prev, page: prev.page - 1 
                }))}
                disabled={pagination.page === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ 
                  ...prev, page: prev.page + 1 
                }))}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartDetail;