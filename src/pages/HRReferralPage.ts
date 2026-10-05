import { Page, Locator, expect } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';
import { TableHelper } from '../utils/TableHelper';

export class HRReferralPage {
  // ═══════════════════════════════════════
  // LOCATORS
  // ═══════════════════════════════════════
  readonly page: Page;
  readonly searchInput: Locator;
  readonly acceptedButton: Locator;
  readonly rejectedButton: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search...');
    this.acceptedButton = page.getByRole('button', { name: 'Accepted', exact: true });
    this.rejectedButton = page.getByRole('button', { name: 'Rejected', exact: true });
    this.successToast = PageHelper.getSuccessToast(page);
  }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════

  async navigateTo() {
    await PageHelper.navigateToTablePage(this.page, '/hrms/hr/referral');
  }

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════

  /**
   * Selects a candidate row and clicks Accept → handles the "Mark as Accepted" modal.
   * Returns after the modal closes. Assertions should be done in the test.
   */
  async acceptCandidate(email: string, client = 'Intuitive Apps') {
    // Robust approach: Use the search bar to filter the table down to our candidate
    await this.searchInput.fill(email);
    // Give the app a moment to filter the table (wait for loader)
    await PageHelper.waitForTableLoaderToDisappear(this.page);

    const candidateRow = await TableHelper.findRowByEmail(this.page, email);
    
    // Ensure we check the checkbox properly (using Playwright's robust .check() method)
    const checkbox = candidateRow.getByRole('checkbox');
    await checkbox.check({ force: true }); // force in case the native input is visually hidden

    // Wait for the Accepted button to become enabled (it enables when a row is checked)
    await expect(this.acceptedButton).toBeEnabled({ timeout: 10000 });
    await this.acceptedButton.click();

    // Handle the "Mark as Accepted" confirmation modal
    await PageHelper.waitForModal(this.page, 'Mark as Accepted');
    
    // Select the client from the combobox if not already selected
    // Note: It might default to 'Intuitive Apps', so we check first to avoid hanging.
    const clientCombobox = this.page.getByRole('combobox').first();
    const currentSelection = await clientCombobox.textContent();
    
    if (!currentSelection?.includes(client)) {
      await clientCombobox.click();
      await this.page.getByRole('option', { name: client }).click();
    }

    // Click Confirm and wait for modal to close
    // Filter by visible to ensure we don't accidentally match hidden Confirm buttons from other modals
    const confirmBtn = this.page.getByRole('button', { name: 'Confirm', exact: true }).filter({ state: 'visible' });
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click();
    await PageHelper.waitForModalClose(this.page, 'Mark as Accepted');
  }
}
