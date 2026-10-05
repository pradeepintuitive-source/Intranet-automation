import { Page, Locator, expect } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';
import { FormHelper } from '../utils/FormHelper';

export class ReferralPage {
  // ═══════════════════════════════════════
  // LOCATORS
  // ═══════════════════════════════════════
  readonly page: Page;
  readonly addReferralBtn: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly jobTitleCombobox: Locator;
  readonly resumeUpload: Locator;
  readonly submitBtn: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addReferralBtn = page.getByRole('button', { name: /Add Referral|Submit Referral/i });
    this.firstNameInput = page.getByPlaceholder('First name');
    this.lastNameInput = page.getByPlaceholder('Last name');
    this.emailInput = page.locator('input#email');
    this.phoneInput = page.locator('input#phone');
    this.jobTitleCombobox = page.locator('[role="combobox"]');
    this.resumeUpload = page.locator('input#resume[type="file"]');
    this.submitBtn = page.locator('button[type="submit"]', { hasText: 'Submit' });
    this.successToast = PageHelper.getSuccessToast(page);
  }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════

  async navigateToReferralForm() {
    await this.addReferralBtn.click();
    await PageHelper.waitForModal(this.page, 'Referrals');
  }

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════

  /**
   * Fills the referral form and submits it.
   * Assertions should be done in the test.
   */
  async submitReferral(candidate: { firstName: string; lastName: string; email: string; phone: string }) {
    await this.firstNameInput.fill(candidate.firstName);
    await this.lastNameInput.fill(candidate.lastName);
    await this.emailInput.fill(candidate.email);
    await this.phoneInput.fill(candidate.phone);

    // Handle the custom Job Title dropdown
    await FormHelper.selectComboboxOption(this.page, this.jobTitleCombobox, 'Software Engineer');

    // Upload resume using the real valid PDF
    const path = require('path');
    const filePath = path.resolve(process.cwd(), 'tests/fixtures/Naukri_AshmitSaini[0y_3m].pdf');
    await FormHelper.uploadFile(this.resumeUpload, filePath);

    await this.submitBtn.click();
  }
}
