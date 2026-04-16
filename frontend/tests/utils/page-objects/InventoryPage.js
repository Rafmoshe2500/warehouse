/**
 * Page Object Model for the Inventory page (main "מלאי נוכחי" tab).
 */
export class InventoryPageObject {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ─── Navigation ───────────────────────────────────────
  async goto() {
    await this.page.goto('/inventory');
    await this.waitForTable();
  }

  async gotoTab(tab) {
    await this.page.goto(`/inventory?tab=${tab}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ─── Waits ────────────────────────────────────────────
  async waitForTable() {
    await this.page.locator('.item-table, table').first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async waitForToast() {
    return this.page.locator('.toast').first().waitFor({ state: 'visible', timeout: 5000 });
  }

  // ─── Search & Filter ─────────────────────────────────
  get searchInput() {
    return this.page.locator('.global-search-input');
  }

  async search(query) {
    await this.searchInput.fill(query);
    // debounce is 500ms — wait a bit longer for the API call
    await this.page.waitForTimeout(700);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(700);
  }

  get filterToggleButton() {
    return this.page.locator('button:has-text("פילטרים"), button:has-text("הסתרה")');
  }

  async toggleFilters() {
    await this.filterToggleButton.click();
  }

  filterInput(columnKey) {
    return this.page.locator(`.filter-cell input[name="${columnKey}_filter"], .filter-row input`).first();
  }

  // ─── Table ────────────────────────────────────────────
  get tableRows() {
    return this.page.locator('tbody tr:not(.new-item-row):not(.filter-row):has(input[type="checkbox"])');
  }

  get visibleRowCount() {
    return this.tableRows.count();
  }

  row(index) {
    return this.tableRows.nth(index);
  }

  rowByText(text) {
    return this.page.locator('tbody tr', { hasText: text });
  }

  cellInRow(rowLocator, colIndex) {
    return rowLocator.locator('td').nth(colIndex);
  }

  get headerCheckbox() {
    return this.page.locator('thead input[type="checkbox"]').first();
  }

  rowCheckbox(rowLocator) {
    return rowLocator.locator('input[type="checkbox"]');
  }

  sortableHeader(text) {
    return this.page.locator('th').filter({ hasText: text });
  }

  // ─── Header Actions ───────────────────────────────────
  get addButton() {
    return this.page.getByTestId('add-item-button');
  }

  get importButton() {
    return this.page.getByTestId('import-button');
  }

  get exportButton() {
    return this.page.getByTestId('export-button');
  }

  get bulkEditButton() {
    return this.page.getByTestId('bulk-edit-button');
  }

  get deleteButton() {
    return this.page.getByTestId('delete-button');
  }

  // ─── Inline Add ───────────────────────────────────────
  async startAdd() {
    await this.addButton.click();
  }

  newItemInput(field) {
    return this.page.getByTestId(`new-item-${field}`);
  }

  get saveNewItemButton() {
    return this.page.getByTestId('save-new-item-button');
  }

  async addItem({ catalog_number, description, manufacturer, location, current_stock }) {
    await this.startAdd();
    await this.newItemInput('catalog_number').fill(catalog_number);
    if (description) await this.newItemInput('description').fill(description);
    if (manufacturer) await this.newItemInput('manufacturer').fill(manufacturer);
    if (location) await this.newItemInput('location').fill(location);
    if (current_stock != null) await this.newItemInput('current_stock').fill(String(current_stock));
    await this.saveNewItemButton.click();
  }

  // ─── Delete Modal ─────────────────────────────────────
  get deleteModal() {
    return this.page.locator('.delete-modal');
  }

  get deleteReasonInput() {
    return this.page.locator('.delete-modal__textarea, .delete-modal textarea, .delete-modal input[type="text"]').first();
  }

  get deleteConfirmButton() {
    return this.page.locator('.delete-modal__footer .button--danger').first();
  }

  async confirmDelete(reason = 'בדיקה אוטומטית - ניקוי') {
    await this.deleteReasonInput.fill(reason);
    await this.deleteConfirmButton.click();
  }

  // ─── Bulk Edit Modal ──────────────────────────────────
  get bulkEditModal() {
    return this.page.locator('.bulk-edit-modal');
  }

  // ─── Export Modal ─────────────────────────────────────
  get exportModal() {
    return this.page.locator('.export-options-modal');
  }

  // ─── Toast ────────────────────────────────────────────
  get toast() {
    return this.page.locator('.toast').first();
  }

  get successToast() {
    return this.page.locator('.toast--success').first();
  }

  get errorToast() {
    return this.page.locator('.toast--error').first();
  }

  // ─── Column Visibility ────────────────────────────────
  get columnToggleButton() {
    return this.page.locator('button:has-text("עמודות")');
  }

  // ─── Pagination ───────────────────────────────────────
  get pagination() {
    return this.page.locator('.pagination');
  }

  get paginationInfo() {
    return this.page.locator('.pagination__info');
  }

  get nextPageButton() {
    return this.page.locator('.pagination button[aria-label="Next"], .pagination button:has(svg)').nth(2);
  }

  get prevPageButton() {
    return this.page.locator('.pagination button[aria-label="Previous"], .pagination button:has(svg)').nth(1);
  }

  // ─── Tabs (via Sidebar sub-items) ───────────────────
  tab(label) {
    // First try sidebar child items, then fallback to inline tab buttons
    return this.page.locator(`[data-testid^="sidebar-child-"]:has-text("${label}"), button:has-text("${label}"), [role="tab"]:has-text("${label}")`).first();
  }

  sidebarTab(tabId) {
    return this.page.locator(`[data-testid="sidebar-child-${tabId}"]`);
  }

  get activeTabContent() {
    return this.page.locator('.inventory-tab-content');
  }

  // ─── Empty State ──────────────────────────────────────
  get emptyState() {
    return this.page.locator('text=לא נמצאו פריטים');
  }
}
