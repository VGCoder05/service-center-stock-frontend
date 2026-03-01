import ExcelJS from 'exceljs';

// Column index mapping (1-based in ExcelJS)
const CATEGORY_COLUMNS = {
  7: 'IN_STOCK',
  8: 'SPU_CLEARED',
  9: 'SPU_PENDING',
  10: 'RETURN',
  11: 'RETURN_PENDING',
  12: 'PENDING_TO_CHECK',
  13: 'OG'
};

const parseExcelDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  // Try string format: "06-02-2026" (DD-MM-YYYY)
  const str = String(value).trim();
  const ddmmyyyy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`);
  }
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const getCellValue = (cell) => {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const val = cell.value;
  if (typeof val === 'object' && val.richText) return val.richText.map(r => r.text).join('');
  if (typeof val === 'object' && val.formula !== undefined) return val.result !== undefined ? val.result : '';
  return val;
};

const detectCategory = (row) => {
  for (const [colIndex, categoryName] of Object.entries(CATEGORY_COLUMNS)) {
    const cellValue = parseFloat(getCellValue(row.getCell(parseInt(colIndex))));
    if (!isNaN(cellValue) && cellValue > 0) return categoryName;
  }
  return 'UNCATEGORIZED';
};

const cleanText = (value) => String(value || '').replace(/^\s*\.\s*/, '').trim();

const isSrNoHeaderRow = (row) => {
  const itemDetails = String(getCellValue(row.getCell(6)) || '').toLowerCase();
  return itemDetails.includes('sr.no') || itemDetails.includes('sr. no');
};

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target.result);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) throw new Error('No worksheet found');

        const bills = [];
        let currentBill = null;
        let currentPart = null;

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header

          const dateVal = getCellValue(row.getCell(1));
          const billNoVal = getCellValue(row.getCell(2));
          const supplierVal = getCellValue(row.getCell(3));
          const partCodeVal = getCellValue(row.getCell(4));
          const amountVal = getCellValue(row.getCell(5));
          const itemDetails = getCellValue(row.getCell(6));
          const notesVal = getCellValue(row.getCell(14));

          // 1. New Bill detected
          if (dateVal && String(dateVal).trim() && billNoVal) {
            const parsedDate = parseExcelDate(dateVal);
            if (parsedDate) {
              currentBill = {
                billDate: parsedDate,
                voucherNumber: String(billNoVal).trim(),
                supplierName: String(supplierVal).trim(),
                items: []
              };
              bills.push(currentBill);
              currentPart = null;
            }
          }

          if (isSrNoHeaderRow(row)) return;

          // 2. New Part detected
          if (partCodeVal && String(partCodeVal).trim()) {
            currentPart = {
              partCode: String(partCodeVal).trim().toUpperCase(),
              partName: cleanText(itemDetails),
              serialNumbers: []
            };
            if (currentBill) currentBill.items.push(currentPart);
          }

          // 3. Serial Number / Amount detected
          const amount = parseFloat(amountVal);
          if (!isNaN(amount) && amount > 0 && currentPart && currentBill) {
            let serialRef = cleanText(itemDetails);
            
            // Clean up serial string if it looks like "1/1962" (get the "1962" part)
            if (serialRef.includes('/')) {
                serialRef = serialRef.split('/')[1]; 
            }

            currentPart.serialNumbers.push({
              serialNumber: serialRef || `${currentPart.partCode}-${currentPart.serialNumbers.length + 1}`,
              unitPrice: amount,
              category: detectCategory(row),
              notes: String(notesVal || '').trim()
            });
          }
        });

        // Cleanup empty bills/items
        bills.forEach(bill => {
          bill.items = bill.items.filter(item => item.serialNumbers.length > 0);
        });
        const validBills = bills.filter(bill => bill.items.length > 0);

        resolve(validBills);
      } catch (err) {
        reject(new Error(`Failed to parse Excel: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export default parseExcelFile;