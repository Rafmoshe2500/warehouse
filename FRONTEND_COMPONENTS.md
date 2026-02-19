# 🎨 Frontend Components & UI Capabilities

## 📑 תוכן עניינים
1. [Layout & Navigation](#layout--navigation)
2. [Page Components](#page-components)
3. [Inventory Components](#inventory-components)
4. [Admin Components](#admin-components)
5. [Procurement Components](#procurement-components)
6. [Common/Reusable Components](#commonreusable-components)
7. [UI Features & Interactions](#ui-features--interactions)
8. [Error Handling & Loading States](#error-handling--loading-states)

---

## 🏗️ Layout & Navigation

### Header Component
**File**: `components/layout/Header/Header.jsx`

```
┌─────────────────────────────────────────────────────┐
│  📦 WAREHOUSE SYSTEM      🌙  🔔  👤 john.doe ▼    │
└─────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Logo with branding
- ✅ Theme toggle (Light/Dark mode)
- ✅ Notifications bell (expandable dropdown)
- ✅ User menu dropdown
  - View profile
  - Change password
  - Logout
- ✅ Responsive (hamburger on mobile)
- ✅ Real-time status indicator

**Interactive Elements**:
- Theme toggle switches CSS theme
- User menu opens/closes with click
- Notifications show recent activities
- Logout clears token from localStorage

---

### Navigation Component
**File**: `components/layout/Navigation/Navigation.jsx`

```
┌─────────────────┐
│ 🏠 Dashboard    │
├─────────────────┤
│ 📦 Inventory    │
├─────────────────┤
│ 🛒 Procurement  │
├─────────────────┤
│ 📊 My Collections
├─────────────────┤
│ 👨‍💼 Admin Panel │
├─────────────────┤
│ 📚 User Guide   │
├─────────────────┤
│ 📝 Audit Logs   │
└─────────────────┘
```

**Features**:
- ✅ Vertical sidebar (collapsible on mobile)
- ✅ Active route highlighting
- ✅ Role-based visibility (Admin items only show for admins)
- ✅ Icons for each section
- ✅ Smooth transitions
- ✅ Tooltip on hover (if collapsed)

**Conditional Rendering**:
- ✅ Show "Admin Panel" if `user.role === 'admin'`
- ✅ Show "Procurement" if has `PROCUREMENT_RO` or `PROCUREMENT_RW`
- ✅ Show "Audit Logs" if `isAdmin`

---

## 📄 Page Components

### 🔐 LoginPage
**Path**: `/login`
**File**: `pages/LoginPage/LoginPage.jsx`

```
┌──────────────────────────────────────┐
│                                      │
│    🏢 מערכת ניהול מלאי               │
│                                      │
│    ┌──────────────────────────────┐  │
│    │ שם משתמש                    │  │
│    ├──────────────────────────────┤  │
│    │ סיסמה                       │  │
│    ├──────────────────────────────┤  │
│    │  [  כניסה   ]               │  │
│    └──────────────────────────────┘  │
│                                      │
│    Or login with domain (ADFS)       │
│    ┌──────────────────────────────┐  │
│    │ דומיין / שם משתמש          │  │
│    ├──────────────────────────────┤  │
│    │ סיסמה                       │  │
│    ├──────────────────────────────┤  │
│    │ [  כניסה דומיין   ]         │  │
│    └──────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Features**:
- ✅ Two login methods:
  1. Local authentication (username + password)
  2. ADFS/Domain login (domain + username + password)
- ✅ Form validation
  - Required fields
  - Password strength indicator
  - Username format validation
- ✅ Loading spinner during submission
- ✅ Error message display
  - Invalid credentials
  - Server errors
  - Network errors
- ✅ Remember me checkbox (optional)
- ✅ Responsive design (mobile-friendly)
- ✅ Remember credentials option (localStorage)

**State Management**:
- `username`: string (controlled input)
- `password`: string (controlled input)
- `isLoading`: boolean
- `error`: string | null
- `loginMethod`: 'local' | 'domain'

**Actions**:
- `handleLocalLogin()` → POST /auth/login
- `handleDomainLogin()` → POST /auth/domain-login
- `handleClear()` → Clear all fields
- `toggleLoginMethod()` → Switch between login types

---

### 📊 DashboardPage
**Path**: `/dashboard`
**File**: `pages/DashboardPage/DashboardPage.jsx`

```
┌─────────────────────────────────────────────────────┐
│  📊 דשבורד                                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ 📦 פריטים   │  │ 👥 משתמשים   │  │ 🛒 הזמנות│ │
│  │  12,450     │  │    45        │  │   28     │ │
│  │ +5% מאתמול  │  │ +2 חדשים    │  │ ←בתהליך  │ │
│  └──────────────┘  └──────────────┘  └──────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  📈 תרשים מלאי - 7 ימים אחרונים            │  │
│  │                                               │  │
│  │        📊                                      │  │
│  │       📊 📊                                    │  │
│  │      📊   📊                                   │  │
│  │     📊     📊                                  │  │
│  │    Quantity over time (line chart)            │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  🔔 פעולות אחרונות                         │  │
│  ├──────────────────────────────────────────────┤  │
│  │ john.doe added LED-001 (5 min ago)          │  │
│  │ admin deleted obsolete-item (1 hour ago)    │  │
│  │ sarah.m edited item ABC-002 (2 hours ago)   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  ⚠️ דברים שדורשים תשומת לב                   │  │
│  ├──────────────────────────────────────────────┤  │
│  │ • 3 פריטים עם מלאי נמוך (< 10)               │  │
│  │ • 2 הזמנות בהמתנה לעדכון                     │  │
│  │ • 5 פריטים שלא עודכנו במשך 30 ימים         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Key metrics cards (total items, users, orders)
  - Current value
  - Change percentage
  - Trend indicator (↑↓)
  - Color-coded (green/red)
- ✅ Charts (Chart.js / Recharts)
  - Inventory trend over time
  - Items by category
  - User activity
- ✅ Recent activity feed
  - Username, action, timestamp
  - Sortable by date
  - Clickable to view details
- ✅ Alerts & warnings
  - Low stock items
  - Pending orders
  - Stale items
  - Expiring items (if applicable)
- ✅ Quick action buttons
  - Create new item
  - View all orders
  - View all users (admin)
- ✅ Responsive grid layout
- ✅ Real-time updates (polling or WebSocket)

**State Management**:
- `dashboardData`: { total_items, total_users, pending_orders, ... }
- `activityFeed`: [{ username, action, timestamp }]
- `alerts`: [{ type, message, severity }]
- `selectedMetric`: string (for detail view)

**Data Fetching**:
- `useQuery('dashboard')` → GET /api/analytics/dashboard
- `useQuery('activity')` → GET /api/analytics/activity

---

### 📦 InventoryTabbedPage
**Path**: `/inventory`
**File**: `pages/InventoryPage/InventoryTabbedPage.jsx`

```
┌──────────────────────────────────────────────────────┐
│  📦 ניהול מלאי                                       │
├──────────────────────────────────────────────────────┤
│  [ 📋 כל הפריטים ] [ 📤 ייבוא/ייצוא ] [ 🔍 חיפוש ] │
│                                                      │
│  TAB 1: Inventory Table                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ ☐ | ID | שם | כמות | ממחסן | פעולות          │   │
│  ├──────────────────────────────────────────────┤   │
│  │ ☑ | 1  | LED-001 | 50 | A1 | ✏️ 🗑️           │   │
│  │ ☐ | 2  | RESISTOR-100 | 100 | B2 | ✏️ 🗑️     │   │
│  │ ☐ | 3  | CAPACITOR-10uf | 25 | C3 | ✏️ 🗑️    │   │
│  └──────────────────────────────────────────────┘   │
│  [< Prev] Page 1 of 45 [Next >] | Items per page: 50│
│                                                      │
│  TAB 2: Import/Export Excel                          │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📤 ייצוא ל-Excel: [ ▼ XLSX ] [ Export ]      │   │
│  │                                               │   │
│  │ 📥 ייבוא מ-Excel:                            │   │
│  │ [ Drag file here או Click to select ]        │   │
│  │ Selected: parts-list.xlsx (125 rows)         │   │
│  │ [ Preview ] [ Import ]                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  TAB 3: Advanced Search                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ Search: [________________]                   │   │
│  │ Category: [ ▼ Electronics    ]                │   │
│  │ Status: ☑ Active ☐ Inactive                 │   │
│  │ Quantity: [10] - [1000]                      │   │
│  │ [ Clear Filters ] [ Search ] [ Save Filter ] │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Features**:
1. **Inventory Table Tab**:
   - ✅ Checkbox select all/individual items
   - ✅ Sortable columns (click header)
   - ✅ Pagination with customizable page size
   - ✅ Inline actions (Edit, Delete)
   - ✅ Right-click context menu
   - ✅ Bulk actions (Edit selected, Delete selected)
   - ✅ Column visibility toggle
   - ✅ Drag-drop column reordering
   - ✅ Column width adjustment
   - ✅ Loading skeleton while fetching
   - ✅ Empty state message

2. **Excel Import/Export Tab**:
   - ✅ Export button (XLSX/CSV format)
   - ✅ Drag-drop file upload
   - ✅ File type validation
   - ✅ Preview before import
   - ✅ Column mapping UI
   - ✅ Progress bar during import
   - ✅ Import results summary
   - ✅ Error details display
   - ✅ Undo import option (if enabled)

3. **Advanced Search Tab**:
   - ✅ Full-text search
   - ✅ Multiple filter dropdowns
   - ✅ Range sliders (quantity, price)
   - ✅ Multi-select checkboxes
   - ✅ Date range pickers
   - ✅ Search suggestions (autocomplete)
   - ✅ Clear all filters button
   - ✅ Save filter with name
   - ✅ Load saved filters
   - ✅ Export search results

**Modals**:
- ItemForm Modal (Add/Edit)
- DeleteConfirmation Modal
- BulkEditModal
- ColumnToggle Dropdown
- AssociatedCollections Modal

---

### 👨‍💼 AdminPage
**Path**: `/admin`
**File**: `pages/AdminPage/AdminPage.jsx`

```
┌──────────────────────────────────────────────────────┐
│  👨‍💼 Admin Panel                                      │
├──────────────────────────────────────────────────────┤
│  [ 👥 Users ] [ 🔐 Access Control ] [ 📋 Audit Log ]│
│                                                      │
│  TAB 1: User Management                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ [+ Add User] [Edit Selected] [Delete Selected]   │
│  │ Search: [______________]                     │   │
│  │ Role: [ ▼ All ]  Status: [☑ Active ☐ Inactive] │
│  ├──────────────────────────────────────────────┤   │
│  │ ☐ | Username | Email | Role | Last Login    │   │
│  ├──────────────────────────────────────────────┤   │
│  │ ☑ | john.doe | john@... | admin | now        │   │
│  │ ☐ | alice.m | alice@... | user | 2h ago     │   │
│  │ ☐ | bob.smith | bob@... | manager | 1d ago  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  TAB 2: Access Control                               │
│  ┌──────────────────────────────────────────────┐   │
│  │ User: [john.doe ▼]                          │   │
│  ├──────────────────────────────────────────────┤   │
│  │ Permissions:                                 │   │
│  │ ☑ INVENTORY_RO    ☑ INVENTORY_RW            │   │
│  │ ☑ PROCUREMENT_RO  ☑ PROCUREMENT_RW          │   │
│  │ ☑ ADMIN           ☑ AUDIT_VIEW              │   │
│  │                                               │   │
│  │ Groups:                                      │   │
│  │ [+ Add to Group]                             │   │
│  │ • Admins                                     │   │
│  │ • Managers                                   │   │
│  │                                               │   │
│  │ [ Save Changes ]                             │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  TAB 3: Audit Logs                                   │
│  ┌──────────────────────────────────────────────┐   │
│  │ User: [All ▼] Action: [All ▼] Date: [Range] │   │
│  ├──────────────────────────────────────────────┤   │
│  │ Timestamp | User | Action | Resource | Changes   │
│  ├──────────────────────────────────────────────┤   │
│  │ 14:30 | admin | DELETE | item:LED-001 | qty=50  │   │
│  │ 14:15 | john | UPDATE | user:alice.m | ...     │   │
│  │ 14:00 | system | LOGIN | admin | ...           │   │
│  └──────────────────────────────────────────────┘   │
│  [ Export as CSV ] [ More details... ]              │
└──────────────────────────────────────────────────────┘
```

**User Management Tab Features**:
- ✅ Add new user button → UserForm Modal
- ✅ User table with:
  - Checkbox multi-select
  - Columns: Username, Email, Role, Last Login, Status, Created Date
  - Sortable columns
  - Searchable
- ✅ Bulk actions:
  - Delete selected users
  - Change role for selected
  - Disable/enable selected
  - Reset password for selected
- ✅ Edit user button → UserForm Modal
  - Username (read-only)
  - Email
  - Role selector
  - Permissions checkboxes
  - Active/Inactive toggle
  - Password reset option
- ✅ Delete user with confirmation

**Access Control Tab Features**:
- ✅ User selector dropdown
- ✅ Permissions checkboxes (4 categories):
  - INVENTORY: RO, RW
  - PROCUREMENT: RO, RW
  - ADMIN: full access
  - AUDIT: view logs
- ✅ Group assignment
  - Add to group
  - Remove from group
- ✅ Save changes button
- ✅ Visual indicators of inherited permissions

**Audit Logs Tab Features**:
- ✅ Filter by:
  - User (dropdown)
  - Action type (Create, Update, Delete, Login)
  - Date range (from/to)
  - Resource type (Item, User, Order)
- ✅ Log table columns:
  - Timestamp
  - Username
  - Action
  - Resource
  - Details/Changes
- ✅ Click row → Detailed view modal
- ✅ Export as CSV
- ✅ Search within logs
- ✅ Pagination
- ✅ Auto-refresh option

---

### 🛒 ProcurementPage
**Path**: `/procurement`
**File**: `pages/ProcurementPage/ProcurementPage.jsx`

```
┌──────────────────────────────────────────────────────┐
│  🛒 ניהול הזמנות                                     │
├──────────────────────────────────────────────────────┤
│  [+ הזמנה חדשה] [Excel] 📊                         │
│  Status: [ ▼ All ] Supplier: [ ▼ All ]              │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ # | Order# | Supplier | Amount | Status | ...│   │
│  ├──────────────────────────────────────────────┤   │
│  │ 1 | PO-001 | Supplier A | $5,200 | ⏳ בהזמנה  │   │
│  │ 2 | PO-002 | Supplier B | $1,800 | ✅ הגיע  │   │
│  │ 3 | PO-003 | Supplier A | $3,400 | 📦 בדרך   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Order Details (Click to expand)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ PO-001 | Supplier A | Created: 2026-02-17  │   │
│  ├──────────────────────────────────────────────┤   │
│  │ Items:                                       │   │
│  │ • LED-001 × 100 @ $2.50 = $250              │   │
│  │ • RESISTOR-100 × 500 @ $0.10 = $50          │   │
│  │                                               │   │
│  │ Expected: 2026-03-01                        │   │
│  │ Status: Pending                              │   │
│  │                                               │   │
│  │ [📎 Attachments] [✏️ Edit] [🗑️ Delete]      │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Create new order button → OrderForm Modal
- ✅ Procurement orders table:
  - Order number (clickable)
  - Supplier name
  - Total amount
  - Status badges (Pending, Ordered, In Transit, Received, Cancelled)
  - Expected delivery date
  - Created date
  - Created by user
  - Sortable columns
- ✅ Filter by:
  - Status (dropdown multi-select)
  - Supplier (dropdown)
  - Date range
  - Amount range
- ✅ Search orders
- ✅ Bulk actions:
  - Export selected orders
  - Change status
  - Cancel selected
  - Add files to selected
- ✅ Order details expandable row:
  - Items in order with quantities
  - Pricing breakdown
  - Delivery timeline
  - Files/attachments
  - Supplier contact info
- ✅ Edit order
- ✅ Cancel/Delete order with confirmation
- ✅ File upload for each order
- ✅ Status timeline visualization
- ✅ Print order button

---

## 🧩 Inventory Components

### ItemForm Component
**File**: `components/inventory/ItemForm/ItemForm.jsx`

**Form Fields**:
```
Basic Info:
  • Catalog Number (required, unique)
  • Item Name (required)
  • Description (optional, long text)
  • Category (dropdown: Electronics, Hardware, Software, etc.)
  • Supplier (dropdown with search)

Stock Management:
  • Current Quantity (number, required)
  • Reserved Stock (number, read-only or editable)
  • Unit (dropdown: PCS, KG, L, BOX, etc.)
  • Minimum Stock (number, for alerts)
  • Reorder Point (number)

Pricing & Costing:
  • Cost Price (decimal)
  • Selling Price (decimal)
  • Margin % (calculated)

Location & Details:
  • Location/Bin (text, e.g., "A1-B2-C3")
  • Warehouse (dropdown)
  • Condition (Active/Obsolete/Damaged)
  • Notes (long text, optional)
  • Images (file upload)

Timestamps:
  • Created Date (auto, read-only)
  • Updated Date (auto, read-only)
  • Updated By (auto, read-only)
```

**Features**:
- ✅ Form validation:
  - Real-time validation on blur
  - Error messages under each field
  - Prevent submit if invalid
  - Visual error states (red border)
- ✅ Auto-save functionality (every 2 seconds while typing)
- ✅ Field dependencies:
  - If Cost and Price are filled → Calculate Margin
  - If Quantity changes → Show "Available" calculation
- ✅ Dropdown search/autocomplete
- ✅ Image preview (thumbnail)
- ✅ Drag-drop for images
- ✅ Character counter for text fields
- ✅ Clear button for each field
- ✅ Undo/Redo buttons (5 steps history)
- ✅ Save & Close button
- ✅ Cancel button
- ✅ Show loading spinner while saving
- ✅ Show success/error toast after save
- ✅ Keyboard shortcuts:
  - Ctrl+S to save
  - Esc to cancel

**State Management**:
- `formData`: item object (controlled inputs)
- `errors`: { field: message }
- `isDirty`: boolean (form has changes)
- `isSaving`: boolean
- `history`: array of previous values (for undo/redo)

---

### InventoryTable Component
**File**: `components/inventory/InventoryContent/InventoryContent.jsx`

**Columns** (with toggle visibility):
- ID / Catalog Number
- Item Name
- Category
- Current Quantity
- Reserved
- Available (calculated)
- Unit
- Location
- Supplier
- Cost
- Price
- Margin %
- Status
- Last Updated
- Updated By
- Actions

**Features**:
- ✅ Checkbox selection (all / individual)
- ✅ Sortable columns (click header, show sort indicator ↑↓)
- ✅ Filtering:
  - Column-specific filters
  - Quick filter search
  - Advanced filter panel
- ✅ Pagination:
  - First / Previous / Next / Last buttons
  - Page size selector (10, 25, 50, 100)
  - Jump to page input
  - Show "X-Y of Z items"
- ✅ Row actions:
  - Right-click context menu
  - Edit button
  - Delete button
  - View details
  - Duplicate item
  - Print label
  - View history
- ✅ Bulk actions (when items selected):
  - Edit selected items
  - Delete selected items
  - Export selected as CSV/Excel
  - Change category for selected
  - Change location for selected
- ✅ Row highlighting:
  - Hover effect
  - Selected row background color
  - Low stock items (red indicator)
  - Out of stock items (grey out)
- ✅ Column visibility toggle
  - Dropdown menu
  - Checkboxes for each column
  - Save preferences to localStorage
  - Reset to default
- ✅ Column resizing (drag border)
- ✅ Column reordering (drag header)
- ✅ Expand row detail view
  - Full item information
  - History of changes
  - Associated collections
  - Related items
- ✅ Loading states:
  - Skeleton loading
  - Row-level loading
  - Refresh button
- ✅ Empty state:
  - Message with icon
  - "Create first item" button

---

### ExcelManager Component
**File**: `components/inventory/ExcelManager/ExcelManager.jsx`

**Features**:
- ✅ **Export Section**:
  - Format selector (XLSX, CSV)
  - Filter options (apply current filters to export)
  - Include hidden columns toggle
  - Column selector (which columns to include)
  - Export button
  - Success notification

- ✅ **Import Section**:
  - Drag-drop zone (highlight on drag over)
  - Click to browse files
  - File type validation (.xlsx, .csv, .xls)
  - File size limit check
  - Display selected file with:
    - Filename
    - File size
    - Number of rows detected
  - Preview button
  - Column mapping UI:
    - Source column selector
    - Target field selector
    - Required fields indicator
    - Data type indicator
  - Import button with progress bar
  - Cancel import option

- ✅ **Preview Modal**:
  - Show first 5-10 rows
  - Display all columns
  - Highlight issues/errors
  - Show mapping used
  - Cancel / Confirm buttons

- ✅ **Import Results**:
  - Summary toast:
    - "✅ 47 items imported"
    - "⚠️ 3 items skipped"
    - "❌ 1 error"
  - Details modal:
    - List of imported items
    - List of skipped items (with reasons)
    - List of errors (with row numbers)
    - Option to download error report
  - Undo import button (if supported)

---

### BulkEditModal Component
**File**: `components/inventory/BulkEditModal/BulkEditModal.jsx`

```
┌────────────────────────────────────┐
│ ✏️ Bulk Edit                       │
├────────────────────────────────────┤
│ Editing 5 items:                   │
│ • LED-001, LED-002, LED-003        │
│ • RESISTOR-100, CAPACITOR-10uf     │
│                                    │
│ Select field to update:            │
│ [▼ Category]                       │
│ [▼ Location]                       │
│ [▼ Status]                         │
│                                    │
│ New value: [Electronics ▼]         │
│ [+Add more fields]                 │
│                                    │
│ New values:                        │
│ • Category → Electronics           │
│ • Location → A1                    │
│                                    │
│ [ Apply ] [ Cancel ]               │
└────────────────────────────────────┘
```

**Features**:
- ✅ Show count and preview of selected items
- ✅ Multi-field editing:
  - Add multiple field updates
  - Each field has own value input
  - Field-specific input types (text, number, dropdown)
- ✅ Remove field from update
- ✅ Preview of changes before apply
- ✅ Apply button → POST /bulk-update
- ✅ Loading state during submit
- ✅ Success notification
- ✅ Error handling with retry

---

### DeleteConfirmation Component
**File**: `components/inventory/DeleteConfirmation/DeleteConfirmation.jsx`

```
┌────────────────────────────────────┐
│ ⚠️ Delete Confirmation             │
├────────────────────────────────────┤
│ Are you sure you want to delete:   │
│                                    │
│ LED-001 × 5 other items?           │
│                                    │
│ This action cannot be undone.      │
│                                    │
│ Reason for deletion (required):    │
│ [________________________________] │
│ (e.g., "Damaged", "Obsolete")      │
│                                    │
│ ☐ I understand this is permanent  │
│                                    │
│ [ Delete ] [ Cancel ]              │
└────────────────────────────────────┘
```

**Features**:
- ✅ Show what will be deleted
  - Item name
  - Count if bulk delete
  - Preview of items (first 3, +X more)
- ✅ Warning message about permanent deletion
- ✅ Reason input (required):
  - Placeholder with examples
  - Min/max length validation
  - Character counter
- ✅ Confirmation checkbox (required)
- ✅ Delete button (disabled until reason filled and checkbox checked)
- ✅ Cancel button
- ✅ Show spinner while deleting
- ✅ Show success toast after delete
- ✅ Show error if deletion fails
- ✅ Auto-focus reason input on open

---

### ColumnToggle Component
**File**: `components/inventory/ColumnToggle/ColumnToggle.jsx`

```
┌─────────────────────────────┐
│ 👁️ Column Visibility       │
├─────────────────────────────┤
│ [Search columns...]         │
│                             │
│ ☑ Catalog Number           │
│ ☑ Item Name                │
│ ☑ Category                 │
│ ☐ Description              │
│ ☑ Quantity                 │
│ ☑ Reserved                 │
│ ☑ Available                │
│ ☐ Cost Price               │
│ ☐ Selling Price            │
│ ☑ Location                 │
│ ☑ Actions                  │
│                             │
│ [ Reset to Default ]        │
│ [ Apply ] [ Cancel ]        │
└─────────────────────────────┘
```

**Features**:
- ✅ List of all available columns
- ✅ Checkboxes to toggle visibility
- ✅ Search/filter columns
- ✅ Reset to default button
- ✅ Apply button → Save to localStorage
- ✅ Remember user preferences
- ✅ Fast toggle (click checkbox immediately updates)

---

### AssociatedCollectionsModal Component
**File**: `components/inventory/AssociatedCollectionsModal/AssociatedCollectionsModal.jsx`

**Features**:
- ✅ Show all collections
- ✅ Checkboxes to associate/dissociate
- ✅ Search collections
- ✅ Show currently associated collections at top
- ✅ Show unassociated available collections
- ✅ Add to collection button
- ✅ Remove from collection button
- ✅ Submit button → Update associations
- ✅ Show count: "Associated with 3 collections"

---

## 👥 Admin Components

### UserTable Component
**File**: `components/admin/UserTable.jsx`

**Columns**:
- Checkbox
- Username
- Email
- Full Name
- Role
- Status (Active/Inactive)
- Last Login
- Created Date
- Actions

**Features**:
- ✅ Same as InventoryTable features
- ✅ Sortable, filterable, paginated
- ✅ Search by username/email
- ✅ Filter by role
- ✅ Filter by status
- ✅ Edit button → UserForm Modal
- ✅ Delete button → Confirmation Modal
- ✅ Reset password button
- ✅ Disable/Enable user button
- ✅ View login history button
- ✅ Bulk actions:
  - Change role
  - Disable selected
  - Enable selected
  - Delete selected
  - Reset password for selected

---

### UserForm Component
**File**: `components/admin/UserForm.jsx`

**Form Fields** (for Add/Edit):
```
Personal Info:
  • Username (unique, required)
  • Email (unique, required)
  • Full Name (optional)
  • Password (required on create, optional on edit)
  • Confirm Password

Account Settings:
  • Role (dropdown: admin, manager, user, procurement)
  • Status (Active/Inactive)
  • Groups (multi-select)

Permissions:
  • INVENTORY_RO
  • INVENTORY_RW
  • PROCUREMENT_RO
  • PROCUREMENT_RW
  • ADMIN
  • AUDIT_VIEW

Additional:
  • Email verified (read-only checkbox)
  • Last login (read-only)
  • Created by (read-only)
  • Created date (read-only)
```

**Features**:
- ✅ Form validation
- ✅ Password strength indicator
- ✅ Show/hide password toggle
- ✅ Email validation
- ✅ Permission checkboxes with descriptions
- ✅ Role → Permission auto-mapping (selecting role auto-checks relevant permissions)
- ✅ Disable fields based on role
- ✅ Save button
- ✅ Cancel button
- ✅ Delete button (if editing)

---

### AuditLogsTable Component
**File**: `components/admin/AuditLogsTable.jsx`

**Columns**:
- Timestamp
- Username (created_by)
- Action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- Resource Type (item, user, order, collection)
- Resource ID / Name
- Changes (old → new)
- IP Address
- User Agent

**Features**:
- ✅ Filterable by:
  - User (multi-select)
  - Action type (multi-select)
  - Resource type (multi-select)
  - Date range (from/to)
  - Search (any field)
- ✅ Sortable columns
- ✅ Paginated
- ✅ Row expand → Detailed view modal
- ✅ Show/hide IP & User Agent columns
- ✅ Export as CSV/JSON
- ✅ Bulk export selected rows
- ✅ Auto-refresh option (poll backend)
- ✅ Time display options (Relative / Absolute)

---

## 🛒 Procurement Components

### OrderForm Component
**File**: `components/procurement/OrderForm.jsx`

**Form Fields**:
```
Order Info:
  • Supplier (autocomplete dropdown)
  • Supplier Contact (auto-populate)
  • PO Number (auto-generated or manual)

Items Section:
  • Item selector (search catalog)
  • Quantity (number)
  • Unit Price (decimal)
  • Subtotal (calculated)
  • [+ Add Item Button]
  
  Items table:
    - Item name
    - Quantity
    - Unit Price
    - Total
    - Remove button

Totals:
  • Subtotal (calculated)
  • Tax % (input)
  • Tax Amount (calculated)
  • Total Amount (calculated)
  • Shipping (optional)
  • Grand Total

Expected Delivery:
  • Date picker

Notes:
  • Special instructions (optional long text)
```

**Features**:
- ✅ Supplier autocomplete search
- ✅ Item search and add multiple
- ✅ Remove items from order
- ✅ Edit item quantity/price
- ✅ Auto-calculate subtotals
- ✅ Tax calculation
- ✅ Form validation
- ✅ Save button → POST /procurement/orders
- ✅ Loading state
- ✅ Success/Error toast

---

### OrdersList Component
**File**: `components/procurement/OrdersList.jsx`

**Features**:
- ✅ Similar to InventoryTable
- ✅ Status badges (visual colors)
- ✅ Expandable order details
- ✅ File upload per order
- ✅ Timeline view (status progression)
- ✅ Bulk actions (export, change status, cancel)

---

## 🎨 Common/Reusable Components

### Spinner Component
**File**: `components/common/Spinner/Spinner.jsx`

```
    ⠋
  ⠙ Loading...
    ⠹
```

**Props**:
- `size`: 'small' | 'medium' | 'large'
- `text`: string (optional loading message)
- `color`: string (CSS color)
- `inline`: boolean (inline vs block)

---

### Toast Component
**File**: `components/common/Toast/Toast.jsx`

```
┌──────────────────────────────────┐
│ ✅ Item added successfully!   ✕  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ❌ Error: Item not found       ✕  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ⚠️  Warning: Low stock         ✕  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ℹ️  Info: Please save changes  ✕  │
└──────────────────────────────────┘
```

**Features**:
- ✅ Auto-dismiss after 3-5 seconds
- ✅ Manual close button
- ✅ Different types: success, error, warning, info
- ✅ Position: top-right (configurable)
- ✅ Multiple toasts stack
- ✅ Smooth animation
- ✅ Custom message
- ✅ Optional action button

---

### Modal Component
**File**: `components/common/Modal/Modal.jsx`

```
┌─────────────────────────────────┐
│ Modal Title                  ✕  │
├─────────────────────────────────┤
│                                 │
│  Modal content goes here...     │
│  [Lorem ipsum dolor sit amet]   │
│                                 │
├─────────────────────────────────┤
│                    [ OK ] [ Cancel ]
└─────────────────────────────────┘
```

**Features**:
- ✅ Customizable title
- ✅ Backdrop click to close (configurable)
- ✅ Close button (X)
- ✅ Custom footer buttons
- ✅ Scroll body if content exceeds height
- ✅ Keyboard: Esc to close
- ✅ Focus trap
- ✅ Fade in/out animation

---

### Table Component
**File**: `components/common/Table/Table.jsx`

**Features**:
- ✅ Generic table component
- ✅ Configurable columns
- ✅ Sortable columns
- ✅ Row selection (checkboxes)
- ✅ Pagination
- ✅ Custom cell renderers
- ✅ Expandable rows
- ✅ Loading state
- ✅ Empty state
- ✅ Column visibility control

---

### Form Component
**File**: `components/common/Form/Form.jsx`

**Features**:
- ✅ Form wrapper component
- ✅ Built-in validation
- ✅ Error message display
- ✅ Form state management
- ✅ Submit handling
- ✅ Reset button
- ✅ Disabled state during submit

---

### ErrorBoundary Component
**File**: `components/common/ErrorBoundary/ErrorBoundary.jsx`

**Features**:
- ✅ Catches React errors
- ✅ Shows fallback UI
- ✅ Logs error to console/service
- ✅ "Try again" button
- ✅ Prevents white screen of death

---

## 🎯 UI Features & Interactions

### Search & Filter Features
- ✅ Real-time search (debounced)
- ✅ Multiple filter types:
  - Text input
  - Dropdowns (single/multi-select)
  - Range sliders
  - Date pickers
  - Checkboxes
- ✅ Save filters with names
- ✅ Load saved filters
- ✅ Clear all filters
- ✅ Filter suggestions/autocomplete
- ✅ Filter preview (show matching count)
- ✅ Filter URL encoding (shareable URLs)

### Sorting Features
- ✅ Click column header to sort
- ✅ Ascending/Descending toggle
- ✅ Multi-column sort (Shift + Click)
- ✅ Sort indicator (↑↓)
- ✅ Remember sort preference

### Pagination Features
- ✅ First / Previous / Next / Last buttons
- ✅ Page size selector
- ✅ Jump to page input
- ✅ Display "X-Y of Z items"
- ✅ Disabled buttons at boundaries
- ✅ Remember page size preference

### Selection Features
- ✅ Select All / Deselect All checkbox
- ✅ Individual row selection
- ✅ Show count: "X items selected"
- ✅ Quick actions appear when items selected
- ✅ Deselect on page change (configurable)

---

## ⚠️ Error Handling & Loading States

### Loading States
```
Global:
  • Page-level spinner (full page)
  • Section-level spinner
  • Skeleton loading (placeholder UI)

Component-level:
  • Button spinner (loading button)
  • Inline spinner
  • Progress bar (for uploads)

Table:
  • Skeleton rows
  • Show "Loading..." message
  • Disable interactions during load
```

### Error States
```
API Errors:
  • Show toast notification
  • Display inline error message
  • Show "Retry" button
  • Log to console for debugging

Form Errors:
  • Red border around field
  • Error message below field
  • Prevent form submission
  • Show field-level validation

404 Not Found:
  • Show "Item not found" message
  • Show "Go back" button

403 Forbidden:
  • Show "Access denied" message
  • Redirect to dashboard

500 Server Error:
  • Show "Something went wrong" message
  • Show "Contact support" or "Retry" button
  • Log error ID for support
```

### Empty States
```
No Results:
  • Show icon + message: "No items found"
  • Show search/filter suggestions
  • Show "Create new" button if applicable

Initial Load (no data):
  • Show welcome message
  • Show "Create first item" button
  • Show quick start guide
```

### Success States
```
After Create:
  • Show success toast: "✅ Item created"
  • Refresh table automatically
  • Close modal
  • Optional: Scroll to new item

After Update:
  • Show success toast: "✅ Item updated"
  • Refresh affected rows
  • Update in-memory cache

After Delete:
  • Show success toast: "✅ Item deleted"
  • Remove from table
  • Adjust pagination if needed
```

---

## 🎨 Theme & Styling

### Dark Mode Support
- ✅ Light theme (default)
- ✅ Dark theme
- ✅ Smooth transition between themes
- ✅ Persist preference to localStorage
- ✅ Respect system preference (if not saved)
- ✅ All components support both themes

### Responsive Design
- ✅ Mobile breakpoints:
  - xs: < 576px
  - sm: 576px - 768px
  - md: 768px - 992px
  - lg: 992px - 1200px
  - xl: > 1200px
- ✅ Tablets: Stack table, hide non-essential columns
- ✅ Mobile: Navigation drawer, smaller fonts, touch-friendly buttons
- ✅ Desktop: Full-featured layout

### Accessibility
- ✅ Semantic HTML
- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation:
  - Tab through form fields
  - Enter to submit
  - Esc to close modals
  - Arrow keys for dropdowns
- ✅ Color contrast (WCAG AA)
- ✅ Focus indicators (visible outlines)
- ✅ Alt text for images
- ✅ Form labels associated with inputs

---

**Last Updated**: 17-02-2026
**Frontend Framework**: React 18+
**Component Library**: Custom + Tailwind CSS / Material-UI (varies by component)
