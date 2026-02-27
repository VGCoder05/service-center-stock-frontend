import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import serialService from '../../services/serialService';
import categoryService from '../../services/categoryService';
import CategorizeModal from '../../components/serials/CategorizeModal';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG, PAYMENT_STATUS } from '../../utils/constants';

const SerialDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isViewer } = useAuth();

  // State
  const [serial, setSerial] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);

  // Fetch serial and history
  const fetchData = async () => {
    try {
      setLoading(true);
      const [serialResponse, historyResponse] = await Promise.all([
        serialService.getById(id),
        categoryService.getHistory(id)
      ]);
      setSerial(serialResponse.data);
      setHistory(historyResponse.data);
    } catch (err) {
      showToast.error('Failed to load serial details');
      navigate('/bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
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
      <span className={`${config.badgeClass} text-sm`}>
        {config.label}
      </span>
    );
  };

  // Get movement type badge
  const getMovementBadge = (type) => {
    const badges = {
      'INITIAL_ENTRY': 'bg-gray-100 text-gray-800',
      'CATEGORIZED': 'bg-green-100 text-green-800',
      'CATEGORY_CHANGE': 'bg-blue-100 text-blue-800',
      'CONTEXT_UPDATE': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_UPDATE': 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[type] || badges['INITIAL_ENTRY']}`}>
        {type.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!serial) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Serial not found</h2>
          <Link to="/bills" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Bills
          </Link>
        </div>
      </div>
    );
  }

  const config = CATEGORY_CONFIG[serial.currentCategory] || CATEGORY_CONFIG.UNCATEGORIZED;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              to={`/bills/${serial.billId?._id || serial.billId}`} 
              className="text-gray-500 hover:text-gray-700"
            >
              ← {serial.voucherNumber}
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{serial.serialNumber}</h1>
          </div>
          <div className="flex items-center gap-3">
            {getCategoryBadge(serial.currentCategory)}
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{serial.partName}</span>
          </div>
        </div>
        {!isViewer && (
          <button
            onClick={() => setIsCategorizeModalOpen(true)}
            className="btn-primary"
          >
            Change Category
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Part & Bill Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Part Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Part Name</p>
                <p className="font-medium">{serial.partName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Part Code</p>
                <p className="font-medium">{serial.partCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Price</p>
                <p className="font-medium text-lg">{formatCurrency(serial.unitPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-medium">{serial.supplierName || '-'}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Bill Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Voucher Number</p>
                  <Link 
                    to={`/bills/${serial.billId?._id || serial.billId}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {serial.voucherNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company Bill</p>
                  <p className="font-medium">{serial.companyBillNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bill Date</p>
                  <p className="font-medium">
                    {serial.billDate ? format(new Date(serial.billDate), 'dd MMM yyyy') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categorized Date</p>
                  <p className="font-medium">
                    {serial.categorizedDate ? format(new Date(serial.categorizedDate), 'dd MMM yyyy') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Context */}
          <div className={`card border-2 ${config.borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Category Details</h3>
              {getCategoryBadge(serial.currentCategory)}
            </div>

            {serial.currentCategory === 'UNCATEGORIZED' ? (
              <p className="text-gray-500 italic">
                This serial number has not been categorized yet.
              </p>
            ) : (
              <div className="space-y-4">
                {/* SPU Details */}
                {(serial.currentCategory === 'SPU_PENDING' || serial.currentCategory === 'SPU_CLEARED') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">SPU ID</p>
                      <p className="font-medium">{serial.context?.spuId || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ticket ID</p>
                      <p className="font-medium">{serial.context?.ticketId || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{serial.context?.customerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">SPU Date</p>
                      <p className="font-medium">
                        {serial.context?.spuDate ? format(new Date(serial.context.spuDate), 'dd MMM yyyy') : '-'}
                      </p>
                    </div>
                    {serial.context?.productModel && (
                      <div>
                        <p className="text-sm text-gray-500">Product Model</p>
                        <p className="font-medium">{serial.context.productModel}</p>
                      </div>
                    )}
                    {serial.context?.productSerialNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Product Serial</p>
                        <p className="font-medium">{serial.context.productSerialNumber}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* AMC Details */}
                {serial.currentCategory === 'AMC' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{serial.context?.customerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">AMC Number</p>
                      <p className="font-medium">{serial.context?.amcNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Service Date</p>
                      <p className="font-medium">
                        {serial.context?.amcServiceDate ? format(new Date(serial.context.amcServiceDate), 'dd MMM yyyy') : '-'}
                      </p>
                    </div>
                  </div>
                )}

                {/* OG Details */}
                {serial.currentCategory === 'OG' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{serial.context?.customerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cash Amount</p>
                      <p className="font-medium text-lg text-orange-600">
                        {formatCurrency(serial.context?.cashAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <span className={`badge ${serial.context?.paymentStatus === 'PAID' ? 'badge-spu-cleared' : 'badge-spu-pending'}`}>
                        {serial.context?.paymentStatus || '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Mode</p>
                      <p className="font-medium">{serial.context?.paymentMode || '-'}</p>
                    </div>
                  </div>
                )}

                {/* Return Details */}
                {serial.currentCategory === 'RETURN' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Return Reason</p>
                      <p className="font-medium">{serial.context?.returnReason || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expected Return Date</p>
                      <p className="font-medium">
                        {serial.context?.expectedReturnDate ? format(new Date(serial.context.expectedReturnDate), 'dd MMM yyyy') : '-'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Received for Others Details */}
                {serial.currentCategory === 'RECEIVED_FOR_OTHERS' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Received For</p>
                      <p className="font-medium">{serial.context?.receivedFor || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transfer Status</p>
                      <span className={`badge ${serial.context?.transferStatus === 'TRANSFERRED' ? 'badge-spu-cleared' : 'badge-spu-pending'}`}>
                        {serial.context?.transferStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>
                )}

                {/* IN_STOCK Details */}
                {serial.currentCategory === 'IN_STOCK' && serial.context?.location && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{serial.context.location}</p>
                  </div>
                )}

                {/* Chargeable Info */}
                {serial.context?.isChargeable && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-orange-600 mb-3">💰 Chargeable</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Charge Amount</p>
                        <p className="font-medium">{formatCurrency(serial.context.chargeAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Status</p>
                        <span className={`badge ${serial.context?.paymentStatus === 'PAID' ? 'badge-spu-cleared' : 'badge-spu-pending'}`}>
                          {serial.context?.paymentStatus || '-'}
                        </span>
                      </div>
                      {serial.context?.chargeReason && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Reason</p>
                          <p className="font-medium">{serial.context.chargeReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {serial.context?.remarks && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-sm text-gray-500">Remarks</p>
                    <p className="font-medium">{serial.context.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Movement History Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Movement History</h3>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No movement history yet.</p>
            ) : (
              <div className="space-y-4">
                {history.map((movement, index) => (
                  <div 
                    key={movement._id} 
                    className={`relative pl-4 ${index !== history.length - 1 ? 'pb-4 border-l-2 border-gray-200' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-1.5 top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                    
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        {getMovementBadge(movement.movementType)}
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-600">
                        {movement.fromCategory && (
                          <>
                            <span className="text-xs">{CATEGORY_CONFIG[movement.fromCategory]?.label}</span>
                            <span>→</span>
                          </>
                        )}
                        <span className="text-xs font-medium">{CATEGORY_CONFIG[movement.toCategory]?.label}</span>
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        <p>{movement.performedByName || 'System'}</p>
                        <p>{format(new Date(movement.timestamp), 'dd MMM yyyy, hh:mm a')}</p>
                      </div>

                      {movement.reason && (
                        <p className="mt-1 text-xs text-gray-600 italic">"{movement.reason}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="card mt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="font-medium">{serial.createdByName || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Created At</p>
                <p className="font-medium">
                  {format(new Date(serial.createdAt), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(serial.updatedAt), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categorize Modal */}
      <CategorizeModal
        isOpen={isCategorizeModalOpen}
        onClose={() => setIsCategorizeModalOpen(false)}
        serial={serial}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default SerialDetails;