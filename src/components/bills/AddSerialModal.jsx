import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Modal from '../common/Modal';
import partsService from '../../services/partsService';
import serialService from '../../services/serialService';
import showToast from '../../utils/toast';
import { CATEGORIES, CATEGORY_CONFIG } from '../../utils/constants';

// Entry mode options
const ENTRY_MODES = {
  SINGLE: 'single',
  BULK: 'bulk',
  AUTO: 'auto'
};

// Validation schema for single entry
const singleSchema = yup.object({
  serialNumber: yup
    .string()
    .max(100, 'Serial number cannot exceed 100 characters')
    .required('Serial number is required'),
  partName: yup
    .string()
    .required('Part name is required'),
  unitPrice: yup
    .number()
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative')
    .required('Unit price is required'),
  currentCategory: yup.string()
});

// Validation schema for bulk entry
const bulkSchema = yup.object({
  serialNumbers: yup
    .string()
    .required('Serial numbers are required'),
  partName: yup
    .string()
    .required('Part name is required'),
  unitPrice: yup
    .number()
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative')
    .required('Unit price is required'),
  currentCategory: yup.string()
});

// Validation schema for auto-generate
const autoSchema = yup.object({
  prefix: yup
    .string()
    .required('Prefix is required'),
  startNumber: yup
    .number()
    .typeError('Must be a number')
    .min(1, 'Must be at least 1')
    .required('Start number is required'),
  count: yup
    .number()
    .typeError('Must be a number')
    .min(1, 'Must be at least 1')
    .max(100, 'Cannot exceed 100 at once')
    .required('Count is required'),
  partName: yup
    .string()
    .required('Part name is required'),
  unitPrice: yup
    .number()
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative')
    .required('Unit price is required'),
  currentCategory: yup.string()
});

const AddSerialModal = ({ isOpen, onClose, billId, onSuccess }) => {
  const [entryMode, setEntryMode] = useState(ENTRY_MODES.SINGLE);
  const [parts, setParts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  // Get schema based on entry mode
  const getSchema = () => {
    switch (entryMode) {
      case ENTRY_MODES.BULK:
        return bulkSchema;
      case ENTRY_MODES.AUTO:
        return autoSchema;
      default:
        return singleSchema;
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(getSchema()),
    defaultValues: {
      currentCategory: 'UNCATEGORIZED',
      unitPrice: 0
    }
  });

  // Fetch parts for autocomplete
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await partsService.getAllList();
        setParts(response.data);
      } catch (err) {
        console.error('Failed to fetch parts:', err);
      }
    };
    if (isOpen) {
      fetchParts();
    }
  }, [isOpen]);

  // Reset form when modal opens or entry mode changes
  useEffect(() => {
    if (isOpen) {
      reset({
        serialNumber: '',
        serialNumbers: '',
        prefix: 'SN-',
        startNumber: 1,
        count: 1,
        partId: '',
        partCode: '',
        partName: '',
        unitPrice: 0,
        currentCategory: 'UNCATEGORIZED'
      });
      setSelectedPart(null);
    }
  }, [isOpen, entryMode, reset]);

  // Handle part selection
  const handlePartSelect = (partId) => {
    const part = parts.find(p => p._id === partId);
    if (part) {
      setSelectedPart(part);
      setValue('partName', part.partName);
      setValue('partCode', part.partCode);
      setValue('unitPrice', part.avgUnitPrice || 0);
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      let items = [];

      switch (entryMode) {
        case ENTRY_MODES.SINGLE:
          // Single serial number
          items = [{
            serialNumber: data.serialNumber,
            partId: selectedPart?._id,
            partCode: data.partCode || selectedPart?.partCode,
            partName: data.partName,
            unitPrice: data.unitPrice,
            currentCategory: data.currentCategory
          }];
          break;

        case ENTRY_MODES.BULK:
          // Parse comma/newline separated serial numbers
          const serialNumbers = data.serialNumbers
            .split(/[,\n]/)
            .map(sn => sn.trim())
            .filter(sn => sn.length > 0);

          if (serialNumbers.length === 0) {
            showToast.error('No valid serial numbers entered');
            setIsSubmitting(false);
            return;
          }

          items = serialNumbers.map(sn => ({
            serialNumber: sn,
            partId: selectedPart?._id,
            partCode: data.partCode || selectedPart?.partCode,
            partName: data.partName,
            unitPrice: data.unitPrice,
            currentCategory: data.currentCategory
          }));
          break;

        case ENTRY_MODES.AUTO:
          // Auto-generate serial numbers
          for (let i = 0; i < data.count; i++) {
            const num = data.startNumber + i;
            const paddedNum = String(num).padStart(4, '0');
            items.push({
              serialNumber: `${data.prefix}${paddedNum}`,
              partId: selectedPart?._id,
              partCode: data.partCode || selectedPart?.partCode,
              partName: data.partName,
              unitPrice: data.unitPrice,
              currentCategory: data.currentCategory
            });
          }
          break;
      }

      // Create serials
      if (items.length === 1) {
        await serialService.create({
          billId,
          ...items[0]
        });
        showToast.success('Serial number added successfully');
      } else {
        await serialService.createBulk({
          billId,
          items
        });
        showToast.success(`${items.length} serial numbers added successfully`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to add serial numbers');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Serial Numbers"
      size="lg"
    >
      {/* Entry Mode Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setEntryMode(ENTRY_MODES.SINGLE)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            entryMode === ENTRY_MODES.SINGLE
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Single Entry
        </button>
        <button
          type="button"
          onClick={() => setEntryMode(ENTRY_MODES.BULK)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            entryMode === ENTRY_MODES.BULK
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Bulk Entry
        </button>
        <button
          type="button"
          onClick={() => setEntryMode(ENTRY_MODES.AUTO)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            entryMode === ENTRY_MODES.AUTO
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Auto Generate
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Single Entry Mode */}
        {entryMode === ENTRY_MODES.SINGLE && (
          <div>
            <label className="label">Serial Number *</label>
            <input
              type="text"
              className={errors.serialNumber ? 'input-error' : 'input'}
              placeholder="Enter serial number"
              {...register('serialNumber')}
            />
            {errors.serialNumber && (
              <p className="error-message">{errors.serialNumber.message}</p>
            )}
          </div>
        )}

        {/* Bulk Entry Mode */}
        {entryMode === ENTRY_MODES.BULK && (
          <div>
            <label className="label">Serial Numbers * (comma or newline separated)</label>
            <textarea
              rows={4}
              className={errors.serialNumbers ? 'input-error' : 'input'}
              placeholder="SN001, SN002, SN003&#10;or&#10;SN001&#10;SN002&#10;SN003"
              {...register('serialNumbers')}
            />
            {errors.serialNumbers && (
              <p className="error-message">{errors.serialNumbers.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Enter multiple serial numbers separated by commas or new lines
            </p>
          </div>
        )}

        {/* Auto Generate Mode */}
        {entryMode === ENTRY_MODES.AUTO && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Prefix *</label>
              <input
                type="text"
                className={errors.prefix ? 'input-error' : 'input'}
                placeholder="SN-"
                {...register('prefix')}
              />
              {errors.prefix && (
                <p className="error-message">{errors.prefix.message}</p>
              )}
            </div>
            <div>
              <label className="label">Start Number *</label>
              <input
                type="number"
                min="1"
                className={errors.startNumber ? 'input-error' : 'input'}
                placeholder="1"
                {...register('startNumber')}
              />
              {errors.startNumber && (
                <p className="error-message">{errors.startNumber.message}</p>
              )}
            </div>
            <div>
              <label className="label">Count *</label>
              <input
                type="number"
                min="1"
                max="100"
                className={errors.count ? 'input-error' : 'input'}
                placeholder="10"
                {...register('count')}
              />
              {errors.count && (
                <p className="error-message">{errors.count.message}</p>
              )}
            </div>
            <div className="col-span-3">
              <p className="text-xs text-gray-500">
                Preview: {watch('prefix')}{String(watch('startNumber') || 1).padStart(4, '0')} to {watch('prefix')}{String((parseInt(watch('startNumber')) || 1) + (parseInt(watch('count')) || 1) - 1).padStart(4, '0')}
              </p>
            </div>
          </div>
        )}

        {/* Part Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Select Part (optional)</label>
            <select
              className="input"
              onChange={(e) => handlePartSelect(e.target.value)}
            >
              <option value="">-- Select from catalog --</option>
              {parts.map((part) => (
                <option key={part._id} value={part._id}>
                  {part.partCode} - {part.partName}
                </option>
              ))}
            </select>
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

        {/* Price and Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Unit Price (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={errors.unitPrice ? 'input-error' : 'input'}
              placeholder="0.00"
              {...register('unitPrice')}
            />
            {errors.unitPrice && (
              <p className="error-message">{errors.unitPrice.message}</p>
            )}
          </div>
          <div>
            <label className="label">Initial Category</label>
            <select
              className="input"
              {...register('currentCategory')}
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You can categorize later from the serial details page
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Adding...' : 'Add Serial Numbers'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSerialModal;