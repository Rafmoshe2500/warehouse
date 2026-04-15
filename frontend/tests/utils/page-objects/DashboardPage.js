/**
 * Page Object Model for the Dashboard page.
 */
export class DashboardPageObject {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ─── Navigation ───────────────────────────────────────
  async goto() {
    await this.page.goto('/dashboard');
    await this.waitForLoad();
  }

  async waitForLoad() {
    // Wait for either the dashboard page, loading state, or error state
    await this.page.locator(
      '[data-testid="dashboard-page"], [data-testid="dashboard-loading"], [data-testid="dashboard-error"]'
    ).first().waitFor({ state: 'visible', timeout: 15000 });

    // If loading is visible, wait for it to disappear and the dashboard to appear
    const loading = this.page.locator('[data-testid="dashboard-loading"]');
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  // ─── Page States ──────────────────────────────────────
  get dashboardPage() {
    return this.page.locator('[data-testid="dashboard-page"]');
  }

  get loadingState() {
    return this.page.locator('[data-testid="dashboard-loading"]');
  }

  get errorState() {
    return this.page.locator('[data-testid="dashboard-error"]');
  }

  // ─── Date Filter ──────────────────────────────────────
  get dateFilter() {
    return this.page.locator('[data-testid="dashboard-date-filter"]');
  }

  get dateStart() {
    return this.page.locator('[data-testid="date-start"]');
  }

  get dateEnd() {
    return this.page.locator('[data-testid="date-end"]');
  }

  get dateReset() {
    return this.page.locator('[data-testid="date-reset"]');
  }

  async setDateRange(start, end) {
    if (start) await this.dateStart.fill(start);
    if (end) await this.dateEnd.fill(end);
  }

  async clearDateRange() {
    await this.dateReset.click();
  }

  // ─── Inventory Stats ─────────────────────────────────
  get inventoryStats() {
    return this.page.locator('[data-testid="inventory-stats"]');
  }

  get statTotalItems() {
    return this.page.locator('[data-testid="stat-total-items"]');
  }

  get statActiveAllocations() {
    return this.page.locator('[data-testid="stat-active-allocations"]');
  }

  get statSerial() {
    return this.page.locator('[data-testid="stat-serial"]');
  }

  get statNonSerial() {
    return this.page.locator('[data-testid="stat-non-serial"]');
  }

  // ─── Procurement Stats ────────────────────────────────
  get procurementStats() {
    return this.page.locator('[data-testid="procurement-stats"]');
  }

  get statTotalSpend() {
    return this.page.locator('[data-testid="stat-total-spend"]');
  }

  get statWaitingEmf() {
    return this.page.locator('[data-testid="stat-waiting-emf"]');
  }

  get statWaitingBom() {
    return this.page.locator('[data-testid="stat-waiting-bom"]');
  }

  get statOrdered() {
    return this.page.locator('[data-testid="stat-ordered"]');
  }

  // ─── Charts ───────────────────────────────────────────
  get chartLocations() {
    return this.page.locator('[data-testid="chart-locations"]');
  }

  get chartItemSearch() {
    return this.page.locator('[data-testid="chart-item-search"]');
  }

  get chartProjects() {
    return this.page.locator('[data-testid="chart-projects"]');
  }

  get chartTargetSites() {
    return this.page.locator('[data-testid="chart-target-sites"]');
  }

  get chartManufacturers() {
    return this.page.locator('[data-testid="chart-manufacturers"]');
  }

  get smartAlerts() {
    return this.page.locator('.smart-alerts-panel');
  }

  // ─── Item Search Chart Results ────────────────────────────────────────
  /**
   * The summary pill showing total inventory quantity for searched catalog.
   * Only visible after a successful search.
   */
  get itemSearchTotalPill() {
    return this.page.locator('.item-stats-pill--total');
  }

  /** Pill showing total allocated quantity. */
  get itemSearchAllocatedPill() {
    return this.page.locator('.item-stats-pill--allocated');
  }

  /** Pill showing unallocated count (only rendered when unallocated > 0). */
  get itemSearchUnallocatedPill() {
    return this.page.locator('.item-stats-pill--unallocated');
  }

  /** List of per-project allocation rows. */
  get itemProjectRows() {
    return this.page.locator('.item-project-row');
  }

  // ─── Helpers ──────────────────────────────────────────
  async getStatNumber(locator) {
    const text = await locator.locator('.stat-number').textContent();
    return text.replace(/[^0-9]/g, '');
  }

  async isInventorySectionVisible() {
    return this.inventoryStats.isVisible().catch(() => false);
  }

  async isProcurementSectionVisible() {
    return this.procurementStats.isVisible().catch(() => false);
  }
}
