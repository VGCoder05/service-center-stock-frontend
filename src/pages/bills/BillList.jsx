import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import billService from '../../services/billService';
import supplierService from '../../services/supplierService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import showToast from '../../utils/toast';

const BillList = () => {
  const navigate = useNavigate();
  const { isAdmin, isViewer } = useAuth();

  // State
  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categorizationFilter, setCategorizationFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingBill, setDeletingBill] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch bills
  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (search) params.search = search;
      if (supplierId) params.supplierId = supplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (categorizationFilter !== '') params.isFullyCategorized = categorizationFilter;

      const response = await billService.getAll(params);
      setBills(response.data);
      setPagination(response.pagination);
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  // Fetch suppliers for filter
  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAllList();
      setSuppliers(response.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search, supplierId, startDate, endDate, categorizationFilter, pagination.page]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Delete bill
  const handleDeleteClick = (bill) => {
    setDeletingBill(bill);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBill) return;

    setIsDeleting(true);
    try {
      await billService.delete(deletingBill._id);
      showToast.success('Bill deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingBill(null);
      fetchBills();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setSupplierId('');
    setStartDate('');
    setEndDate('');
    setCategorizationFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get categorization badge
  const getCategorizationBadge = (bill) => {
    if (bill.totalSerialNumbers === 0) {
      return <span className="badge-uncategorized">No Items</span>;
    }
    if (bill.isFullyCategorized) {
      return <span className="badge-spu-cleared">Fully Categorized</span>;
    }
    const uncategorized = bill.categorySummary?.UNCATEGORIZED || 0;
    return (
      <span className="badge-spu-pending">
        {uncategorized} Pending
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600">Manage bill entries and serial numbers</p>
        </div>
        {!isViewer && (
          <button
            onClick={() => navigate('/bills/new')}
            className="btn-primary"
          >
            + Create Bill
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="label">Search</label>
            <input
              type="text"
              placeholder="Voucher or company bill..."
              className="input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="label">Supplier</label>
            <select
              className="input"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="label">From Date</label>
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

          {/* Categorization Status */}
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={categorizationFilter}
              onChange={(e) => {
                setCategorizationFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All</option>
              <option value="true">Fully Categorized</option>
              <option value="false">Pending Categorization</option>
            </select>
          </div>
        </div>

        {/* Reset Filters */}
        {(search || supplierId || startDate || endDate || categorizationFilter) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Voucher No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company Bill</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
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
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No bills found
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/bills/${bill._id}`}
                        className="font-mono text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {bill.voucherNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {bill.companyBillNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(bill.billDate), 'dd-MM-yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{bill.supplierName}</div>
                      <div className="text-xs text-gray-500">{bill.supplierCode}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(bill.totalBillAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                        {bill.totalSerialNumbers}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getCategorizationBadge(bill)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/bills/${bill._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </Link>
                        {!isViewer && (
                          <Link
                            to={`/bills/${bill._id}/edit`}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Edit
                          </Link>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(bill)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingBill(null);
        }}
        onConfirm={handleDelete}
        title="Delete Bill"
        message={
          deletingBill?.totalSerialNumbers > 0
            ? `This bill has ${deletingBill.totalSerialNumbers} serial number(s). You must delete them first.`
            : `Are you sure you want to delete bill "${deletingBill?.voucherNumber}"? This action cannot be undone.`
        }
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BillList;