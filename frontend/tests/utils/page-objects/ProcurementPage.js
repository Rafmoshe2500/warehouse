/**
 * Page Object Model for the Procurement page.
 */
export class ProcurementPageObject {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ─── Navigation ───────────────────────────────────────
  async goto() {
    await this.page.goto('/procurement');
    await this.waitForOrders();
  }

  async gotoTab(tabKey) {
    // tabKey: 'process' | 'completed' | 'bom-netapp' | 'analytics'
    const tabLabels = {
      process: 'בתהליך',
      completed: 'הסתיים',
      'bom-netapp': 'סריקת BOM',
      analytics: 'השוואת מחירים',
    };
    const label = tabLabels[tabKey] || tabKey;
    await this.page.locator('button.tab-btn', { hasText: label }).click();
    await this.page.waitForTimeout(500);
  }

  // ─── Waits ────────────────────────────────────────────
  async waitForOrders() {
    // Wait for either order cards or empty state
    await this.page.locator('.orders-card-list, .orders-empty, .skeleton-cards').first().waitFor({
      state: 'visible',
      timeout: 15000,
    });
    // If skeleton is showing, wait for it to disappear
    const skeleton = this.page.locator('.skeleton-cards');
    if (await skeleton.isVisible().catch(() => false)) {
      await skeleton.waitFor({ state: 'hidden', timeout: 15000 });
    }
  }

  async waitForToast() {
    return this.page.locator('.toast, [class*="toast"]').first().waitFor({ state: 'visible', timeout: 5000 });
  }

  // ─── Search ───────────────────────────────────────────
  get searchInput() {
    return this.page.locator('input[placeholder*="חפש"], .search-input, input[type="search"]').first();
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  // ─── Order Cards ──────────────────────────────────────
  get orderCards() {
    return this.page.locator('.order-card');
  }

  get orderCount() {
    return this.orderCards.count();
  }

  orderByIndex(index) {
    return this.orderCards.nth(index);
  }

  orderByText(text) {
    return this.page.locator('.order-card', { hasText: text });
  }

  // ─── Empty State ──────────────────────────────────────
  get emptyState() {
    return this.page.locator('.orders-empty');
  }

  // ─── Header Actions ───────────────────────────────────
  get newOrderButton() {
    return this.page.locator('button', { hasText: 'הזמנה חדשה' });
  }

  // ─── Order Card Actions ───────────────────────────────
  editButton(orderCard) {
    return orderCard.locator('.oc-icon-btn.edit, button[title="ערוך"]');
  }

  deleteButton(orderCard) {
    return orderCard.locator('.oc-icon-btn.delete, button[title="מחק"]');
  }

  filesButton(orderCard) {
    return orderCard.locator('.oc-icon-btn[title="קבצים"], button[title="קבצים"]');
  }

  historyButton(orderCard) {
    return orderCard.locator('.oc-icon-btn.history, button[title="היסטוריה"]');
  }

  shipButton(orderCard) {
    return orderCard.locator('.oc-icon-btn.truck, button[title*="נשלח"]');
  }

  receiveButton(orderCard) {
    return orderCard.locator('.oc-icon-btn.received, button[title*="התקבל"]');
  }

  bomPreviewButton(orderCard) {
    return orderCard.locator('.oc-icon-btn.bom-icon, button[title*="BOM"]');
  }

  // ─── Status ───────────────────────────────────────────
  getOrderStatus(orderCard) {
    return orderCard.locator('.status-pill').textContent();
  }

  // ─── Pipeline Bar ─────────────────────────────────────
  pipelineSteps(orderCard) {
    return orderCard.locator('.pipeline .step');
  }

  // ─── Order Type Modal ─────────────────────────────────
  get orderTypeModal() {
    return this.page.locator('.order-type-modal, .otm-overlay');
  }

  orderTypeOption(type) {
    // type: 'bom' | 'manual'
    const labels = { bom: 'BOM', manual: 'ידני' };
    return this.orderTypeModal.locator('button, .otm-card', { hasText: labels[type] || type });
  }

  // ─── BOM Prescan Modal ────────────────────────────────
  get bomPrescanModal() {
    return this.page.locator('.bps-overlay, .bps-modal');
  }

  prescanVendorButton(vendor) {
    return this.bomPrescanModal.locator(`.bps-vendor-card, button`, { hasText: vendor });
  }

  get prescanDropzone() {
    return this.bomPrescanModal.locator('.bps-dropzone');
  }

  // ─── Edit/Create Modal ────────────────────────────────
  get editModal() {
    return this.page.locator('.pm-drawer');
  }

  editModalField(placeholder) {
    return this.editModal.locator(`input[placeholder*="${placeholder}"]`);
  }

  get editModalSaveButton() {
    return this.editModal.locator('button', { hasText: /שמור|צור/ });
  }

  get editModalCloseButton() {
    return this.editModal.locator('button.pm-drawer-close, button:has-text("ביטול")').first();
  }

  // ─── Files Modal ──────────────────────────────────────
  get filesModal() {
    return this.page.locator('.files-modal, .modal-content.files-modal');
  }

  get filesInModal() {
    return this.filesModal.locator('.file-item');
  }

  // ─── Delete Modal ─────────────────────────────────────
  get deleteModal() {
    return this.page.locator('.modal-overlay:has(.delete-modal)');
  }

  get deleteConfirmButton() {
    return this.deleteModal.locator('.delete-modal__footer button, .modal__footer button').first();
  }

  // ─── History Modal ────────────────────────────────────
  get historyModal() {
    return this.page.locator('.history-modal, [class*="history-modal"]');
  }

  // ─── Pagination ───────────────────────────────────────
  get pagination() {
    return this.page.locator('.pagination, [class*="pagination"]');
  }

  async nextPage() {
    await this.pagination.locator('button', { hasText: /הבא|>/ }).click();
    await this.waitForOrders();
  }

  async prevPage() {
    await this.pagination.locator('button', { hasText: /הקודם|</ }).click();
    await this.waitForOrders();
  }

  // ─── Tabs ─────────────────────────────────────────────
  get activeTab() {
    return this.page.locator('button.tab-btn.active');
  }

  tabButton(label) {
    return this.page.locator('button.tab-btn', { hasText: label });
  }
}
