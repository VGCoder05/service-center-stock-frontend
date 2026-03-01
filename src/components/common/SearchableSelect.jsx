import { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({
  options = [],          // [{ value, label, sublabel }]
  value,                 // selected value
  onChange,              // (selectedOption) => void
  onSearch,              // (searchTerm) => void (for API search)
  onCreateNew,           // (inputValue) => void (when user wants to create new)
  placeholder = 'Search...',
  allowCreate = false,
  createLabel = '+ Create New',
  isLoading = false,
  disabled = false,
  error = '',
  label = '',
  required = false,
  displayValue = ''      // What to show in the input when an option is selected
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.sublabel && option.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if search term matches any existing option exactly
  const exactMatch = options.some(
    option => option.label.toLowerCase() === searchTerm.toLowerCase()
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    if (onSearch) onSearch(val);
  };

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(searchTerm);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`
            w-full px-3 py-2 border rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          placeholder={value ? displayValue : placeholder}
          value={isOpen ? searchTerm : (displayValue || '')}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
        />

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400
                       hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg
                        shadow-lg max-h-60 overflow-auto">

          {/* Loading */}
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          )}

          {/* Options */}
          {!isLoading && filteredOptions.length > 0 && (
            filteredOptions.map((option, index) => (
              <button
                key={option.value || index}
                type="button"
                className={`
                  w-full px-3 py-2 text-left text-sm hover:bg-blue-50
                  ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  ${index !== filteredOptions.length - 1 ? 'border-b border-gray-100' : ''}
                `}
                onClick={() => handleSelect(option)}
              >
                <div className="font-medium">{option.label}</div>
                {option.sublabel && (
                  <div className="text-xs text-gray-500">{option.sublabel}</div>
                )}
              </button>
            ))
          )}

          {/* No results */}
          {!isLoading && filteredOptions.length === 0 && searchTerm && !allowCreate && (
            <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
          )}

          {/* Create new option */}
          {allowCreate && searchTerm && !exactMatch && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50
                         border-t border-gray-200 font-medium"
              onClick={handleCreateNew}
            >
              {createLabel}: "{searchTerm}"
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default SearchableSelect;