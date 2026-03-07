import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import categoryService from '../../services/categoryService';
import customerService from '../../services/customerService';
import showToast from '../../utils/toast';
import { CATEGORIES, CATEGORY_CONFIG, PAYMENT_STATUS, PAYMENT_MODES } from '../../utils/constants';

const CategorizeModal = ({ isOpen, onClose, serial = null, selectedSerials = [], onSuccess }) => {
  // ✅ FIX 1: Properly determine bulk mode
  const isBulk = selectedSerials && selectedSerials.length > 0;
  
  const [selectedCategory, setSelectedCategory] = useState('UNCATEGORIZED');
  const [customers, setCustomers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  const isChargeable = watch('isChargeable');

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllList();
        setCustomers(response.data);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  // ✅ FIX 2: Reset form handles BOTH single and bulk modes
  useEffect(() => {
    if (!isOpen) return;

    if (isBulk) {
      // Bulk mode: start with clean form
      setSelectedCategory('UNCATEGORIZED');
      reset({
        remarks: '',
        location: '',
        spuId: '',
        ticketId: '',
        spuDate: '',
        customerName: '',
        customerContact: '',
        productModel: '',
        productSerialNumber: '',
        isChargeable: false,
        chargeAmount: '',
        chargeReason: '',
        paymentStatus: '',
        paymentDate: '',
        paymentMode: '',
        amcNumber: '',
        amcServiceDate: '',
        cashAmount: '',
        returnReason: '',
        expectedReturnDate: '',
        receivedFor: '',
        transferStatus: 'PENDING'
      });
    } else if (serial) {
      // Single mode: prefill from existing serial
      setSelectedCategory(serial.currentCategory);
      reset({
        remarks: serial.context?.remarks || '',
        location: serial.context?.location || '',
        spuId: serial.context?.spuId || '',
        ticketId: serial.context?.ticketId || '',
        spuDate: serial.context?.spuDate ? new Date(serial.context.spuDate).toISOString().split('T')[0] : '',
        customerName: serial.context?.customerName || '',
        customerContact: serial.context?.customerContact || '',
        productModel: serial.context?.productModel || '',
        productSerialNumber: serial.context?.productSerialNumber || '',
        isChargeable: serial.context?.isChargeable || false,
        chargeAmount: serial.context?.chargeAmount || '',
        chargeReason: serial.context?.chargeReason || '',
        paymentStatus: serial.context?.paymentStatus || '',
        paymentDate: serial.context?.paymentDate ? new Date(serial.context.paymentDate).toISOString().split('T')[0] : '',
        paymentMode: serial.context?.paymentMode || '',
        amcNumber: serial.context?.amcNumber || '',
        amcServiceDate: serial.context?.amcServiceDate ? new Date(serial.context.amcServiceDate).toISOString().split('T')[0] : '',
        cashAmount: serial.context?.cashAmount || '',
        returnReason: serial.context?.returnReason || '',
        expectedReturnDate: serial.context?.expectedReturnDate ? new Date(serial.context.expectedReturnDate).toISOString().split('T')[0] : '',
        receivedFor: serial.context?.receivedFor || '',
        transferStatus: serial.context?.transferStatus || 'PENDING'
      });
    }
  }, [isOpen, serial, isBulk, reset]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Submit handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      let context = { remarks: data.remarks };

      switch (selectedCategory) {
        case 'IN_STOCK':
          context = { ...context, location: data.location };
          break;
        case 'SPU_PENDING':
        case 'SPU_CLEARED':
          context = {
            ...context,
            spuId: data.spuId,
            ticketId: data.ticketId,
            spuDate: data.spuDate ? new Date(data.spuDate) : null,
            spuStatus: selectedCategory === 'SPU_PENDING' ? 'PENDING' : 'CLEARED',
            customerName: data.customerName,
            customerContact: data.customerContact,
            productModel: data.productModel,
            productSerialNumber: data.productSerialNumber,
            isChargeable: data.isChargeable,
            chargeAmount: data.isChargeable ? parseFloat(data.chargeAmount) || 0 : null,
            chargeReason: data.isChargeable ? data.chargeReason : null,
            paymentStatus: data.isChargeable ? data.paymentStatus : null,
            paymentDate: data.isChargeable && data.paymentDate ? new Date(data.paymentDate) : null,
            paymentMode: data.isChargeable ? data.paymentMode : null
          };
          break;
        case 'AMC':
          context = {
            ...context,
            customerName: data.customerName,
            amcNumber: data.amcNumber,
            amcServiceDate: data.amcServiceDate ? new Date(data.amcServiceDate) : null,
            ticketId: data.ticketId,
            isChargeable: data.isChargeable,
            chargeAmount: data.isChargeable ? parseFloat(data.chargeAmount) || 0 : null,
            chargeReason: data.isChargeable ? data.chargeReason : null,
            paymentStatus: data.isChargeable ? data.paymentStatus : null
          };
          break;
        case 'OG':
          context = {
            ...context,
            customerName: data.customerName,
            ticketId: data.ticketId,
            productModel: data.productModel,
            productSerialNumber: data.productSerialNumber,
            cashAmount: parseFloat(data.cashAmount) || 0,
            isChargeable: true,
            chargeAmount: parseFloat(data.cashAmount) || 0,
            paymentStatus: data.paymentStatus,
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
            paymentMode: data.paymentMode
          };
          break;
        case 'RETURN':
          context = {
            ...context,
            returnReason: data.returnReason,
            expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null
          };
          break;
        case 'RECEIVED_FOR_OTHERS':
          context = {
            ...context,
            receivedFor: data.receivedFor,
            transferStatus: data.transferStatus
          };
          break;
        default:
          break;
      }

      if (isBulk) {
        await categoryService.bulkCategorize({
          serialIds: selectedSerials,
          category: selectedCategory,
          context,
          reason: `Bulk changed to ${selectedCategory}`
        });
        showToast.success(`Successfully categorized ${selectedSerials.length} items as ${CATEGORY_CONFIG[selectedCategory].label}`);
      } else {
        await categoryService.categorize(serial._id, {
          category: selectedCategory,
          context,
          reason: `Changed to ${selectedCategory}`
        });
        showToast.success(`Serial categorized as ${CATEGORY_CONFIG[selectedCategory].label}`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to categorize');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ FIX 3: Allow rendering for bulk mode even without a single serial
  if (!serial && !isBulk) return null;

  // ✅ FIX 4: Dynamic title
  const modalTitle = isBulk
    ? `Bulk Categorize: ${selectedSerials.length} items`
    : `Categorize: ${serial.serialNumber}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ✅ Bulk info banner */}
        {isBulk && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 font-medium">
              ⚡ Bulk Action: This will apply the same category and details to all{' '}
              <span className="font-bold">{selectedSerials.length}</span> selected serial numbers.
            </p>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="label">Category *</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                className={`p-2 text-xs font-medium rounded-lg border-2 transition-all ${
                  selectedCategory === key
                    ? `${config.bgColor} ${config.borderColor} ${config.textColor}`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---- All the dynamic category fields remain exactly the same ---- */}
        <div className="border-t border-gray-200 pt-4">
          {selectedCategory === 'IN_STOCK' && (
            <div>
              <label className="label">Location</label>
              <input type="text" className="input" placeholder="e.g., Rack A-1, Shelf 3" {...register('location')} />
            </div>
          )}

          {(selectedCategory === 'SPU_PENDING' || selectedCategory === 'SPU_CLEARED') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">SPU ID {`${selectedCategory === 'SPU_CLEARED' ? '*' : ""}`}</label>
                  <input type="text" className="input" placeholder="e.g., SPU/2026/001" {...register('spuId', { required: selectedCategory === 'SPU_CLEARED' ? 'SPU ID is required' : false})} />
                  {errors.spuId && <p className="error-message">{errors.spuId.message}</p>}
                </div>
                <div>
                  <label className="label">Ticket ID *</label>
                  <input type="text" className="input" placeholder="e.g., TKT-12345" {...register('ticketId', { required: 'Ticket ID is required' })} />
                  {errors.ticketId && <p className="error-message">{errors.ticketId.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer Name *</label>
                  <input type="text" className="input" placeholder="Enter customer name" list="customer-list" {...register('customerName', { required: 'Customer name is required' })} />
                  <datalist id="customer-list">
                    {customers.map((c) => (<option key={c._id} value={c.customerName} />))}
                  </datalist>
                  {errors.customerName && <p className="error-message">{errors.customerName.message}</p>}
                </div>
                <div>
                  <label className="label">SPU Date {`${selectedCategory === 'SPU_CLEARED' ? '*' : ""}`}</label>
                  <input type="date" className="input" {...register('spuDate', { required: selectedCategory === 'SPU_CLEARED' ? 'SPU Date is required' : false })} />
                  {errors.spuDate && <p className="error-message">{errors.spuDate.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Product Model</label>
                  <input type="text" className="input" placeholder="e.g., Model XYZ" {...register('productModel')} />
                </div>
                <div>
                  <label className="label">Product Serial Number</label>
                  <input type="text" className="input" placeholder="Product's serial number" {...register('productSerialNumber')} />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" id="isChargeable" className="w-4 h-4 text-blue-600 border-gray-300 rounded" {...register('isChargeable')} />
                  <label htmlFor="isChargeable" className="text-sm font-medium text-gray-700">This part is chargeable (not covered in warranty)</label>
                </div>
                {isChargeable && (
                  <div className="pl-6 border-l-2 border-orange-200 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Charge Amount (₹)</label>
                        <input type="number" step="0.01" min="0" className="input" {...register('chargeAmount')} />
                      </div>
                      <div>
                        <label className="label">Payment Status</label>
                        <select className="input" {...register('paymentStatus')}>
                          <option value="">Select status</option>
                          {Object.entries(PAYMENT_STATUS).map(([key, value]) => (<option key={key} value={value}>{value}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Charge Reason</label>
                      <input type="text" className="input" placeholder="e.g., Not covered in warranty" {...register('chargeReason')} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedCategory === 'AMC' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer Name *</label>
                  <input type="text" className="input" placeholder="Enter customer name" list="customer-list" {...register('customerName', { required: 'Customer name is required' })} />
                  {errors.customerName && <p className="error-message">{errors.customerName.message}</p>}
                </div>
                <div>
                  <label className="label">AMC Number</label>
                  <input type="text" className="input" placeholder="e.g., AMC/2026/001" {...register('amcNumber')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Service Date</label>
                  <input type="date" className="input" {...register('amcServiceDate')} />
                </div>
                <div>
                  <label className="label">Ticket ID</label>
                  <input type="text" className="input" placeholder="e.g., TKT-12345" {...register('ticketId')} />
                </div>
              </div>
            </div>
          )}

          {selectedCategory === 'OG' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer Name *</label>
                  <input type="text" className="input" placeholder="Enter customer name" list="customer-list" {...register('customerName', { required: 'Customer name is required' })} />
                  {errors.customerName && <p className="error-message">{errors.customerName.message}</p>}
                </div>
                <div>
                  <label className="label">Cash Amount (₹) *</label>
                  <input type="number" step="0.01" min="0" className="input" {...register('cashAmount', { required: 'Cash amount is required' })} />
                  {errors.cashAmount && <p className="error-message">{errors.cashAmount.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Status *</label>
                  <select className="input" {...register('paymentStatus', { required: 'Payment status is required' })}>
                    <option value="">Select status</option>
                    {Object.entries(PAYMENT_STATUS).map(([key, value]) => (<option key={key} value={value}>{value}</option>))}
                  </select>
                  {errors.paymentStatus && <p className="error-message">{errors.paymentStatus.message}</p>}
                </div>
                <div>
                  <label className="label">Payment Mode</label>
                  <select className="input" {...register('paymentMode')}>
                    <option value="">Select mode</option>
                    {Object.entries(PAYMENT_MODES).map(([key, value]) => (<option key={key} value={value}>{value}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ticket ID</label>
                  <input type="text" className="input" placeholder="e.g., TKT-12345" {...register('ticketId')} />
                </div>
                <div>
                  <label className="label">Payment Date</label>
                  <input type="date" className="input" {...register('paymentDate')} />
                </div>
              </div>
            </div>
          )}

          {selectedCategory === 'RETURN' && (
            <div className="space-y-4">
              <div>
                <label className="label">Return Reason *</label>
                <textarea rows={2} className="input" placeholder="Why is this part being returned?" {...register('returnReason', { required: 'Return reason is required' })} />
                {errors.returnReason && <p className="error-message">{errors.returnReason.message}</p>}
              </div>
              <div>
                <label className="label">Expected Return Date</label>
                <input type="date" className="input" {...register('expectedReturnDate')} />
              </div>
            </div>
          )}

          {selectedCategory === 'RECEIVED_FOR_OTHERS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Received For *</label>
                  <input type="text" className="input" placeholder="e.g., Noor Service Center" {...register('receivedFor', { required: 'This field is required' })} />
                  {errors.receivedFor && <p className="error-message">{errors.receivedFor.message}</p>}
                </div>
                <div>
                  <label className="label">Transfer Status</label>
                  <select className="input" {...register('transferStatus')}>
                    <option value="PENDING">Pending</option>
                    <option value="TRANSFERRED">Transferred</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="label">Remarks</label>
            <textarea rows={2} className="input" placeholder="Any additional notes..." {...register('remarks')} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting
              ? 'Saving...'
              : isBulk
                ? `Categorize ${selectedSerials.length} Items`
                : 'Save Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategorizeModal;