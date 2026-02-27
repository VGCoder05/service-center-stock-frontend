import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import billService from '../../services/billService';
import serialService from '../../services/serialService';
import AddSerialModal from '../../components/bills/AddSerialModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG } from '../../utils/constants';

const BillDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isViewer } = useAuth();

  // State
  const [bill, setBill] = useState(null);
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSerial, setDeletingSerial] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch bill and serials
  const fetchData = async () => {
    try {
      setLoading(true);
      const [billResponse, serialsResponse] = await Promise.all([
        billService.getById(id),
        serialService.getByBillId(id)
      ]);
      setBill(billResponse.data);
      setSerials(serialsResponse.data);
    } catch (err) {
      showToast.error('Failed to load bill details');
      navigate('/bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Handle serial delete
  const handleDeleteClick = (serial) => {
    setDeletingSerial(serial);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSerial) return;

    setIsDeleting(true);
    try {
      await serialService.delete(deletingSerial._id);
      showToast.success('Serial number deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingSerial(null);
      fetchData(); // Refresh data
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Calculate totals
  const totalValue = serials.reduce((sum, s) => sum + (s.unitPrice || 0), 0);
  const categoryBreakdown = serials.reduce((acc, s) => {
    acc[s.currentCategory] = (acc[s.currentCategory] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Bill not found</h2>
          <Link to="/bills" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Bills
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/bills" className="text-gray-500 hover:text-gray-700">
              ← Bills
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-bold text-gray-900">{bill.voucherNumber}</h1>
          </div>
          <p className="text-gray-600">
            {bill.companyBillNumber && `Company Bill: ${bill.companyBillNumber} • `}
            {format(new Date(bill.billDate), 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          {!isViewer && (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary"
              >
                + Add Serial Numbers
              </button>
              <Link
                to={`/bills/${id}/edit`}
                className="btn-secondary"
              >
                Edit Bill
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bill Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Supplier */}
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Supplier</p>
          <p className="font-semibold">{bill.supplierName}</p>
          <p className="text-sm text-gray-500">{bill.supplierCode}</p>
        </div>

        {/* Bill Amount */}
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Bill Amount</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(bill.totalBillAmount)}
          </p>
        </div>

        {/* Items Count */}
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Serial Numbers</p>
          <p className="text-xl font-bold text-gray-900">{serials.length}</p>
          <p className="text-sm text-gray-500">
            Value: {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Status */}
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          {serials.length === 0 ? (
            <span className="badge-uncategorized">No Items</span>
          ) : bill.isFullyCategorized ? (
            <span className="badge-spu-cleared">Fully Categorized</span>
          ) : (
            <span className="badge-spu-pending">
              {bill.categorySummary?.UNCATEGORIZED || 0} Pending
            </span>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {serials.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryBreakdown).map(([category, count]) => {
              const config = CATEGORY_CONFIG[category];
              return (
                <div
                  key={category}
                  className={`px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <span className={`text-sm font-medium ${config.textColor}`}>
                    {config.label}: {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {bill.notes && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
          <p className="text-gray-600">{bill.notes}</p>
        </div>
      )}

      {/* Serial Numbers Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Serial Numbers ({serials.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {serials.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="mb-2">No serial numbers added yet</p>
                      {!isViewer && (
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Add your first serial number
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                serials.map((serial) => (
                  <tr key={serial._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium">
                        {serial.serialNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{serial.partName}</div>
                      {serial.partCode && (
                        <div className="text-xs text-gray-500">{serial.partCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatCurrency(serial.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      {getCategoryBadge(serial.currentCategory)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/serials/${serial._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(serial)}
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

        {/* Totals */}
        {serials.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <div className="text-right">
                <span className="text-sm text-gray-600">Total Value: </span>
                <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Created by: {bill.receivedByName || 'Unknown'}</p>
        <p>Created at: {format(new Date(bill.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
      </div>

      {/* Add Serial Modal */}
      <AddSerialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        billId={id}
        onSuccess={fetchData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingSerial(null);
        }}
        onConfirm={handleDelete}
        title="Delete Serial Number"
        message={`Are you sure you want to delete serial number "${deletingSerial?.serialNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BillDetails;