// src/hooks/useBulkSelection.js
import { useState, useCallback, useMemo } from 'react';

const useBulkSelection = (items = [], idKey = '_id') => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleOne = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === items.length) {
        return new Set(); // deselect all
      }
      return new Set(items.map(item => item[idKey])); // select all
    });
  }, [items, idKey]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  const isPartiallySelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size]
  );

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    toggleOne,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartiallySelected
  };
};

export default useBulkSelection;