import { Page, Locator } from '@playwright/test';

/**
 * Shared page-level utilities for handling overlays, toasts, and modals.
 * Reusable across all pages in the application.
 */
export class PageHelper {

  // ═══════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ═══════════════════════════════════════

  /** Locator for success toast */
  static getSuccessToast(page: Page): Locator {
    return page.locator('.Toastify__toast--success');
  }

  /** Locator for error toast */
  static getErrorToast(page: Page): Locator {
    return page.locator('.Toastify__toast--error');
  }

  /** Locator for any toast (success, error, warning, info) */
  static getAnyToast(page: Page): Locator {
    return page.locator('.Toastify__toast');
  }

  /**
   * Waits for a toast of the given type to appear and returns its text content.
   * Use in tests to assert the exact message:
   *
   * ```ts
   * const message = await PageHelper.waitForToast(page, 'success');
   * expect(message).toContain('Referral accepted');
   * ```
   *
   * @param page - Playwright Page instance
   * @param type - Toast type: 'success' | 'error' | 'warning' | 'info' | 'any'
   * @param timeout - Max time to wait for the toast (default 30s to account for API loaders)
   * @returns The visible text content of the toast
   */
  static async waitForToast(
    page: Page,
    type: 'success' | 'error' | 'warning' | 'info' | 'any' = 'any',
    timeout = 30000,
  ): Promise<string> {
    const selector = type === 'any'
      ? '.Toastify__toast'
      : `.Toastify__toast--${type}`;

    // Wait for any active loaders to disappear before expecting the toast
    await this.waitForLoaderToDisappear(page, timeout);

    const toast = page.locator(selector).first();
    await toast.waitFor({ state: 'visible', timeout });

    const text = (await toast.textContent())?.trim() || '';

    // Close the toast by clicking its close button to prevent it from obstructing elements or opening panels
    const closeBtn = toast.locator('.Toastify__close-button');
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.evaluate((b) => (b as HTMLElement).click()).catch(() => { });
    }

    console.log(`Toast [${type}]: "${text}"`);
    return text;
  }


  // ═══════════════════════════════════════
  // MODAL HANDLING
  // ═══════════════════════════════════════

  /**
   * Waits for a modal to appear by matching its heading text.
   * @returns The heading locator for further interaction
   */
  static async waitForModal(page: Page, headingText: string, timeout = 10000): Promise<Locator> {
    const heading = page.locator('h1, h2, h3').filter({ hasText: headingText });
    await heading.waitFor({ state: 'visible', timeout });
    return heading;
  }

  /**
   * Waits for a modal to close by matching its heading text.
   */
  static async waitForModalClose(page: Page, headingText: string, timeout = 10000) {
    const heading = page.locator('h1, h2, h3').filter({ hasText: headingText });
    await heading.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Clicks a button inside a modal and waits for it to close.
   * Common pattern: click "Confirm", "Submit", "Update" etc.
   */
  static async confirmModal(page: Page, headingText: string, buttonName: string, timeout = 10000) {
    await this.waitForModal(page, headingText, timeout);
    await page.getByRole('button', { name: buttonName }).click();
    await this.waitForModalClose(page, headingText, timeout);
  }

  // ═══════════════════════════════════════
  // NOTIFICATIONS PANEL
  // ═══════════════════════════════════════

  /**
   * Dismisses the Notifications panel if it is currently open.
   *
   * The panel is a fixed right-side drawer that auto-opens on page load for HR
   * users and overlays the main content, blocking all interactions.
   *
   * The close button has NO accessible name (it is an icon-only SVG ✕), so we
   * header row.
   */
  static async dismissNotificationsPanel(page: Page) {
    const panel = page.locator('div.fixed.top-0.right-0, dialog').filter({ hasText: 'Notifications' }).first();
    if (await panel.isVisible({ timeout: 1000 }).catch(() => false)) {
      const closeBtn = panel.locator('div, header').filter({ hasText: /^Notifications/ }).first().getByRole('button');
      await closeBtn.click();
      await panel.waitFor({ state: 'hidden' });
    }
  }

  // ═══════════════════════════════════════
  // GLOBAL LOADERS
  // ═══════════════════════════════════════

  /**
   * Waits for any active global loader/spinner to disappear.
   * Useful when submitting forms or navigating where an API call is made.
   */
  static async waitForLoaderToDisappear(page: Page, timeout = 30000) {
    // Matches specific spinner classes. Avoid [role="progressbar"] as it matches static poll results!
    const loader = page.locator('svg.animate-spin, .loader, .spinner').first();
    try {
      // If a loader is instantly visible, wait for it to disappear
      if (await loader.isVisible({ timeout: 500 })) {
        await loader.waitFor({ state: 'hidden', timeout });
      }
    } catch {
      // Loader not found or already hidden - safe to continue
    }
  }

  /**
   * Waits for the specific table loader overlay to appear and disappear.
   * Useful when searching or filtering data in tables.
   */
  static async waitForTableLoaderToDisappear(page: Page, timeout = 15000) {
    const tableLoader = page.locator('div.absolute.inset-0:has(svg.animate-spin)').first();
    try {
      if (await tableLoader.isVisible({ timeout: 1000 })) {
        await tableLoader.waitFor({ state: 'hidden', timeout });
      }
    } catch {
      // Loader not found or already hidden
    }
  }

  // ═══════════════════════════════════════
  // NAVIGATION HELPERS
  // ═══════════════════════════════════════

  /**
   * Navigates to a URL and waits for the table to load + dismisses notifications.
   * Common pattern for all HR admin pages.
   */
  static async navigateToTablePage(page: Page, url: string) {
    await page.goto(url);
    await this.waitForTableLoaderToDisappear(page);
    await page.waitForSelector('table', { timeout: 15000, state: 'visible' });
  }

  static async selectValueFromDropDown(page: Page, dropdownLocator: Locator, optionText: string) {
    // 1. Click the dropdown chevron to open the options list
    const chevron = dropdownLocator.locator('.lucide-chevron-down').first();
    if (await chevron.count() > 0) {
      await chevron.click({ force: true });
    } else {
      await dropdownLocator.click({ force: true });
    }

    // 2. Locate the active dropdown menu option.
    // It is often rendered in a portal at the end of the body.
    // Wait for at least one option to be visible instead of a fixed sleep.
    const option = page.getByText(optionText, { exact: false }).last();
    await option.waitFor({ state: 'visible', timeout: 15000 });

    // 3. Click the option
    await option.click();
  }

  /**
   * Generic method for searchable and creatable dropdowns (e.g., custom React-Selects).
   * These often use a div as the combobox and an inner input for searching/creating.
   */
  static async selectValueFromCreatableDropDown(page: Page, comboboxLocator: Locator, optionText: string) {
    const input = comboboxLocator.locator('input').first();

    // Click to focus and open the listbox
    await comboboxLocator.click();

    // Type the text sequentially to ensure React's synthetic events fire correctly
    await input.pressSequentially(optionText, { delay: 50 });

    // Wait for the listbox to actually appear in the DOM before querying options.
    const listbox = page.locator('[role="listbox"]');
    await listbox.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });

    // Find the option containing our text and click it
    // We use .last() to target the innermost text element (like a span) instead of the wrapper div
    const option = listbox.locator('*').filter({ hasText: optionText }).last();

    try {
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
    } catch {
      // Fallback: if clicking fails or option isn't found, try pressing Enter
      await input.press('Enter');
    }
    // No fixed delay needed here — Playwright's auto-waiting on the next action
    // will handle the time for the dropdown to close.
  }
}
