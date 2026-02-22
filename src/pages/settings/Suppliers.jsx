import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import supplierService from '../../services/supplierService';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// Validation schema
const schema = yup.object({
  supplierCode: yup
    .string()
    .max(20, 'Code cannot exceed 20 characters')
    .required('Supplier code is required'),
  supplierName: yup
    .string()
    .max(100, 'Name cannot exceed 100 characters')
    .required('Supplier name is required'),
  contactPerson: yup
    .string()
    .max(100, 'Contact person cannot exceed 100 characters'),
  phone: yup
    .string()
    .max(20, 'Phone cannot exceed 20 characters'),
  email: yup
    .string()
    .email('Please enter a valid email'),
  address: yup
    .string()
    .max(500, 'Address cannot exceed 500 characters')
});

const Suppliers = () => {
  const { isAdmin, isViewer } = useAuth();
  
  // State
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll({
        search,
        page: pagination.page,
        limit: pagination.limit
      });
      setSuppliers(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, pagination.page]);

  // Open modal for create
  const handleCreate = () => {
    setEditingSupplier(null);
    reset({
      supplierCode: '',
      supplierName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    reset({
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setIsModalOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  // Submit form (create or update)
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier._id, data);
      } else {
        await supplierService.create(data);
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingSupplier) return;
    
    setIsSubmitting(true);
    try {
      await supplierService.delete(deletingSupplier._id);
      setIsDeleteDialogOpen(false);
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage supplier master data</p>
        </div>
        {!isViewer && (
          <button onClick={handleCreate} className="btn-primary">
            + Add Supplier
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by code, name, or contact..."
          className="input max-w-md"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{supplier.supplierCode}</td>
                    <td className="px-4 py-3 font-medium">{supplier.supplierName}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.contactPerson || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${supplier.isActive ? 'badge-spu-cleared' : 'badge-uncategorized'}`}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isViewer && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteClick(supplier)}
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
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Supplier Code */}
            <div>
              <label className="label">Supplier Code *</label>
              <input
                type="text"
                className={errors.supplierCode ? 'input-error' : 'input'}
                placeholder="e.g., SUP001"
                {...register('supplierCode')}
              />
              {errors.supplierCode && (
                <p className="error-message">{errors.supplierCode.message}</p>
              )}
            </div>

            {/* Supplier Name */}
            <div>
              <label className="label">Supplier Name *</label>
              <input
                type="text"
                className={errors.supplierName ? 'input-error' : 'input'}
                placeholder="Enter supplier name"
                {...register('supplierName')}
              />
              {errors.supplierName && (
                <p className="error-message">{errors.supplierName.message}</p>
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
              {errors.contactPerson && (
                <p className="error-message">{errors.contactPerson.message}</p>
              )}
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
              {errors.phone && (
                <p className="error-message">{errors.phone.message}</p>
              )}
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
              rows={3}
              className={errors.address ? 'input-error' : 'input'}
              placeholder="Enter address"
              {...register('address')}
            />
            {errors.address && (
              <p className="error-message">{errors.address.message}</p>
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
              {isSubmitting ? 'Saving...' : editingSupplier ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingSupplier(null);
        }}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${deletingSupplier?.supplierName}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Suppliers;