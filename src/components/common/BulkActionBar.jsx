// src/components/common/BulkActionBar.jsx
const BulkActionBar = ({ selectedCount, onCategorize, onClear }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 
                    bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-3 
                    flex items-center gap-4 animate-slide-up">
      <span className="text-sm font-medium">
        <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold mr-2">
          {selectedCount}
        </span>
        items selected
      </span>

      <div className="w-px h-6 bg-gray-600" />

      <button
        onClick={onCategorize}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
                   text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        📂 Bulk Categorize
      </button>

      <button
        onClick={onClear}
        className="text-gray-400 hover:text-white text-sm transition-colors"
      >
        ✕ Clear
      </button>
    </div>
  );
};

export default BulkActionBar;