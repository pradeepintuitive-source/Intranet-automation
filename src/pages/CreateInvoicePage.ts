import { Page, Locator } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

export class CreateInvoicePage {
  readonly page: Page;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: 'Create', exact: false });
  }

  // ─── Client / Location / Project ─────────────────────────────────────────

  async selectClient(clientName: string): Promise<void> {
    await this.page.waitForTimeout(2000);
    await PageHelper.selectValueFromDropDown(this.page, this.page.locator('#client'), clientName);
    await this.page.waitForTimeout(2000);
  }

  /** Clears the client dropdown by clicking the clear (×) icon. */
  async clearClient(): Promise<void> {
    const clearBtn = this.page.locator('#client').locator('[aria-label="Clear selection"]');
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();
    }
  }

  async selectLocation(locationName: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.page.locator('#location'), locationName);
  }

  async selectProject(projectName: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.page.locator('#project'), projectName);
  }

  // ─── Invoice Details ──────────────────────────────────────────────────────

  async selectInvoiceType(invoiceType: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.page.locator('#employmentType'), invoiceType);
  }

  async selectPaymentTerms(terms: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.page.locator('#contract'), terms);
  }

  // ─── Joiners Modal ────────────────────────────────────────────────────────

  async clickAddJoiners(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add', exact: true }).click();
    await PageHelper.waitForModal(this.page, 'Select Joiners');
  }

  /**
   * Selects a single joiner by name in the "Select Joiners" modal and confirms.
   * Uses the "Add (n)" button in create mode, or "Apply (n)" in edit mode.
   */
  async selectJoinerFromModal(joinerName: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]', { hasText: 'Select Joiners' });
    const row = modal.locator('tr').filter({ hasText: joinerName });
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('checkbox').check();
    // Matches both "Add (1)" (create) and "Apply (1)" (edit)
    await modal.getByRole('button', { name: /^(Add|Apply) \(\d+\)$/ }).click();
  }

  /**
   * Returns the text of the Joiners control (e.g. "Add", "1 Selected", "2 Selected").
   * Use to assert how many joiners have been added to the invoice.
   */
  async getJoinersControlText(): Promise<string> {
    // The joiners section has a label "Joiners*" followed by a button or text
    const joinersSection = this.page.locator('label', { hasText: 'Joiners' }).locator('xpath=..');
    return (await joinersSection.textContent() ?? '').trim();
  }

  // ─── Line Items ───────────────────────────────────────────────────────────

  /**
   * Clears the description field on line item at the given index (0-based).
   * Needed for TC-080 (description required validation).
   */
  async clearLineItemDescription(rowIndex = 0): Promise<void> {
    const descInput = this.page.locator('input[placeholder*="Recruitment"], input[placeholder*="Description"]')
      .nth(rowIndex);
    if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descInput.clear();
    }
  }

  // ─── Status / Edit-mode fields ────────────────────────────────────────────

  /**
   * Selects a value from the top-right "Status" dropdown on the Edit Invoice page.
   * This is the invoice status control (Invoiced / Received / etc.),
   * NOT the Type dropdown.
   */
  async selectInvoiceStatus(status: string): Promise<void> {
    // The status dropdown lives in the page header area (not inside the form body)
    const statusDropdown = this.page.locator('[id="status"], #invoiceStatus')
      .or(this.page.locator('label', { hasText: 'Status' }).locator('xpath=..').locator('[role="combobox"]').first());
    await PageHelper.selectValueFromDropDown(this.page, statusDropdown, status);
  }

  /**
   * Fills the "Received Date" field (enabled when status = Received).
   * @param date - Format: DD-MM-YYYY
   */
  async fillReceivedDate(date: string): Promise<void> {
    const receivedDateInput = this.page.getByPlaceholder('DD/MM/YYYY').or(
      this.page.getByLabel('Received Date'),
    ).first();
    await receivedDateInput.fill(date);
  }

  // ─── Payment Details (Edit Invoice) ──────────────────────────────────────

  /**
   * Fills the Transaction ID field in the Payment Details panel.
   * Only visible when Status = Received.
   */
  async fillTransactionId(transactionId: string): Promise<void> {
    await this.page.getByPlaceholder('Enter transaction ID').fill(transactionId);
  }

  /** Fills the Notes textarea in the Payment Details panel. */
  async fillNotes(notes: string): Promise<void> {
    await this.page.getByPlaceholder('Add notes for this update').fill(notes);
  }

  // ─── Summary Panel ────────────────────────────────────────────────────────

  /**
   * Returns the text of a summary row identified by its label.
   * e.g. getSummaryValue('Grand Total'), getSummaryValue('Invoice Total')
   */
  async getSummaryValue(label: string): Promise<string> {
    const row = this.page.locator('*').filter({ hasText: label }).last().locator('xpath=..');
    return (await row.textContent() ?? '').replace(label, '').trim();
  }

  // ─── Form Actions ─────────────────────────────────────────────────────────

  async selectBankAccount(bankName: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.page.locator('#bankAccount'), bankName);
  }

  /** Clicks "Create Invoice" (primary action on the Create Invoice page). */
  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  /** Clicks "Update Invoice" (primary action on the Edit Invoice page). */
  async clickUpdateInvoice(): Promise<void> {
    await this.page.getByRole('button', { name: /Update Invoice/i }).click();
  }

  /** Clicks the "Cancel" button at the bottom of the form. */
  async clickCancel(): Promise<void> {
    await this.page.getByRole('button', { name: 'Cancel', exact: true }).click();
  }

  /** Clicks the ← back arrow beside the "Create Invoice" / "Edit Invoice" heading. */
  async clickBackArrow(): Promise<void> {
    // The back arrow is a link or button beside the page heading
    await this.page.locator('a[href*="/accounts/receivables"], button').filter({ hasText: '' })
      .or(this.page.getByRole('link', { name: /back/i }))
      .first().click();
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  /**
   * Returns the visible inline validation message text for a given field label.
   * e.g. getValidationMessage('Joiners') → 'This field is required'
   */
  async getValidationMessage(fieldLabel: string): Promise<string> {
    const fieldContainer = this.page.locator('label', { hasText: fieldLabel }).locator('xpath=..');
    const errorEl = fieldContainer.locator('p.text-red, span.text-red, div.text-red, [role="alert"]').first();
    return (await errorEl.textContent().catch(() => '')) ?? '';
  }

  /**
   * Checks that the page URL has NOT changed (i.e., form submission was blocked).
   * Use in validation tests to confirm the form didn't navigate away.
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}

