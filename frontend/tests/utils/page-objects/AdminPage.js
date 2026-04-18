/**
 * Page Object Model for the Admin / Access Control page.
 */
export class AdminPageObject {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ─── Navigation ───────────────────────────────────────
  async goto() {
    await this.page.goto('/admin');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.page.locator('[data-testid="access-control-page"]').waitFor({
      state: 'visible',
      timeout: 15000,
    });
  }

  // ─── Tabs (via Sidebar sub-items) ────────────────────
  get tabUsers() {
    return this.page.locator('[data-testid="sidebar-child-users"]');
  }

  get tabLogs() {
    return this.page.locator('[data-testid="sidebar-child-audit-logs"]');
  }

  get tabAi() {
    return this.page.locator('[data-testid="sidebar-child-ai"]');
  }

  async switchTab(tabId) {
    const tab = this.page.locator(`[data-testid="sidebar-child-${tabId}"]`);
    await tab.click();
    await this.page.waitForTimeout(500);
  }

  // ─── User Management ─────────────────────────────────
  get userManagement() {
    return this.page.locator('[data-testid="user-management"]');
  }

  get usersTab() {
    return this.page.locator('[data-testid="users-tab"]');
  }

  get groupsTab() {
    return this.page.locator('[data-testid="groups-tab"]');
  }

  get userSearch() {
    return this.page.locator('[data-testid="user-search"]');
  }

  get addUserBtn() {
    return this.page.locator('[data-testid="add-user-btn"]');
  }

  get groupSearch() {
    return this.page.locator('[data-testid="group-search"]');
  }

  get addGroupBtn() {
    return this.page.locator('[data-testid="add-group-btn"]');
  }

  userCard(username) {
    return this.page.locator(`[data-testid="user-card-${username}"]`);
  }

  groupCard(name) {
    return this.page.locator(`[data-testid="group-card-${name}"]`);
  }

  get allUserCards() {
    return this.page.locator('[data-testid^="user-card-"]');
  }

  get allGroupCards() {
    return this.page.locator('[data-testid^="group-card-"]');
  }

  async searchUsers(query) {
    await this.userSearch.fill(query);
    await this.page.waitForTimeout(300);
  }

  async searchGroups(query) {
    await this.groupSearch.fill(query);
    await this.page.waitForTimeout(300);
  }

  // ─── User Form ────────────────────────────────────────
  get userForm() {
    return this.page.locator('[data-testid="user-form"]');
  }

  get usernameField() {
    return this.page.locator('[data-testid="username-field"] input, [data-testid="username-field"]').first();
  }

  get passwordField() {
    return this.page.locator('[data-testid="password-field"] input, [data-testid="password-field"]').first();
  }

  get userTypeField() {
    return this.page.locator('[data-testid="user-type-field"] select, [data-testid="user-type-field"]').first();
  }

  get roleField() {
    return this.page.locator('[data-testid="role-field"] select, [data-testid="role-field"]').first();
  }

  get userActiveToggle() {
    return this.page.locator('[data-testid="user-active-toggle"]');
  }

  get userSubmitBtn() {
    return this.page.locator('[data-testid="user-submit-btn"]');
  }

  get userCancelBtn() {
    return this.page.locator('[data-testid="user-cancel-btn"]');
  }

  get userDeleteBtn() {
    return this.page.locator('[data-testid="user-delete-btn"]');
  }

  async fillUserForm({ username, password, userType }) {
    if (username) {
      await this.page.locator('[data-testid="username-field"]').fill(username);
    }
    if (userType) {
      await this.page.locator('[data-testid="user-type-field"]').selectOption(userType);
      await this.page.waitForTimeout(300);
    }
    if (password) {
      await this.page.locator('[data-testid="password-field"]').fill(password);
    }
  }

  // ─── Group Form ───────────────────────────────────────
  get groupForm() {
    return this.page.locator('[data-testid="group-form"]');
  }

  get groupNameField() {
    return this.page.locator('[data-testid="group-name-field"]');
  }

  get groupActiveToggle() {
    return this.page.locator('[data-testid="group-active-toggle"]');
  }

  get groupSubmitBtn() {
    return this.page.locator('[data-testid="group-submit-btn"]');
  }

  get groupCancelBtn() {
    return this.page.locator('[data-testid="group-cancel-btn"]');
  }

  get groupDeleteBtn() {
    return this.page.locator('[data-testid="group-delete-btn"]');
  }

  async fillGroupForm({ name }) {
    if (name) await this.groupNameField.fill(name);
  }

  // ─── Permission Selector ──────────────────────────────
  get permissionSelector() {
    return this.page.locator('[data-testid="permission-selector"]');
  }

  permissionChip(testId) {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async togglePermission(testId) {
    await this.permissionChip(testId).click();
  }

  // ─── Delete Modals ────────────────────────────────────
  get userDeleteModal() {
    return this.page.locator('[data-testid="user-delete-modal"]');
  }

  get groupDeleteModal() {
    return this.page.locator('[data-testid="group-delete-modal"]');
  }

  get groupConfirmDeleteBtn() {
    return this.page.locator('[data-testid="group-confirm-delete-btn"]');
  }

  get groupCancelDeleteBtn() {
    return this.page.locator('[data-testid="group-cancel-delete-btn"]');
  }

  get deleteReasonInput() {
    return this.page.locator('[data-testid="delete-reason-input"]');
  }

  get confirmDeleteBtn() {
    return this.page.locator('[data-testid="confirm-delete-btn"]');
  }

  get cancelDeleteBtn() {
    return this.page.locator('[data-testid="cancel-delete-btn"]');
  }

  async confirmUserDelete(reason) {
    if (reason) await this.deleteReasonInput.fill(reason);
    await this.confirmDeleteBtn.click();
  }

  // ─── Audit Logs ───────────────────────────────────────
  get auditLogs() {
    return this.page.locator('[data-testid="audit-logs"]');
  }

  get auditActionFilter() {
    return this.page.locator('[data-testid="audit-action-filter"]');
  }

  get auditActorFilter() {
    return this.page.locator('[data-testid="audit-actor-filter"]');
  }

  get auditTargetFilter() {
    return this.page.locator('[data-testid="audit-target-filter"]');
  }

  get auditSearchBtn() {
    return this.page.locator('[data-testid="audit-search-btn"]');
  }

  get auditTimeline() {
    return this.page.locator('[data-testid="audit-timeline"]');
  }

  async filterAuditLogs({ action, actor, targetUser } = {}) {
    if (action) {
      await this.auditActionFilter.selectOption(action);
    }
    if (actor) {
      await this.auditActorFilter.fill(actor);
    }
    if (targetUser) {
      await this.auditTargetFilter.fill(targetUser);
    }
    await this.auditSearchBtn.click();
    await this.page.waitForTimeout(500);
  }

  // ─── AI Tools ─────────────────────────────────────────
  get aiToolsPanel() {
    return this.page.locator('[data-testid="ai-tools-panel"]');
  }

  get retrainBtn() {
    return this.page.locator('[data-testid="retrain-btn"]');
  }

  get retrainConfirmBtn() {
    return this.page.locator('[data-testid="retrain-confirm-btn"]');
  }

  get retrainResult() {
    return this.page.locator('[data-testid="retrain-result"]');
  }

  // ─── Toasts ───────────────────────────────────────────
  get toast() {
    return this.page.locator('.toast, [class*="toast"]').first();
  }

  async waitForToast() {
    return this.toast.waitFor({ state: 'visible', timeout: 5000 });
  }

  // ─── Empty States ─────────────────────────────────────
  get userEmptyState() {
    return this.page.locator('.um-empty-placeholder').first();
  }
}
