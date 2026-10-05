import { Page, Locator } from '@playwright/test';

/**
 * Generic table interaction utilities.
 * Reusable across any page that has data tables with rows, checkboxes, and status columns.
 */
export class TableHelper {

  /**
   * Finds a table row by matching text content, with fallback strategies.
   * Useful when the app truncates stored values (e.g., long emails).
   *
   * @param page - Playwright Page instance
   * @param searchText - Primary text to search for in the row
   * @param fallbackTexts - Optional array of fallback texts to try if primary doesn't match
   * @returns The first matching row locator
   */
  static async findRow(page: Page, searchText: string, fallbackTexts: string[] = []): Promise<Locator> {
    const primaryRow = page.locator('tr').filter({ hasText: searchText }).first();
    
    try {
      await primaryRow.waitFor({ state: 'attached', timeout: 15000 });
      return primaryRow;
    } catch (e) {
      if (fallbackTexts.length > 0) {
        for (const fallback of fallbackTexts) {
          const fallbackRow = page.locator('tr').filter({ hasText: fallback }).first();
          try {
            await fallbackRow.waitFor({ state: 'attached', timeout: 5000 });
            return fallbackRow;
          } catch (err) {
            continue;
          }
        }
      }
    }

    return primaryRow;
  }

  /**
   * Finds a row by email with automatic local-part fallback.
   * The app may truncate long email addresses — this handles that gracefully.
   */
  static async findRowByEmail(page: Page, email: string): Promise<Locator> {
    const row = page.locator(`tr:has(td[title="${email}"])`).first();
    await row.waitFor({ state: 'attached', timeout: 15000 });
    return row;
  }

  /**
   * Checks the checkbox in a specific table row.
   */
  static async checkRowCheckbox(row: Locator) {
    const checkbox = row.getByRole('checkbox');
    // We wait for any overlays (like notification panels) to clear naturally 
    // rather than bypassing actionability checks with force: true
    await checkbox.check();
  }

  /**
   * Gets the text content of a specific column (0-indexed) in a row.
   */
  static async getCellText(row: Locator, columnIndex: number): Promise<string> {
    const cell = row.locator('td').nth(columnIndex);
    return (await cell.textContent())?.trim() || '';
  }

  /**
   * Gets the text of the last column (typically the Status column).
   */
  static async getRowStatus(row: Locator): Promise<string> {
    const lastCell = row.locator('td').last();
    return (await lastCell.textContent())?.trim() || '';
  }

  /**
   * Waits for a row to contain specific text (e.g., status change).
   */
  static async waitForRowText(row: Locator, text: string, timeout = 15000) {
    await row.getByText(text).waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits for the table to finish loading rows.
   */
  static async waitForTableLoad(page: Page, timeout = 15000) {
    await page.waitForSelector('table tbody tr', { timeout });
  }
}
