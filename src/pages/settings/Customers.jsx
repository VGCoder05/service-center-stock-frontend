import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import customerService from '../../services/customerService';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// Validation schema
const schema = yup.object({
  customerCode: yup
    .string()
    .max(20, 'Code cannot exceed 20 characters'),
  ticketNumber: yup
  .number()
  .max(20, 'Ticket number cannot exceed 20 characters'),
  customerName: yup
    .string()
    .max(150, 'Name cannot exceed 150 characters')
    .required('Customer name is required'),
  contactPerson: yup
    .string()
    .max(100, 'Contact person cannot exceed 100 characters'),
  phone: yup
    .number()
    .max(20, 'Phone cannot exceed 20 characters'),
  email: yup
    .string()
    .email('Please enter a valid email'),
  address: yup
    .string()
    .max(500, 'Address cannot exceed 500 characters'),
  hasAMC: yup.boolean(),
  amcNumber: yup.string().when('hasAMC', {
    is: true,
    then: (schema) => schema.required('AMC number is required')
  }),
  amcStartDate: yup.string(),
  amcEndDate: yup.string(),
  equipmentCovered: yup.string().max(500, 'Equipment covered cannot exceed 500 characters')
});

const Customers = () => {
  const { isAdmin, isViewer } = useAuth();
  
  // State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [amcFilter, setAmcFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      hasAMC: false
    }
  });

  const hasAMC = watch('hasAMC');

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        page: pagination.page,
        limit: pagination.limit
      };
      if (amcFilter !== '') {
        params.hasAMC = amcFilter;
      }
      const response = await customerService.getAll(params);
      setCustomers(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, amcFilter, pagination.page]);

  // Open modal for create
  const handleCreate = () => {
    setEditingCustomer(null);
    reset({
      customerCode: '',
      ticketNumber:'',
      customerName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      hasAMC: false,
      amcNumber: '',
      amcStartDate: '',
      amcEndDate: '',
      equipmentCovered: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    reset({
      customerCode: customer.customerCode || '',
      ticketNumber: customer.ticketNumber || '',
      customerName: customer.customerName,
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      hasAMC: customer.hasAMC || false,
      amcNumber: customer.amcDetails?.amcNumber || '',
      amcStartDate: customer.amcDetails?.startDate 
        ? format(new Date(customer.amcDetails.startDate), 'yyyy-MM-dd') 
        : '',
      amcEndDate: customer.amcDetails?.endDate 
        ? format(new Date(customer.amcDetails.endDate), 'yyyy-MM-dd') 
        : '',
      equipmentCovered: customer.amcDetails?.equipmentCovered || ''
    });
    setIsModalOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (customer) => {
    setDeletingCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  // Submit form (create or update)
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Structure data for API
      const apiData = {
        customerCode: data.customerCode || undefined,
        ticketNumber: data.ticketNumber,
        customerName: data.customerName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        hasAMC: data.hasAMC,
        amcDetails: data.hasAMC ? {
          amcNumber: data.amcNumber,
          startDate: data.amcStartDate || undefined,
          endDate: data.amcEndDate || undefined,
          equipmentCovered: data.equipmentCovered
        } : undefined
      };

      if (editingCustomer) {
        await customerService.update(editingCustomer._id, apiData);
      } else {
        await customerService.create(apiData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingCustomer) return;
    
    setIsSubmitting(true);
    try {
      await customerService.delete(deletingCustomer._id);
      setIsDeleteDialogOpen(false);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if AMC is active
  const isAMCActive = (customer) => {
    if (!customer.hasAMC || !customer.amcDetails?.endDate) return false;
    return new Date(customer.amcDetails.endDate) >= new Date();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage customer master data and AMC details</p>
        </div>
        {!isViewer && (
          <button onClick={handleCreate} className="btn-primary">
            + Add Customer
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by name, code, contact, or phone..."
          className="input max-w-md"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        />
        <select
          className="input max-w-xs"
          value={amcFilter}
          onChange={(e) => {
            setAmcFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <option value="">All Customers</option>
          <option value="true">With AMC</option>
          <option value="false">Without AMC</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">AMC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{customer.customerCode || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{customer.ticketNumber || '-'}</td>
                    <td className="px-4 py-3 font-medium">{customer.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.contactPerson || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.phone || '-'}</td>
                    <td className="px-4 py-3">
                      {customer.hasAMC ? (
                        <span className={`badge ${isAMCActive(customer) ? 'badge-amc' : 'badge-return'}`}>
                          {isAMCActive(customer) ? 'Active' : 'Expired'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${customer.isActive ? 'badge-spu-cleared' : 'badge-uncategorized'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isViewer && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteClick(customer)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Customer Code */}
            <div>
              <label className="label">Customer Code</label>
              <input
                type="text"
                className={errors.customerCode ? 'input-error' : 'input'}
                placeholder="e.g., CUST001 (optional)"
                {...register('customerCode')}
              />
              {errors.customerCode && (
                <p className="error-message">{errors.customerCode.message}</p>
              )}
            </div>
            
            {/* Ticket Number */}
            <div>
              <label className="label">Ticket Number</label>
              <input
                type="number"
                className={errors.ticketNumber ? 'input-error' : 'input'}
                placeholder="e.g., 10191565 (optional)"
                {...register('ticketNumber')}
              />
              {errors.ticketNumber && (
                <p className="error-message">{errors.ticketNumber.message}</p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="label">Customer Name *</label>
              <input
                type="text"
                className={errors.customerName ? 'input-error' : 'input'}
                placeholder="Enter customer name"
                {...register('customerName')}
              />
              {errors.customerName && (
                <p className="error-message">{errors.customerName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Contact Person */}
            <div>
              <label className="label">Contact Person</label>
              <input
                type="text"
                className={errors.contactPerson ? 'input-error' : 'input'}
                placeholder="Enter contact name"
                {...register('contactPerson')}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone</label>
              <input
                type="text"
                className={errors.phone ? 'input-error' : 'input'}
                placeholder="Enter phone number"
                {...register('phone')}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className={errors.email ? 'input-error' : 'input'}
              placeholder="Enter email address"
              {...register('email')}
            />
            {errors.email && (
              <p className="error-message">{errors.email.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="label">Address</label>
            <textarea
              rows={2}
              className={errors.address ? 'input-error' : 'input'}
              placeholder="Enter address"
              {...register('address')}
            />
          </div>

          {/* AMC Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="hasAMC"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                {...register('hasAMC')}
              />
              <label htmlFor="hasAMC" className="text-sm font-medium text-gray-700">
                Has AMC (Annual Maintenance Contract)
              </label>
            </div>

            {hasAMC && (
              <div className="space-y-4 pl-6 border-l-2 border-purple-200">
                <div className="grid grid-cols-3 gap-4">
                  {/* AMC Number */}
                  <div>
                    <label className="label">AMC Number *</label>
                    <input
                      type="text"
                      className={errors.amcNumber ? 'input-error' : 'input'}
                      placeholder="e.g., AMC/2026/001"
                      {...register('amcNumber')}
                    />
                    {errors.amcNumber && (
                      <p className="error-message">{errors.amcNumber.message}</p>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      className="input"
                      {...register('amcStartDate')}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      className="input"
                      {...register('amcEndDate')}
                    />
                  </div>
                </div>

                {/* Equipment Covered */}
                <div>
                  <label className="label">Equipment Covered</label>
                  <textarea
                    rows={2}
                    className="input"
                    placeholder="List equipment covered under AMC"
                    {...register('equipmentCovered')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingCustomer(null);
        }}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deletingCustomer?.customerName}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Customers;