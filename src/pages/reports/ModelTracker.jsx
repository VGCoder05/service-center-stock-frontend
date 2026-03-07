import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import serialService from '../../services/serialService';
import showToast from '../../utils/toast';

const ModelTracker = () => {
  const [loading, setLoading] = useState(true);
  const [modelGroups, setModelGroups] = useState({});
  const [selectedModel, setSelectedModel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ NEW: Track which part accordion is currently open
  const [expandedPart, setExpandedPart] = useState(null);

  useEffect(() => {
    const fetchAndGroupModels = async () => {
      try {
        setLoading(true);
        const [pendingRes, clearedRes] = await Promise.all([
          serialService.getAll({ currentCategory: 'SPU_PENDING', limit: 5000 }),
          serialService.getAll({ currentCategory: 'SPU_CLEARED', limit: 5000 })
        ]);

        const allSpuSerials = [
          ...(pendingRes.data || pendingRes), 
          ...(clearedRes.data || clearedRes)
        ];

        const grouped = {};
        allSpuSerials.forEach(serial => {
          const modelName = serial.context?.productModel?.trim();
          if (modelName) {
            if (!grouped[modelName]) grouped[modelName] = [];
            grouped[modelName].push(serial);
          }
        });

        setModelGroups(grouped);
        
        const sortedModels = Object.keys(grouped).sort();
        if (sortedModels.length > 0) {
          setSelectedModel(sortedModels[0]);
        }

      } catch (err) {
        console.error(err);
        showToast.error('Failed to load model data');
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupModels();
  }, []);

  // ✅ NEW: Reset the expanded part whenever the user selects a new model
  useEffect(() => {
    setExpandedPart(null);
  }, [selectedModel]);

  const filteredModels = Object.keys(modelGroups)
    .sort()
    .filter(model => model.toLowerCase().includes(searchTerm.toLowerCase()));

  const currentModelSerials = modelGroups[selectedModel] || [];

  // ✅ NEW: Group the selected model's serials by Part Name
  const groupedParts = useMemo(() => {
    return currentModelSerials.reduce((acc, serial) => {
      const partKey = serial.partName || 'Unknown Part';
      if (!acc[partKey]) acc[partKey] = [];
      acc[partKey].push(serial);
      return acc;
    }, {});
  }, [currentModelSerials]);

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Model-Wise Parts Tracker</h1>
        <p className="text-gray-600">Track which parts are being used in specific product models</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* LEFT SIDEBAR: List of Models */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              placeholder="Search models..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="text-center text-gray-500 py-4 text-sm">Loading models...</p>
            ) : filteredModels.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No models found.</p>
            ) : (
              filteredModels.map(model => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors cursor-pointer ${
                    selectedModel === model 
                      ? 'bg-blue-50 border-blue-200 border text-blue-700 font-medium' 
                      : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate pr-2">{model}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedModel === model ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {modelGroups[model].length}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Grouped Parts Accordion */}
        <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedModel ? selectedModel : 'Select a model'}
            </h2>
            {selectedModel && (
              <span className="text-sm text-gray-500">
                Total Parts: {currentModelSerials.length} | Unique: {Object.keys(groupedParts).length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {!selectedModel ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a model from the left to view its parts
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {/* ✅ NEW: Map through unique parts to create accordion items */}
                {Object.entries(groupedParts).sort().map(([partName, serials]) => {
                  const isExpanded = expandedPart === partName;
                  const firstSerial = serials[0]; // Used to grab the partCode quickly

                  return (
                    <div key={partName} className="bg-white">
                      {/* Accordion Header */}
                      <button
                        onClick={() => setExpandedPart(isExpanded ? null : partName)}
                        className={`w-full px-6 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                          isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="font-semibold text-gray-900 line-clamp-1">{partName}</span>
                          <span className="text-xs text-gray-500 font-mono mt-1">Code: {firstSerial?.partCode || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            Qty: {serials.length}
                          </span>
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Accordion Body (The Data Table) */}
                      {isExpanded && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3">SPU Info</th>
                                  <th className="px-4 py-3">Serial No</th>
                                  <th className="px-4 py-3">Bill Info</th>
                                  <th className="px-4 py-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {serials.map(part => (
                                  <tr key={part._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-gray-900">{part.context?.spuId || 'N/A'}</div>
                                      <div className="text-xs text-gray-500">{part.context?.customerName}</div>
                                      {part.context?.ticketId && (
                                        <div className="text-xs text-blue-500">Tkt: {part.context?.ticketId}</div>
                                      )}
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="font-medium text-blue-600 font-mono">
                                        {part.serialNumber}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">₹{part.unitPrice}</div>
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="font-medium text-gray-900">V.No: {part.voucherNumber}</div>
                                      <div className="text-xs text-gray-500">
                                        {part.billDate ? format(new Date(part.billDate), 'dd MMM yyyy') : '-'}
                                      </div>
                                    </td>

                                    <td className="px-4 py-3">
                                       <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                          part.currentCategory === 'SPU_CLEARED' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                       }`}>
                                         {part.currentCategory === 'SPU_CLEARED' ? 'Cleared' : 'Pending'}
                                       </span>
                                       {part.context?.spuDate && (
                                         <div className="text-[10px] text-gray-400 mt-1">
                                           {format(new Date(part.context.spuDate), 'dd/MM/yyyy')}
                                         </div>
                                       )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModelTracker;