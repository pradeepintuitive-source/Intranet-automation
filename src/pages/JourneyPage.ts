import { Page, Locator, expect } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';
import { TableHelper } from '../utils/TableHelper';
import { FormHelper } from '../utils/FormHelper';

export class JourneyPage {
  // ═══════════════════════════════════════
  // LOCATORS
  // ═══════════════════════════════════════
  readonly page: Page;
  readonly editButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly addButton: Locator;
  readonly resendButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly searchInput: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editButton = page.getByRole('button', { name: 'Edit' });
    this.approveButton = page.getByRole('button', { name: 'Approve' });
    this.rejectButton = page.getByRole('button', { name: 'Reject' });
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.resendButton = page.getByRole('button', { name: 'Resend' });
    this.updateButton = page.getByRole('button', { name: 'Update' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.searchInput = page.getByPlaceholder('Search...');
    this.successToast = PageHelper.getSuccessToast(page);
  }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════

  async navigateTo() {
    await PageHelper.navigateToTablePage(this.page, '/hrms/journey');
  }

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════

  /**
   * Selects the candidate row and clicks the Edit button to open the Edit Journey modal.
   */
  async openEditModal(email: string) {
    const row = await TableHelper.findRowByEmail(this.page, email);
    await TableHelper.checkRowCheckbox(row);

    await expect(this.editButton).toBeEnabled({ timeout: 5000 });
    await this.editButton.click();

    await PageHelper.waitForModal(this.page, 'Edit Journey');
  }

  /**
   * Fills Department, Designation, Employment Type in the Edit Journey modal and clicks Update.
   * Returns after the Update button is clicked. Assertions should be done in the test.
   */
  async fillAndSubmitEditModal({
    department,
    designation,
    employmentType,
  }: {
    department: string;
    designation: string;
    employmentType: string;
  }) {
    await FormHelper.selectByAriaControls(this.page, 'department-dropdown', department);
    await FormHelper.selectByAriaControls(this.page, 'designation-dropdown', designation);
    await FormHelper.selectByAriaControls(this.page, 'employee_type-dropdown', employmentType);

    // Wait for the backend API requests (e.g. fetching related data based on dropdown selection)
    // We wait for all network traffic to idle instead of an arbitrary timeout.
    await this.page.waitForLoadState('networkidle');

    // The update button is often disabled while background loaders (like fetching margin data) run.
    // Wait for it to become enabled.
    await expect(this.updateButton).toBeEnabled({ timeout: 45000 });
    // Let Playwright ensure the button is truly actionable (not covered by an overlay)
    await this.updateButton.click();
  }

  /**
   * Returns the status text for a candidate row.
   */
  async getCandidateStatus(email: string): Promise<string> {
    const row = await TableHelper.findRowByEmail(this.page, email);
    return TableHelper.getRowStatus(row);
  }

  /**
   * Waits for the candidate's Journey status to change to 'Email Sent'.
   */
  async waitForEmailSentStatus(email: string, timeout = 15000) {
    const row = await TableHelper.findRowByEmail(this.page, email);
    await TableHelper.waitForRowText(row, 'Email Sent', timeout);
  }
}
