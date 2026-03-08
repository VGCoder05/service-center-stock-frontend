// src/components/serials/EditSerialModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import serialService from '../../services/serialService';
import showToast from '../../utils/toast';

const EditSerialModal = ({ isOpen, onClose, serial, onSuccess }) => {
  const [formData, setFormData] = useState({
    serialNumber: '',
    partName: '',
    partCode: '',
    unitPrice: ''
  });
  const [loading, setLoading] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (serial && isOpen) {
      setFormData({
        serialNumber: serial.serialNumber || '',
        partName: serial.partName || '',
        partCode: serial.partCode || '',
        unitPrice: serial.unitPrice || ''
      });
    }
  }, [serial, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await serialService.update(serial._id, formData);
      showToast.success('Serial details updated successfully');
      onSuccess(); // Refresh the details page
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to update serial details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Serial Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
          <input
            type="text"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
          <input
            type="text"
            name="partName"
            value={formData.partName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Part Code (Optional)</label>
          <input
            type="text"
            name="partCode"
            value={formData.partCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSerialModal;