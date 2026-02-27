import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import serialService from '../../services/serialService';
import { CATEGORY_CONFIG } from '../../utils/constants';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await serialService.getAll({
          search: query,
          limit: 10
        });
        setResults(response.data);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Save to recent searches
  const saveRecentSearch = (item) => {
    const newRecent = [
      { id: item._id, serialNumber: item.serialNumber, partName: item.partName },
      ...recentSearches.filter(r => r.id !== item._id)
    ].slice(0, 5);
    
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  // Handle result click
  const handleResultClick = (serial) => {
    saveRecentSearch(serial);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    navigate(`/serials/${serial._id}`);
  };

  // Handle search all
  const handleSearchAll = () => {
    if (query.length >= 2) {
      setIsOpen(false);
      navigate(`/serials/search?q=${encodeURIComponent(query)}`);
      setQuery('');
      setResults([]);
    }
  };

  // Get category badge
  const getCategoryBadge = (category) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.UNCATEGORIZED;
    return (
      <span className={`${config.badgeClass} text-xs`}>
        {config.label}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden md:inline">Search serials...</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-white rounded border border-gray-300">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />

          {/* Search Panel */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by serial number, part name, SPU ID, customer..."
                className="flex-1 text-gray-900 placeholder-gray-400 outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchAll();
                  }
                }}
              />
              {loading && (
                <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border border-gray-300">ESC</kbd>
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {/* Loading State */}
              {loading && (
                <div className="px-4 py-8 text-center text-gray-500">
                  Searching...
                </div>
              )}

              {/* No Query - Show Recent */}
              {!loading && query.length < 2 && (
                <div className="p-4">
                  {recentSearches.length > 0 ? (
                    <>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Searches</p>
                      {recentSearches.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => navigate(`/serials/${item.id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-mono text-sm font-medium">{item.serialNumber}</p>
                            <p className="text-xs text-gray-500">{item.partName}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      Type at least 2 characters to search
                    </p>
                  )}
                </div>
              )}

              {/* No Results */}
              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  No serial numbers found for "{query}"
                </div>
              )}

              {/* Results List */}
              {!loading && results.length > 0 && (
                <div className="p-2">
                  {results.map((serial) => (
                    <button
                      key={serial._id}
                      onClick={() => handleResultClick(serial)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-medium truncate">
                            {serial.serialNumber}
                          </p>
                          {getCategoryBadge(serial.currentCategory)}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {serial.partName} • {serial.voucherNumber}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}

                  {/* View All Results */}
                  <button
                    onClick={handleSearchAll}
                    className="w-full mt-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    View all results for "{query}" →
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <span className="mr-4">
                <kbd className="px-1 py-0.5 bg-white rounded border">↑↓</kbd> to navigate
              </span>
              <span className="mr-4">
                <kbd className="px-1 py-0.5 bg-white rounded border">Enter</kbd> to select
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-white rounded border">Esc</kbd> to close
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalSearch;