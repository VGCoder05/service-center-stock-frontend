import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import parseExcelFile from '../../services/excelParserService';
import importService from '../../services/importService';
import toast from '../../utils/toast'; // Make sure this path matches your toast utility

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  VALIDATION: 'validation',
  RESULT: 'result'
};

const ExcelImport = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(STEPS.UPLOAD);
  const [fileName, setFileName] = useState('');
  const [bills, setBills] = useState([]);
  const [validation, setValidation] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedBills, setExpandedBills] = useState(new Set());

  // ==========================================
  // 1. Upload & Parse
  // ==========================================
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setLoading(true);
      setFileName(file.name);

      const parsedBills = await parseExcelFile(file);

      if (parsedBills.length === 0) {
        toast.error('No valid bills found in the file');
        return;
      }

      setBills(parsedBills);
      setStep(STEPS.PREVIEW);
      toast.success(`Parsed ${parsedBills.length} bill(s) from Excel`);
    } catch (err) {
      toast.error(err.message || 'Failed to parse Excel file');
    } finally {
      setLoading(false);
      // Reset input so you can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // 2. Preview Helpers (Edit/Remove)
  // ==========================================
  const toggleBillExpand = (index) => {
    setExpandedBills(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const removeBill = (billIndex) => {
    setBills(prev => prev.filter((_, i) => i !== billIndex));
  };

  const removeItem = (billIndex, itemIndex) => {
    setBills(prev => {
      const updated = [...prev];
      updated[billIndex] = {
        ...updated[billIndex],
        items: updated[billIndex].items.filter((_, i) => i !== itemIndex)
      };
      return updated;
    });
  };

  const updateSerialCategory = (billIndex, itemIndex, serialIndex, newCategory) => {
    setBills(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[billIndex].items[itemIndex].serialNumbers[serialIndex].category = newCategory;
      return updated;
    });
  };

  // ==========================================
  // 3. Validation & Import
  // ==========================================
  const handleValidate = async () => {
    try {
      setLoading(true);
      const response = await importService.validate(bills);
      setValidation(response.data);
      setStep(STEPS.VALIDATION);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const response = await importService.importExcel(bills);
      setImportResult(response.data);
      setStep(STEPS.RESULT);
      toast.success(response.message || 'Import successful!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Summary Calculations
  // ==========================================
  const calculateTotals = () => {
    let totalItems = 0;
    let totalSerials = 0;
    let totalValue = 0;

    bills.forEach(b => {
      b.items.forEach(item => {
        totalItems++;
        item.serialNumbers.forEach(sn => {
          totalSerials++;
          totalValue += (sn.unitPrice || 0);
        });
      });
    });

    return { bills: bills.length, items: totalItems, serials: totalSerials, value: totalValue };
  };

  const totals = calculateTotals();
  const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📥 Import Bills from Excel</h1>
        <p className="text-gray-600 mt-1">Upload your accounting Excel to bulk-create bills, parts, and serial numbers.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { key: STEPS.UPLOAD, label: '1. Upload' },
          { key: STEPS.PREVIEW, label: '2. Preview' },
          { key: STEPS.VALIDATION, label: '3. Validate' },
          { key: STEPS.RESULT, label: '4. Result' }
        ].map(({ key, label }, i) => (
          <div key={key} className="flex items-center gap-2 whitespace-nowrap">
            {i > 0 && <div className="w-8 h-px bg-gray-300" />}
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${step === key ? 'bg-blue-100 text-blue-800' 
                : Object.values(STEPS).indexOf(step) > Object.values(STEPS).indexOf(key)
                  ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: UPLOAD */}
      {step === STEPS.UPLOAD && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 bg-white">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Select your Excel file</h3>
          <label className="cursor-pointer inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Browse Files
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
          </label>
          {loading && <p className="text-blue-600 mt-4 font-medium animate-pulse">Parsing file in your browser...</p>}
        </div>
      )}

      {/* STEP 2: PREVIEW */}
      {step === STEPS.PREVIEW && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-lg font-bold">Data Preview ({fileName})</h3>
            <div className="flex gap-4 text-sm font-medium text-gray-600">
              <span>Bills: {totals.bills}</span> | 
              <span>Parts: {totals.items}</span> | 
              <span>Serials: {totals.serials}</span> | 
              <span className="text-green-600">Total: {formatCurrency(totals.value)}</span>
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {bills.map((bill, billIndex) => (
              <div key={billIndex} className="border rounded-lg overflow-hidden">
                <div 
                  className="flex justify-between items-center px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleBillExpand(billIndex)}
                >
                  <div className="font-semibold">
                    {expandedBills.has(billIndex) ? '▼ ' : '▶ '}
                    Bill #{bill.voucherNumber} <span className="text-gray-400 font-normal ml-2">({bill.supplierName})</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeBill(billIndex); }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                  >
                    Remove Bill
                  </button>
                </div>

                {expandedBills.has(billIndex) && (
                  <div className="p-4 bg-white overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">Part Code</th>
                          <th className="px-4 py-2">Serial / Item Ref</th>
                          <th className="px-4 py-2">Price</th>
                          <th className="px-4 py-2">Category</th>
                          <th className="px-4 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.items.map((item, itemIndex) => (
                          item.serialNumbers.map((serial, serialIndex) => (
                            <tr key={`${itemIndex}-${serialIndex}`} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 font-mono">{item.partCode}</td>
                              <td className="px-4 py-2">{serial.serialNumber}</td>
                              <td className="px-4 py-2">{formatCurrency(serial.unitPrice)}</td>
                              <td className="px-4 py-2">
                                <select
                                  value={serial.category}
                                  onChange={(e) => updateSerialCategory(billIndex, itemIndex, serialIndex, e.target.value)}
                                  className="border rounded p-1 text-xs w-full bg-white"
                                >
                                  <option value="UNCATEGORIZED">Uncategorized</option>
                                  <option value="IN_STOCK">In Stock</option>
                                  <option value="SPU_CLEARED">SPU Cleared</option>
                                  <option value="SPU_PENDING">SPU Pending</option>
                                  <option value="AMC">AMC</option>
                                  <option value="OG">OG</option>
                                  <option value="RETURN">Return</option>
                                  <option value="RETURN_PENDING">Return Pending</option>
                                  <option value="PENDING_TO_CHECK">Pending To Check</option>
                                </select>
                              </td>
                              <td className="px-4 py-2 text-right">
                                {serialIndex === 0 && (
                                  <button onClick={() => removeItem(billIndex, itemIndex)} className="text-red-500 hover:underline text-xs">Remove Part</button>
                                )}
                              </td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={() => { setStep(STEPS.UPLOAD); setBills([]); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button onClick={handleValidate} disabled={loading || bills.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Validating...' : 'Validate Data'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION */}
      {step === STEPS.VALIDATION && validation && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Validation Results</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
              <div className="text-2xl font-bold">{validation.totalBills - validation.duplicateBills.length}</div>
              <div className="text-sm">Valid Bills to Import</div>
            </div>
            {validation.duplicateBills.length > 0 && (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                <div className="text-2xl font-bold">{validation.duplicateBills.length}</div>
                <div className="text-sm">Duplicates (Will be skipped)</div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setStep(STEPS.PREVIEW)} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">Back to Edit</button>
            <button onClick={handleImport} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Importing...' : 'Confirm & Import Data'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RESULT */}
      {step === STEPS.RESULT && importResult && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Import Complete!</h2>
          <p className="text-gray-600 mb-6">Successfully processed your Excel file.</p>
          
          <div className="flex justify-center gap-8 mb-8">
            <div><span className="text-2xl font-bold text-blue-600">{importResult.billsCreated}</span><br/><span className="text-sm text-gray-500">Bills Created</span></div>
            <div><span className="text-2xl font-bold text-green-600">{importResult.serialsCreated}</span><br/><span className="text-sm text-gray-500">Serials Added</span></div>
            <div><span className="text-2xl font-bold text-purple-600">{importResult.partsCreated}</span><br/><span className="text-sm text-gray-500">New Parts Created</span></div>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/bills')} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">View Bills</button>
            <button onClick={() => { setStep(STEPS.UPLOAD); setBills([]); setValidation(null); setImportResult(null); }} className="px-6 py-2 border rounded hover:bg-gray-50 text-gray-700">Upload Another</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImport;