# Frontend Tests Action Plan

> **Status as of last run:** 726 / 726 unit tests passing (all pre-existing failures fixed).  
> E2E suite not run — requires live stack.  
> This document is the execution plan for agents or engineers implementing the missing coverage.

---

## 0 · Infrastructure Notes

| Item | Value |
|---|---|
| Framework | React 18 + Vite 5 |
| Test runner | Vitest 4.1.4 |
| DOM | jsdom (vitest.config.js) |
| Unit libraries | `@testing-library/react` v16, `@testing-library/user-event` v14, `@testing-library/jest-dom` v6 |
| E2E | Playwright 1.58.2, Chromium only, sequential (`workers=1`) |
| Config | `frontend/vitest.config.js`, `frontend/playwright.config.js` |
| Setup file | `frontend/src/setupTests.js` |
| Unit pattern | `src/**/*.{test,spec}.{js,jsx}` |
| E2E pattern | `frontend/tests/e2e/**/*.spec.js` |
| **Critical rule** | Hook test files that use JSX wrappers (`<QueryClientProvider>`, etc.) MUST use `.jsx` extension |

### Mock patterns used in existing tests

```js
// React Query wrapper for hooks
const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// Auth context wrapper
const buildWrapper = (user, extra = {}) => {
  useAuthQuery.mockReturnValue({ user, isAuthenticated: !!user, isLoading: false,
    login: vi.fn(), logout: vi.fn(), ...extra });
  return ({ children }) => <AuthProvider>{children}</AuthProvider>;
};
```

---

## 1 · Existing-Failure Fixes (DONE ✅)

All 11 pre-existing failures were fixed. Summary of root causes and fixes applied:

| # | File | Root Cause | Fix Applied |
|---|---|---|---|
| 1–8 | `src/hooks/__tests__/use*.test.js` (8 files) | JSX in `.js` extension — Vite doesn't transpile JSX in non-.jsx files | Renamed all 8 to `.test.jsx` |
| 9 | `src/api/services/__tests__/analyticsService.test.js` | `API_ENDPOINTS.ANALYTICS_TIMELINE` was missing from `endpoints.js` | Added `ANALYTICS_TIMELINE: '/analytics/timeline'` |
| 10 | `src/context/__tests__/AuthContext.test.jsx` | `hasPermission(undefined)` threw TypeError; `isAdmin = undefined` for null user | Added null guard in `hasPermission`; fixed `isAdmin` to `!!(...)`; computed `isAuthenticated = !!user` locally |
| 11 | `src/hooks/__tests__/useBomTemplates.test.jsx` | `placeholderData` makes `isLoading=false` immediately, test was reading placeholder data | Changed test to `waitFor(() => templates equals fetched data)` |
| 12 | `src/components/admin/__tests__/UserForm.test.jsx` (4 tests) | Tested behavior the component doesn't have (password only for local users; role selector only in edit mode; username is read-only meta in edit mode) | Updated tests to match actual component behavior |
| 13 | `src/components/admin/__tests__/GroupForm.test.jsx` (3 tests) | `getByText` on duplicated text; no editable name input in edit mode; React 18 stale closure on submit | Fixed with `getAllByText`; verify state via PermissionSelector re-render using `userEvent` |
| 14 | `src/hooks/__tests__/useItems.test.jsx` (3 tests) | Tests called `deleteItem/bulkUpdate/bulkDelete` with object arg instead of positional args | Fixed call signatures |

---

## 2 · Phase 1 — Core Infrastructure Tests (High Priority)

> **17 new test files.** These cover foundational units that every feature depends on.

### 2.1 Contexts

#### `src/context/__tests__/ThemeContext.test.jsx`
Tests the `ThemeContext` provider and `useTheme()` hook.

```
Describe: ThemeContext
  ✎ provides default mode ('light') and variant ('default')
  ✎ toggleMode() switches light → dark → light
  ✎ setMode('dark') sets mode to 'dark'
  ✎ setVariant('compact') updates variant
  ✎ persists mode to localStorage on change
  ✎ reads initial mode from localStorage on mount
  ✎ useTheme() throws when used outside ThemeProvider
  ✎ document.documentElement receives data-theme and data-variant attributes
```

#### `src/context/__tests__/ToastContext.test.jsx`
Tests the `ToastContext` provider and `useToast()` hook.

```
Describe: ToastContext
  ✎ addToast() appends a toast with id, type, message
  ✎ removeToast(id) removes the matching toast
  ✎ toasts auto-remove after duration
  ✎ useToast() throws when used outside ToastProvider
  ✎ multiple toasts can coexist
```

### 2.2 API Services

#### `src/api/services/__tests__/auditService.test.js`
```
Describe: auditService
  ✎ getLogs() calls GET /audit/logs with params
  ✎ getUserActivity(username) calls correct endpoint
  ✎ handles pagination params
  ✎ propagates API errors
```

### 2.3 Hooks

#### `src/hooks/__tests__/useAuthQuery.test.jsx`
```
Describe: useAuthQuery
  ✎ returns user=null and isAuthenticated=false on unauthenticated state
  ✎ returns user object when authenticated
  ✎ exposes isLoading=true during initial fetch
  ✎ login mutation calls authService.login and invalidates user query
  ✎ logout mutation calls authService.logout and clears query data
  ✎ domain login handshake fires when hashedToken in URL
```

#### `src/hooks/__tests__/useLocalStorage.test.js`
```
Describe: useLocalStorage
  ✎ returns initialValue when key not in localStorage
  ✎ reads existing value from localStorage
  ✎ setValue() updates localStorage
  ✎ setValue() triggers re-render with new value
  ✎ handles JSON parse errors gracefully (returns initialValue)
```

#### `src/hooks/__tests__/useViewMode.test.js`
```
Describe: useViewMode
  ✎ default mode is 'table'
  ✎ setViewMode('grid') updates mode
  ✎ persists viewMode to localStorage
  ✎ reads persisted value on mount
```

#### `src/hooks/__tests__/useNavigationBlocker.test.jsx`
```
Describe: useNavigationBlocker
  ✎ does not block when isDirty=false
  ✎ sets blocked=true when isDirty=true and navigation is attempted
  ✎ confirm() unblocks navigation
  ✎ cancel() leaves blocked state
```

### 2.4 Common Components

#### `src/components/common/__tests__/Button.test.jsx`
```
Describe: Button
  ✎ renders children
  ✎ calls onClick on click
  ✎ disabled prop disables button and prevents click
  ✎ type="submit" renders submit button
  ✎ variant prop adds CSS class
  ✎ renders loading spinner when loading=true
```

#### `src/components/common/__tests__/Modal.test.jsx`
```
Describe: Modal
  ✎ renders when open=true
  ✎ does not render when open=false
  ✎ renders title and children
  ✎ calls onClose when backdrop clicked
  ✎ calls onClose when Escape pressed
  ✎ does not close when modal content clicked
```

#### `src/components/common/__tests__/Pagination.test.jsx`
```
Describe: Pagination
  ✎ renders page numbers
  ✎ calls onPageChange with correct page on click
  ✎ disables Prev on page 1
  ✎ disables Next on last page
  ✎ renders correct total pages
  ✎ does not render when totalPages=1
```

#### `src/components/common/__tests__/Tabs.test.jsx`
```
Describe: Tabs
  ✎ renders all tab labels
  ✎ shows first tab content by default
  ✎ clicking tab shows its content
  ✎ active tab has active styling
  ✎ renders tab badge count when provided
```

#### `src/components/common/__tests__/Toast.test.jsx`
```
Describe: Toast
  ✎ renders message
  ✎ applies correct class for type (success/error/info/warning)
  ✎ calls onClose when close button clicked
  ✎ auto-dismisses after duration
```

#### `src/components/common/__tests__/ToastContainer.test.jsx`
```
Describe: ToastContainer
  ✎ renders nothing when no toasts
  ✎ renders each toast from ToastContext
  ✎ removing a toast from context removes it from DOM
```

#### `src/components/common/__tests__/ErrorBoundary.test.jsx`
```
Describe: ErrorBoundary
  ✎ renders children normally when no error
  ✎ renders fallback UI when child throws
  ✎ calls onError callback with error details
  ✎ reset prop re-renders children after error recovery
```

#### `src/components/common/__tests__/NavigationWarningModal.test.jsx`
```
Describe: NavigationWarningModal
  ✎ does not render when not blocked
  ✎ renders warning message when blocked=true
  ✎ calls onConfirm when "Leave" clicked
  ✎ calls onCancel when "Stay" clicked
```

#### `src/components/auth/__tests__/LoginForm.test.jsx`
```
Describe: LoginForm
  ✎ renders username and password fields
  ✎ renders submit button
  ✎ submit calls onLogin with username and password
  ✎ shows error message on invalid credentials
  ✎ disables submit while loading
  ✎ shows loading state during submission
```

#### `src/components/common/__tests__/GlobalSearch.test.jsx`
```
Describe: GlobalSearch
  ✎ renders search input
  ✎ calls search API on input change (debounced)
  ✎ displays results grouped by type
  ✎ navigates to result on click
  ✎ clears results on empty input
  ✎ shows "no results" when API returns empty
```

---

## 3 · Phase 2 — Business Logic Tests (Medium-High Priority)

> **~20 new test files.** Focus on hooks with complex mutation logic and data-heavy components.

### 3.1 Hooks — Extended coverage

#### `src/hooks/__tests__/useCatalog.test.jsx`
```
Describe: useCatalog
  ✎ fetches catalog items on mount
  ✎ search params filter results
  ✎ handles loading and error states
  ✎ refreshCatalog() invalidates and re-fetches
```

#### `src/hooks/__tests__/useCollectionPermissions.test.jsx`
```
Describe: useCollectionPermissions
  ✎ fetches permissions for collection id
  ✎ addPermission() calls POST and invalidates
  ✎ removePermission() calls DELETE and invalidates
  ✎ updatePermission() calls PATCH and invalidates
```

#### `src/hooks/__tests__/useCollectionCellSelection.test.jsx`
```
Describe: useCollectionCellSelection
  ✎ initial selection is empty
  ✎ selectCell() adds cell to selection
  ✎ clearSelection() empties selection
  ✎ multiSelect mode allows multiple cells
  ✎ toggleCell() adds/removes
```

#### `src/hooks/__tests__/useColumnResize.test.js`
```
Describe: useColumnResize
  ✎ returns initial column widths
  ✎ setColumnWidth() updates width for column key
  ✎ persists widths to localStorage
  ✎ resets to defaults with resetWidths()
```

### 3.2 Inventory Components

#### `src/components/inventory/__tests__/ItemTable.test.jsx`
```
Describe: ItemTable
  ✎ renders item rows
  ✎ renders column headers
  ✎ calls onSort when column header clicked
  ✎ shows loading skeleton while loading=true
  ✎ shows empty state when no items
  ✎ checkbox selects/deselects row
  ✎ onRowClick fires with item data
```

#### `src/components/inventory/__tests__/DetailPanel.test.jsx`
```
Describe: DetailPanel
  ✎ renders item fields when item provided
  ✎ renders null/empty when no item
  ✎ edit button enters edit mode
  ✎ save button calls onUpdate with changed fields
  ✎ cancel reverts changes
  ✎ delete button calls onDelete with confirmation
```

#### `src/components/inventory/__tests__/ActiveFiltersBar.test.jsx`
```
Describe: ActiveFiltersBar
  ✎ renders nothing when no active filters
  ✎ renders pill for each active filter
  ✎ clicking filter pill calls onRemove(key)
  ✎ "Clear all" button clears all filters
```

#### `src/components/inventory/__tests__/ViewModeToggle.test.jsx`
```
Describe: ViewModeToggle
  ✎ renders table and grid toggle buttons
  ✎ active mode button has active class
  ✎ clicking inactive mode calls onToggle with new mode
```

### 3.3 Catalog Components

#### `src/components/catalog/__tests__/CatalogTable.test.jsx`
```
Describe: CatalogTable
  ✎ renders rows with catalog data
  ✎ item click calls onItemSelect
  ✎ shows quantity column when showQuantity=true
  ✎ sorting by column header fires onSort
  ✎ empty state renders "no items" message
```

### 3.4 MyComponents (Collections)

#### `src/components/myComponents/__tests__/CreateCollectionDialog.test.jsx`
```
Describe: CreateCollectionDialog
  ✎ renders name and description fields
  ✎ submit calls onCreate with form data
  ✎ shows error when name is empty
  ✎ cancel calls onCancel
```

#### `src/components/myComponents/__tests__/CollectionItemsTable.test.jsx`
```
Describe: CollectionItemsTable
  ✎ renders collection items
  ✎ inline edit triggers onCellEdit with itemId and field
  ✎ shows remove button when user has write permission
  ✎ confirms before removing item
```

#### `src/components/myComponents/__tests__/PermissionsManager.test.jsx`
```
Describe: PermissionsManager
  ✎ renders list of current permissions
  ✎ add button shows user search
  ✎ selecting user adds permission
  ✎ remove button calls onRemove with user id
  ✎ change permission level calls onUpdate
```

#### `src/components/myComponents/__tests__/CustomFieldsEditor.test.jsx`
```
Describe: CustomFieldsEditor
  ✎ renders existing custom fields
  ✎ add field button creates new field row
  ✎ field type selector changes field config
  ✎ delete icon removes field
  ✎ save calls onSave with field definitions
```

#### `src/components/myComponents/__tests__/CollectionSettings.test.jsx`
```
Describe: CollectionSettings
  ✎ renders collection name and description
  ✎ edit mode shows editable fields
  ✎ save calls onUpdate with new values
  ✎ delete collection calls onDelete with confirmation
```

#### `src/components/myComponents/__tests__/AssignItemDialog.test.jsx`
```
Describe: AssignItemDialog
  ✎ renders catalog search
  ✎ selecting item calls onAssign with item data
  ✎ quantity input updates assignment data
  ✎ cancel closes dialog
```

---

## 4 · Phase 3 — Dashboard, Admin & Logs (Medium Priority)

### 4.1 Dashboard

Each chart component is a thin wrapper around Recharts; test that it renders and responds to data props.

**Files to create:**
- `src/pages/dashboard/__tests__/StatCard.test.jsx` — renders value, label, trend arrow
- `src/pages/dashboard/__tests__/ChartCard.test.jsx` — renders title and child chart
- `src/pages/dashboard/__tests__/InventoryByLocation.test.jsx` — renders BarChart with location data
- `src/pages/dashboard/__tests__/CategoryDistribution.test.jsx` — renders PieChart
- `src/pages/dashboard/__tests__/ItemMovementTrend.test.jsx` — renders LineChart
- `src/pages/dashboard/__tests__/RecentActivity.test.jsx` — renders activity list items
- `src/pages/dashboard/__tests__/TopMovingItems.test.jsx` — renders items ranked by movement

```
Describe: [Chart Component]
  ✎ renders without crashing when data=[]
  ✎ renders correct number of data points
  ✎ legend labels match data keys
  ✎ tooltip shows correct values on hover
```

### 4.2 Admin Components

#### `src/components/admin/__tests__/AiToolsPanel.test.jsx`
```
Describe: AiToolsPanel
  ✎ renders AI tools list
  ✎ train button calls onTrain
  ✎ shows training status / progress bar
  ✎ error state renders error message
```

#### `src/components/admin/__tests__/PermissionSelector.test.jsx`
```
Describe: PermissionSelector
  ✎ renders available permission groups
  ✎ clicking permission toggles selection
  ✎ calls onChange with updated permissions array
  ✎ pre-selects permissions from selectedPermissions prop
  ✎ read-only mode disables checkboxes
```

### 4.3 Logs Components

#### `src/components/logs/__tests__/LogFilters.test.jsx`
```
Describe: LogFilters
  ✎ renders date range pickers
  ✎ renders action type select
  ✎ onChange fires with updated filter values
  ✎ clear button resets all filters
```

#### `src/components/logs/__tests__/LogTimeline.test.jsx`
```
Describe: LogTimeline
  ✎ renders log entries in chronological order
  ✎ each entry shows user, action, and timestamp
  ✎ empty state renders "no logs" message
  ✎ expandable detail row shows full payload on click
```

### 4.4 Layout Components

#### `src/components/layout/__tests__/Logo.test.jsx`
```
Describe: Logo
  ✎ renders logo image/svg
  ✎ clicking logo navigates to home
  ✎ compact variant renders smaller logo
```

#### `src/components/layout/__tests__/ThemeSelector.test.jsx`
```
Describe: ThemeSelector
  ✎ renders light/dark toggle
  ✎ current mode is visually selected
  ✎ clicking toggle calls setMode with opposite mode
  ✎ renders variant selector if exposed
```

---

## 5 · Phase 4 — Utils & Pure Functions (Lower Priority)

> These have no React dependency — plain unit tests with no DOM or JSX.

### Files to create

#### `src/utils/__tests__/formatters.test.js`
Cover every exported function in `src/utils/formatters.js` (or the relevant file):
- date formatting functions
- currency / number formatting
- unit conversion helpers
- truncation utilities

#### `src/utils/__tests__/validators.test.js`
Cover validation helpers (email regex, URL, password rules, etc.)

#### `src/lib/__tests__/queryKeys.test.js`
Verify `QUERY_KEYS` structure — keys are deterministic strings/arrays matching backend route patterns.

#### `src/utils/__tests__/excelHelpers.test.js`
If `src/utils/excelHelpers.js` exists: test row parsing, header normalization, and error-row detection.

---

## 6 · Phase 5 — E2E Tests (Playwright) (Lower Priority, requires live stack)

> E2E tests live in `frontend/tests/e2e/`. Run with `npm run test:e2e` (sequential, shared DB).

### 6.1 BOM Template Wizard flow

**File:** `frontend/tests/e2e/bomTemplateWizard.spec.js`

```
describe: BOM Template Wizard
  test: admin can open wizard and see vendor list
  test: selecting vendor and uploading CSV advances to column-mapping step
  test: column mapping shows preview of first 5 rows
  test: saving template creates entry in the DB (UI shows new vendor card)
  test: editing existing template pre-fills fields
  test: deleting template removes it from vendor list
```

### 6.2 My-Components deep CRUD

**File:** `frontend/tests/e2e/myComponentsCRUD.spec.js`

```
describe: My Components
  test: user can create a new collection with name and description
  test: collection appears in sidebar after creation
  test: owner can open Settings and rename collection
  test: owner can add custom fields of different types
  test: custom field values are editable per row in the items table
  test: owner can invite another user with RO permission
  test: RO user cannot edit items in shared collection
  test: RW user can edit items
  test: owner can delete collection (with confirmation dialog)
```

### 6.3 Collection items inline editing

**File:** `frontend/tests/e2e/collectionItemsEditing.spec.js`

```
describe: Collection Inline Editing
  test: clicking a cell enters edit mode
  test: typing new value and pressing Enter saves it
  test: pressing Escape reverts change
  test: saving reflects in the row without full page reload
  test: bulk-select and remove items shows confirmation
```

### 6.4 Procurement BOM scanner phase flow

**File:** `frontend/tests/e2e/procurementBomScanner.spec.js`

```
describe: Procurement BOM Scanner
  test: opening scanner shows vendor selector
  test: selecting vendor shows pre-scan upload step
  test: uploading valid file advances to scan results
  test: scan results show matched catalog items
  test: user can add matched items to an order
  test: submitting order creates it in the DB and navigates to order view
```

### 6.5 Guide pages smoke tests

**File:** `frontend/tests/e2e/guidePages.spec.js`

```
describe: Guide Pages
  test: /guide renders without 404
  test: /guide shows expected section headings
  test: all internal links in guide page are reachable (no 404s)
```

---

## 7 · Execution Order for Agents

```
Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5
```

Within each phase, files can be implemented in parallel (no ordering constraint within a phase).  
Run `npm run test:unit` after each new test file to confirm it passes before moving to the next.

---

## 8 · Coverage Targets

| Module | Current (estimated) | Target |
|---|---|---|
| Hooks | ~65% | 90% |
| API Services | ~80% | 95% |
| Contexts | ~70% | 95% |
| Common Components | ~30% | 85% |
| Dashboard | 0% | 70% |
| Inventory | ~45% | 80% |
| MyComponents | ~20% | 75% |
| Procurement | ~35% | 75% |
| Admin | ~60% | 85% |
| Logs | ~40% | 80% |
| Utils/Lib | ~25% | 90% |

To generate a coverage report:  
```sh
cd frontend && npx vitest run --coverage
```

---

## 9 · Known Pitfalls & Gotchas

1. **`.jsx` extension required** for any test file that renders JSX (including hook test wrappers). `.test.js` files with JSX fail silently in Vite.
2. **`placeholderData` in React Query** makes `isLoading = false` immediately — wait for actual data, not loading state.
3. **React 18 stale closures in form tests** — use `userEvent.setup()` instead of raw `fireEvent` when you need state to be flushed before a form submission. `await userEvent.click()` ensures renders complete.
4. **`isAdmin` optional-chaining** — `user?.permissions?.includes(...)` returns `undefined` (not `false`) when user is null. Always wrap in `!!()`.
5. **`getByText` on duplicated text** — forms with headers and meta grids often show the same value twice. Use `getAllByText(...)[0]` or a more specific role query.
6. **`vi.clearAllMocks()` vs `vi.resetAllMocks()`** — `clearAllMocks` preserves `mockReturnValue`; `resetAllMocks` removes it. Use `clearAllMocks` in `afterEach` unless you want a clean slate.
7. **E2E tests run sequentially** (`workers: 1`) against a shared real MongoDB. Seed required data in `beforeAll` and clean up in `afterAll` to avoid test pollution.
