# 📋 Upcoming Development Phases

Here's a detailed breakdown of all remaining phases so you can review and request any changes before we proceed:

---

## **PHASE 3: Bill Entry Module** (5 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **3.1** | Bill Model & APIs (Backend) | Bill schema, CRUD APIs, validation, supplier linking |
| **3.2** | Bill Entry Form - Header | Voucher number, company bill number, date picker, supplier dropdown, total amount |
| **3.3** | Bill Entry Form - Items | Dynamic item rows, part autocomplete, serial number input (single/bulk/auto-generate), unit price |
| **3.4** | Bill List View | Sortable table, filters (date range, supplier), pagination, categorization status indicators |
| **3.5** | Bill Details View | Bill header info, list all serial numbers, category distribution summary, edit/delete actions |

**Key Decisions Built-in:**
- Serial numbers created as `UNCATEGORIZED` by default
- Can optionally categorize during bill entry
- Bill tracks `totalSerialNumbers` and `categorySummary` counts
- `isFullyCategorized` flag for quick filtering

---

## **PHASE 4: Serial Number Management** (5 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **4.1** | SerialNumber Model & APIs | Full schema with context fields, CRUD APIs, bill linkage, denormalized fields |
| **4.2** | CategoryMovement Model | Audit trail schema, movement types (INITIAL_ENTRY, CATEGORIZED, CATEGORY_CHANGE, etc.) |
| **4.3** | Serial Number Search | Global search component, search by serial/SPU/customer/ticket, results display |
| **4.4** | Serial Details Page | Current info, bill linkage, context display, action buttons |
| **4.5** | Movement History Display | Timeline component showing all category changes with timestamps |

**Key Decisions Built-in:**
- Every category change creates a movement record
- Context fields stored as flexible JSON
- Denormalized fields for performance (voucherNumber, supplierName, partName)

---

## **PHASE 5: Category Management** (4 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **5.1** | Categorize API (Backend) | Validation per category, context requirements, movement logging, payment handling |
| **5.2** | Categorize Modal (Frontend) | Dynamic form based on category selection, context fields, conditional payment fields |
| **5.3** | Category List Views | Category-specific pages (`/categories/SPU_PENDING`), color-coded rows, filters, grouping |
| **5.4** | Bulk Category Operations | Multi-select serials, bulk update to same category, confirmation modal |

**Category-Specific Forms:**

| Category | Required Fields | Optional Fields |
|----------|-----------------|-----------------|
| **IN_STOCK** | None | Location, Remarks |
| **SPU_PENDING** | SPU ID, Ticket ID, Customer Name, SPU Date | Contact, Product Model, Product Serial, isChargeable → Amount/Reason/Status |
| **SPU_CLEARED** | Same as SPU_PENDING | Same + clearance date |
| **AMC** | Customer Name | AMC Number, Service Date, isChargeable |
| **OG** | Customer Name, Cash Amount, Payment Status | Product Model, Payment Date, Payment Mode |
| **RETURN** | Return Reason | Expected Return Date, Remarks |
| **RECEIVED_FOR_OTHERS** | Received For (name) | Transfer Status, Transfer Date |

---

## **PHASE 6: Dashboard & Visualizations** (4 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **6.1** | Dashboard APIs | Category counts aggregation, value by category, date-range filtering |
| **6.2** | Dashboard UI | 7 category cards with count + value, date range selector, totals |
| **6.3** | Dashboard Charts | Pie chart (category distribution), optional trend line chart |
| **6.4** | Dashboard Alerts Widget | SPU pending >30 days, Payment pending >15 days, Uncategorized items warning |

**Dashboard Cards Layout:**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ IN STOCK │ │SPU PEND  │ │SPU CLEAR │ │   AMC    │
│   150    │ │    25    │ │    30    │ │    40    │
│ ₹45,000  │ │ ₹12,500  │ │ ₹15,000  │ │ ₹20,000  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐
│    OG    │ │  RETURN  │ │ RECEIVED │
│    15    │ │     5    │ │    10    │
│  ₹8,000  │ │  ₹2,500  │ │  ₹5,000  │
└──────────┘ └──────────┘ └──────────┘
```

---

## **PHASE 7: Reporting Engine** (5 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **7.1** | Report APIs | Stock valuation, category aggregations, date filtering (by `billDate`) |
| **7.2** | Report UI | Filter controls, preview table, export button |
| **7.3** | Excel Export Service | exceljs integration, styled headers, color-coded rows, multiple sheets |
| **7.4** | IN STOCK Report | Grouped by Bill, subtotals per bill |
| **7.5** | SPU Report | Grouped by SPU ID, customer details, payment summary |

**Report Types:**
| Report | Groups By | Includes |
|--------|-----------|----------|
| Stock Valuation | Category | Count, Total Value, % |
| IN STOCK Detail | Bill | Serial, Part, Price, Location |
| SPU Report | SPU ID | Serials, Customer, Payment Status |
| AMC Report | Customer | Serials, Service Dates |
| OG Report | Customer | Serials, Cash Amount, Payment |
| Return Report | Supplier | Serials, Return Reason |

**Date-Range Logic (Critical):**
- Filter by `billDate` (when part was received)
- NOT by `categorizedDate`
- Shows **current category** of parts received in that date range

---

## **PHASE 8: Bulk Operations & Import** (3 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **8.1** | Excel/CSV Import Parser | Upload file, parse, validate, preview |
| **8.2** | Import Wizard UI | File upload, column mapping, validation errors, confirmation |
| **8.3** | Bulk Export | Select multiple serials, export to styled Excel |

**Import Template Columns:**
```
Voucher Number | Company Bill | Bill Date | Supplier Code | Part Code | Part Name | Serial Number | Unit Price | Category (optional)
```

---

## **PHASE 9: Alerts & Notifications** (2 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **9.1** | Alert Queries (Backend) | SPU pending >30 days, Payment pending >15 days, Return pending >7 days, Uncategorized items |
| **9.2** | Alert Display (Frontend) | Dashboard badges, expandable alert panel, click-to-action links |

---

## **PHASE 10: Search & Filters** (2 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **10.1** | Advanced Filter Component | Multi-field filters, save filter presets, clear all |
| **10.2** | Enhanced Global Search | Ctrl+K shortcut, recent searches, quick results dropdown |

---

## **PHASE 11: UI Polish & Responsiveness** (3 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **11.1** | Mobile Responsiveness | Responsive tables, hamburger menu, touch-friendly |
| **11.2** | Loading States | Skeleton loaders, button loading spinners, page transitions |
| **11.3** | Print Styles | Print-friendly reports, invoice printing |

---

## **PHASE 12: Testing & Deployment** (3 units)

| Unit | What It Does | Key Features |
|------|--------------|--------------|
| **12.1** | Integration Testing | Key workflow tests, API testing |
| **12.2** | Production Setup | Environment configs, MongoDB Atlas, deployment |
| **12.3** | Documentation | User manual, admin guide, API docs |

---

# ❓ Questions Before Proceeding

Please review and let me know if you want changes to any of these:

### 1. **Bill Entry (Phase 3)**
- Should voucher number be **auto-generated** or **manual entry**?
- Any specific voucher number format? (e.g., `VCH/2026/0001`)
- Should we allow editing bills after serial numbers are categorized?

### 2. **Serial Number Entry (Phase 3.3)**
- Confirm all 3 methods needed:
  - [ ] Single entry (one at a time)
  - [ ] Bulk entry (comma-separated)
  - [ ] Auto-generate (prefix + sequence)
- For auto-generate, what prefix format? (e.g., `SN-2026-`, `PART-`)

### 3. **Category Forms (Phase 5.2)**
- Any additional fields needed for any category?
- Should SPU ID be **free text** or follow a format?
- For OG, should Payment Status default to "PENDING" or "PAID"?

### 4. **Dashboard (Phase 6)**
- Want charts (pie/bar) or just cards with numbers?
- Any specific KPIs beyond category counts?

### 5. **Reports (Phase 7)**
- Any additional report types needed?
- Excel format preferences (colors, fonts)?
- Need PDF export or Excel only?

### 6. **Import (Phase 8)**
- Confirm ~1000 records from 2 months of data
- Do you have a sample Excel file format I should match?

### 7. **Any Features to Skip or Defer?**
- Charts?
- Print styles?
- Advanced search (Ctrl+K)?

