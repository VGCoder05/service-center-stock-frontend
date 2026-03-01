import { useState, useEffect } from 'react';
import SearchableSelect from '../common/SearchableSelect';
import partService from '../../services/partsService';

const PartSelector = ({
  value,           // { partId, partCode, partName, avgUnitPrice }
  onChange,         // (partData) => void
  error = '',
  required = false,
  disabled = false
}) => {

  const [partsOptions, setPartsOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all parts on mount (it's a small dataset)
  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      setIsLoading(true);
      const response = await partService.getAllPartsList();
      const parts = response.data.data || [];

      const options = parts.map(part => ({
        value: part._id,
        label: part.partName,
        sublabel: `${part.partCode} | Avg: ₹${part.avgUnitPrice || 0}`,
        raw: part    // Keep the full part data
      }));

      setPartsOptions(options);
    } catch (err) {
      console.error('Failed to load parts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // User selected an existing part from dropdown
  const handleSelect = (option) => {
    if (!option) {
      // Cleared
      onChange({
        partId: null,
        partCode: '',
        partName: '',
        avgUnitPrice: 0
      });
      return;
    }

    const part = option.raw;
    onChange({
      partId: part._id,
      partCode: part.partCode,
      partName: part.partName,
      avgUnitPrice: part.avgUnitPrice || 0
    });
  };

  // User typed a new part name that doesn't exist
  const handleCreateNew = (newPartName) => {
    // Don't create in PartsMaster here!
    // Just pass the name — backend will auto-create when serial is saved
    onChange({
      partId: null,
      partCode: '',
      partName: newPartName,
      avgUnitPrice: 0,
      isNew: true        // Flag so UI can show "New" badge
    });
  };

  return (
    <SearchableSelect
      label="Part Name"
      required={required}
      disabled={disabled}
      error={error}
      options={partsOptions}
      value={value?.partId}
      displayValue={value?.partName || ''}
      onChange={handleSelect}
      onCreateNew={handleCreateNew}
      placeholder="Search or type new part name..."
      allowCreate={true}
      createLabel="+ Add new part"
      isLoading={isLoading}
    />
  );
};

export default PartSelector;