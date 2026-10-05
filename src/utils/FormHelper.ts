import { Page, Locator } from '@playwright/test';

/**
 * Generic form interaction utilities.
 * Reusable across any page that has custom form components (comboboxes, file uploads, etc.).
 */
export class FormHelper {

  /**
   * Selects an option from a custom combobox/dropdown (react-select style).
   * Handles both role="option" based lists and plain text-based lists.
   *
   * @param page - Playwright Page instance
   * @param combobox - The combobox trigger locator (e.g., role="combobox" or aria-controls)
   * @param optionText - The visible text of the option to select
   */
  static async selectComboboxOption(page: Page, combobox: Locator, optionText: string) {
    await combobox.click();

    // Strategy 1: role="option" (standard accessible dropdown)
    const option = page.getByRole('option', { name: optionText, exact: true }).first();
    const optionExists = await option.isVisible({ timeout: 2000 }).catch(() => false);

    if (optionExists) {
      await option.click();
      return;
    }

    // Strategy 2: Text-based match (custom dropdowns without role="option")
    await page.getByText(optionText, { exact: true }).last().click();
  }

  /**
   * Selects an option from a combobox identified by its aria-controls ID.
   * Common pattern in this app where dropdowns have aria-controls="some-dropdown".
   */
  static async selectByAriaControls(page: Page, ariaControlsId: string, optionText: string) {
    const combobox = page.locator(`[aria-controls="${ariaControlsId}"]`);
    await this.selectComboboxOption(page, combobox, optionText);
  }

  /**
   * Uploads a file to a file input element.
   * Validates the file exists before attempting to prevent hanging.
   */
  static async uploadFile(fileInput: Locator, filePath: string) {
    const fs = require('fs');
    const path = require('path');
    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    await fileInput.setInputFiles(resolvedPath);
  }

  /**
   * Fills a text input after clearing it.
   */
  static async fillInput(input: Locator, value: string) {
    await input.clear();
    await input.fill(value);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Returns today's date formatted as DD-MM-YYYY (used for Submission Date). */
export function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
/** Returns a date N days from today formatted as DD-MM-YYYY (used for Date of Joining). */
export function futureDateFormatted(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
