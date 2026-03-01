import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';               
import { useAuth } from '../../contexts/AuthContext';
import partsService from '../../services/partsService';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import showToast from '../../utils/toast';
import { CATEGORY_CONFIG } from '../../utils/constants';       

// Unit options (same)
const UNIT_OPTIONS = ['Pcs', 'Kg', 'Meter', 'Box', 'Set', 'Pair', 'Unit'];

// Validation schema (same - no changes)
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
  const navigate = useNavigate();                              
  
  // State
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showStock, setShowStock] = useState(true);            
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Modal state (same)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form (same)
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

  // ════════════════════════════════════════════════════
  // CHANGED: Fetch parts WITH stock data
  // ════════════════════════════════════════════════════
  const fetchParts = async () => {
    try {
      setLoading(true);
      
      let response;
      if (showStock) {
        // NEW: Use the stock-aware endpoint
        response = await partsService.getPartsWithStock({
          search,
          category: categoryFilter,
          page: pagination.page,
          limit: pagination.limit
        });
        setParts(response.data.data);
        setPagination(response.data.pagination);
        
      } else {
        // Fallback to basic endpoint (faster if stock not needed)
        response = await partsService.getAll({
          search,
          category: categoryFilter,
          page: pagination.page,
          limit: pagination.limit
        });
        // console.log(response)
        setParts(response.data);
        setPagination(response.pagination);
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch parts');
      showToast.error(err.response?.data?.error || 'Failed to fetch parts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter dropdown (same)
  const fetchCategories = async () => {
    try {
      const response = await partsService.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [search, categoryFilter, pagination.page, showStock]);    // ← added showStock

  useEffect(() => {
    fetchCategories();
  }, []);

  // Open modal for create (same)
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

  // Open modal for edit (same)
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

  // Open delete dialog (same)
  const handleDeleteClick = (part) => {
    setDeletingPart(part);
    setIsDeleteDialogOpen(true);
  };

  // Submit form (same)
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
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
      showToast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete (same)
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

  // Format currency (same)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
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

      {/* Error (same) */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* CHANGED: Filters row — added stock toggle       */}
      {/* ════════════════════════════════════════════════ */}
      <div className="mb-4 flex flex-wrap gap-4 items-end">
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

        {/* NEW: Stock toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showStock}
            onChange={(e) => setShowStock(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
          />
          Show stock info
        </label>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* CHANGED: Table — added stock columns            */}
      {/* ════════════════════════════════════════════════ */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold 
                               text-gray-600 uppercase">Avg Price</th>
                
                {/* NEW: Stock columns */}
                {showStock && (
                  <>
                    <th className="px-4 py-3 text-center text-xs font-semibold 
                                   text-gray-600 uppercase">In Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold 
                                   text-gray-600 uppercase">Total Units</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold 
                                   text-gray-600 uppercase">Total Value</th>
                  </>
                )}

                <th className="px-4 py-3 text-left text-xs font-semibold 
                               text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold 
                               text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={showStock ? 10 : 7} 
                      className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={showStock ? 10 : 7} 
                      className="px-4 py-8 text-center text-gray-500">
                    No parts found
                  </td>
                </tr>
              ) : (
                // console.log("parts: ",parts);
                parts.map((part) => (
                  <tr 
                    key={part._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/parts/${part._id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-sm">
                      {part.partCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-600 
                                      hover:text-blue-800">
                        {part.partName}
                      </div>
                      {part.description && (
                        <div className="text-sm text-gray-500 truncate 
                                        max-w-xs">
                          {part.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {part.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{part.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(part.avgUnitPrice)}
                    </td>

                    {/* ════════════════════════════════════ */}
                    {/* NEW: Stock data columns              */}
                    {/* ════════════════════════════════════ */}
                    {showStock && (
                      <>
                        <td className="px-4 py-3 text-center">
                          {part.inStockCount > 0 ? (
                            <span className="inline-flex items-center 
                                             justify-center min-w-[2rem] 
                                             px-2 py-1 bg-blue-100 
                                             text-blue-800 rounded-full 
                                             text-sm font-medium">
                              {part.inStockCount}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {part.totalSerials > 0 ? (
                            <span className="text-sm font-medium 
                                             text-gray-700">
                              {part.totalSerials}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm 
                                       font-medium">
                          {part.totalValue > 0 
                            ? formatCurrency(part.totalValue) 
                            : <span className="text-gray-400">-</span>
                          }
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      <span className={`badge ${part.isActive 
                        ? 'badge-spu-cleared' 
                        : 'badge-uncategorized'}`}
                      >
                        {part.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isViewer && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // ← prevent row click
                              handleEdit(part);
                            }}
                            className="text-blue-600 hover:text-blue-800 
                                       text-sm font-medium"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // ← prevent row click
                                handleDeleteClick(part);
                              }}
                              className="text-red-600 hover:text-red-800 
                                         text-sm font-medium"
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

        {/* Pagination (same as before, just update colSpan) */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex 
                          items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} results
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

      {/* ══════════════════════════════════════════════════ */}
      {/* Modal & Delete Dialog — COMPLETELY SAME AS BEFORE */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPart ? 'Edit Part' : 'Add Part'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                <p className="error-message">
                  {errors.avgUnitPrice.message}
                </p>
              )}
            </div>
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
                <p className="error-message">
                  {errors.reorderPoint.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t 
                          border-gray-200">
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
              {isSubmitting 
                ? 'Saving...' 
                : editingPart ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

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