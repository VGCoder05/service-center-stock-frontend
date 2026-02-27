import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import serialService from '../../services/serialService';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG, CATEGORIES } from '../../utils/constants';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // State
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(query);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Fetch serials
  const fetchSerials = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (search) params.search = search;
      if (categoryFilter) params.currentCategory = categoryFilter;

      const response = await serialService.getAll(params);
      setSerials(response.data);
      setPagination(response.pagination);
    } catch (err) {
      showToast.error('Failed to fetch serial numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSerials();
  }, [search, categoryFilter, pagination.page]);

  // Update URL when search changes
  useEffect(() => {
    if (search) {
      setSearchParams({ q: search });
    } else {
      setSearchParams({});
    }
  }, [search]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get category badge
  const getCategoryBadge = (category) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.UNCATEGORIZED;
    return (
      <span className={config.badgeClass}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search Serial Numbers</h1>
        <p className="text-gray-600">
          {pagination.total > 0 
            ? `Found ${pagination.total} result(s)${search ? ` for "${search}"` : ''}`
            : 'Search across all serial numbers'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="label">Search</label>
            <input
              type="text"
              placeholder="Serial number, part name, SPU ID, customer, voucher..."
              className="input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(search || categoryFilter) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer/SPU</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : serials.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    {search ? `No results found for "${search}"` : 'No serial numbers found'}
                  </td>
                </tr>
              ) : (
                serials.map((serial) => (
                  <tr key={serial._id} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(serial.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      {getCategoryBadge(serial.currentCategory)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {serial.context?.customerName || serial.context?.spuId || serial.context?.receivedFor || '-'}
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;