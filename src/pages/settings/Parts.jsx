import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import partsService from '../../services/partsService';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import showToast from '../../utils/toast';

// Unit options
const UNIT_OPTIONS = ['Pcs', 'Kg', 'Meter', 'Box', 'Set', 'Pair', 'Unit'];

// Validation schema
const schema = yup.object({
  partCode: yup
    .string()
    .max(30, 'Code cannot exceed 30 characters')
    .required('Part code is required'),
  partName: yup
    .string()
    .max(150, 'Name cannot exceed 150 characters')
    .required('Part name is required'),
  description: yup
    .string()
    .max(500, 'Description cannot exceed 500 characters'),
  category: yup
    .string()
    .max(50, 'Category cannot exceed 50 characters'),
  unit: yup
    .string()
    .oneOf(UNIT_OPTIONS, 'Invalid unit'),
  reorderPoint: yup
    .number()
    .transform((value) => (isNaN(value) ? 0 : value))
    .min(0, 'Reorder point cannot be negative'),
  avgUnitPrice: yup
    .number()
    .transform((value) => (isNaN(value) ? 0 : value))
    .min(0, 'Price cannot be negative')
});

const Parts = () => {
  const { isAdmin, isViewer } = useAuth();
  
  // State
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      unit: 'Pcs',
      reorderPoint: 0,
      avgUnitPrice: 0
    }
  });

  // Fetch parts
  const fetchParts = async () => {
    try {
      setLoading(true);
      const response = await partsService.getAll({
        search,
        category: categoryFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      setParts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch parts');
      showToast.error(err.response?.data?.error || 'Failed to fetch parts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter dropdown
  const fetchCategories = async () => {
    try {
      const response = await partsService.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      showToast.error(err || 'Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchParts();
  }, [search, categoryFilter, pagination.page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Open modal for create
  const handleCreate = () => {
    setEditingPart(null);
    reset({
      partCode: '',
      partName: '',
      description: '',
      category: '',
      unit: 'Pcs',
      reorderPoint: 0,
      avgUnitPrice: 0
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (part) => {
    setEditingPart(part);
    reset({
      partCode: part.partCode,
      partName: part.partName,
      description: part.description || '',
      category: part.category || '',
      unit: part.unit || 'Pcs',
      reorderPoint: part.reorderPoint || 0,
      avgUnitPrice: part.avgUnitPrice || 0
    });
    setIsModalOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (part) => {
    setDeletingPart(part);
    setIsDeleteDialogOpen(true);
  };

  // Submit form (create or update)
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (editingPart) {
        await partsService.update(editingPart._id, data);
      showToast.success('Part updated successfully');
      } else {
        await partsService.create(data);
        showToast.success('Part created successfully');
      }
      setIsModalOpen(false);
      fetchParts();
      fetchCategories(); // Refresh categories in case new one was added
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
      showToast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deletingPart) return;
    
    setIsSubmitting(true);
    try {
      await partsService.delete(deletingPart._id);
      showToast.success('Part deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingPart(null);
      fetchParts();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
      showToast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Master</h1>
          <p className="text-gray-600">Manage spare parts catalog</p>
        </div>
        {!isViewer && (
          <button onClick={handleCreate} className="btn-primary">
            + Add Part
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
          placeholder="Search by code, name, or description..."
          className="input max-w-md"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        />
        <select
          className="input max-w-xs"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Avg Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Reorder Pt</th>
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
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No parts found
                  </td>
                </tr>
              ) : (
                parts.map((part) => (
                  <tr key={part._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{part.partCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{part.partName}</div>
                      {part.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{part.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{part.category || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{part.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(part.avgUnitPrice)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{part.reorderPoint}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${part.isActive ? 'badge-spu-cleared' : 'badge-uncategorized'}`}>
                        {part.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isViewer && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(part)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteClick(part)}
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
        title={editingPart ? 'Edit Part' : 'Add Part'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Part Code */}
            <div>
              <label className="label">Part Code *</label>
              <input
                type="text"
                className={errors.partCode ? 'input-error' : 'input'}
                placeholder="e.g., CAP-100UF"
                {...register('partCode')}
              />
              {errors.partCode && (
                <p className="error-message">{errors.partCode.message}</p>
              )}
            </div>

            {/* Part Name */}
            <div>
              <label className="label">Part Name *</label>
              <input
                type="text"
                className={errors.partName ? 'input-error' : 'input'}
                placeholder="Enter part name"
                {...register('partName')}
              />
              {errors.partName && (
                <p className="error-message">{errors.partName.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              className={errors.description ? 'input-error' : 'input'}
              placeholder="Enter description"
              {...register('description')}
            />
            {errors.description && (
              <p className="error-message">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                className={errors.category ? 'input-error' : 'input'}
                placeholder="e.g., Electronics"
                list="category-list"
                {...register('category')}
              />
              <datalist id="category-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              {errors.category && (
                <p className="error-message">{errors.category.message}</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="label">Unit</label>
              <select
                className={errors.unit ? 'input-error' : 'input'}
                {...register('unit')}
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              {errors.unit && (
                <p className="error-message">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Average Unit Price */}
            <div>
              <label className="label">Average Unit Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={errors.avgUnitPrice ? 'input-error' : 'input'}
                placeholder="0.00"
                {...register('avgUnitPrice')}
              />
              {errors.avgUnitPrice && (
                <p className="error-message">{errors.avgUnitPrice.message}</p>
              )}
            </div>

            {/* Reorder Point */}
            <div>
              <label className="label">Reorder Point</label>
              <input
                type="number"
                min="0"
                className={errors.reorderPoint ? 'input-error' : 'input'}
                placeholder="0"
                {...register('reorderPoint')}
              />
              {errors.reorderPoint && (
                <p className="error-message">{errors.reorderPoint.message}</p>
              )}
            </div>
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
              {isSubmitting ? 'Saving...' : editingPart ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingPart(null);
        }}
        onConfirm={handleDelete}
        title="Delete Part"
        message={`Are you sure you want to delete part "${deletingPart?.partName}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Parts;