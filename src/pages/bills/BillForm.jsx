import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import billService from '../../services/billService';
import supplierService from '../../services/supplierService';
import showToast from '../../utils/toast';

// Validation schema
const schema = yup.object({
  voucherNumber: yup
    .string()
    .max(30, 'Voucher number cannot exceed 30 characters')
    .required('Voucher number is required'),
  companyBillNumber: yup
    .string()
    .max(50, 'Company bill number cannot exceed 50 characters'),
  billDate: yup
    .string()
    .required('Bill date is required'),
  supplierId: yup
    .string()
    .required('Supplier is required'),
  totalBillAmount: yup
    .number()
    .typeError('Amount must be a number')
    .min(0, 'Amount cannot be negative')
    .required('Total bill amount is required'),
  notes: yup
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
});

const BillForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [suppliers, setSuppliers] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      voucherNumber: '',
      companyBillNumber: '',
      billDate: format(new Date(), 'yyyy-MM-dd'),
      supplierId: '',
      totalBillAmount: '',
      notes: ''
    }
  });

  // Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await supplierService.getAllList();
        setSuppliers(response.data);
      } catch (err) {
        showToast.error('Failed to load suppliers');
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch bill data in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchBill = async () => {
        try {
          setPageLoading(true);
          const response = await billService.getById(id);
          const bill = response.data;
          reset({
            voucherNumber: bill.voucherNumber,
            companyBillNumber: bill.companyBillNumber || '',
            billDate: format(new Date(bill.billDate), 'yyyy-MM-dd'),
            supplierId: bill.supplierId._id || bill.supplierId,
            totalBillAmount: bill.totalBillAmount,
            notes: bill.notes || ''
          });
        } catch (err) {
          showToast.error('Failed to load bill');
          navigate('/bills');
        } finally {
          setPageLoading(false);
        }
      };
      fetchBill();
    }
  }, [id, isEditMode, reset, navigate]);

  // Submit form
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditMode) {
        await billService.update(id, data);
        showToast.success('Bill updated successfully');
      } else {
        const response = await billService.create(data);
        showToast.success('Bill created successfully');
        // Navigate to bill details to add serial numbers
        navigate(`/bills/${response.data._id}`);
        return;
      }
      navigate('/bills');
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (pageLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Bill' : 'Create New Bill'}
        </h1>
        <p className="text-gray-600">
          {isEditMode ? 'Update bill header information' : 'Enter bill details to create a new entry'}
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Row 1: Voucher Number & Company Bill Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Voucher Number *</label>
              <input
                type="text"
                className={errors.voucherNumber ? 'input-error' : 'input'}
                placeholder="e.g., VCH/2026/001"
                {...register('voucherNumber')}
              />
              {errors.voucherNumber && (
                <p className="error-message">{errors.voucherNumber.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Your internal voucher/receipt number</p>
            </div>

            <div>
              <label className="label">Company Bill Number</label>
              <input
                type="text"
                className={errors.companyBillNumber ? 'input-error' : 'input'}
                placeholder="e.g., INV-2026-12345"
                {...register('companyBillNumber')}
              />
              {errors.companyBillNumber && (
                <p className="error-message">{errors.companyBillNumber.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Supplier's original invoice number</p>
            </div>
          </div>

          {/* Row 2: Bill Date & Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Bill Date *</label>
              <input
                type="date"
                className={errors.billDate ? 'input-error' : 'input'}
                {...register('billDate')}
              />
              {errors.billDate && (
                <p className="error-message">{errors.billDate.message}</p>
              )}
            </div>

            <div>
              <label className="label">Supplier *</label>
              <select
                className={errors.supplierId ? 'input-error' : 'input'}
                {...register('supplierId')}
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.supplierCode} - {supplier.supplierName}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="error-message">{errors.supplierId.message}</p>
              )}
            </div>
          </div>

          {/* Row 3: Total Bill Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Total Bill Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={errors.totalBillAmount ? 'input-error' : 'input'}
                placeholder="0.00"
                {...register('totalBillAmount')}
              />
              {errors.totalBillAmount && (
                <p className="error-message">{errors.totalBillAmount.message}</p>
              )}
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              rows={3}
              className={errors.notes ? 'input-error' : 'input'}
              placeholder="Any additional notes about this bill..."
              {...register('notes')}
            />
            {errors.notes && (
              <p className="error-message">{errors.notes.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/bills')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Bill' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      {!isEditMode && (
        <div className="mt-6 max-w-3xl p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Next Steps</h3>
          <p className="text-sm text-blue-700">
            After creating the bill, you'll be redirected to the bill details page where you can add serial numbers (parts) to this bill.
          </p>
        </div>
      )}
    </div>
  );
};

export default BillForm;