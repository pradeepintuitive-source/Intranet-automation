import { Page, Locator } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

export class EmployeePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[name="search"]');
    this.tableRows = page.locator('table tbody tr');
  }

  async searchAndOpenEmployee(employeeName: string, context: import('@playwright/test').BrowserContext): Promise<Page> {
    await PageHelper.waitForLoaderToDisappear(this.page);
    
    // Ensure the table and its initial data are fully loaded before searching.
    // If we type before the initial fetch completes, React might overwrite the input field.
    await this.page.waitForSelector('table tbody tr', { state: 'visible', timeout: 15000 });
    await PageHelper.waitForTableLoaderToDisappear(this.page);

    // Expand the search field if it's collapsed (hidden behind a toggle button)
    // The search input might have opacity-0 or w-0 when collapsed.
    const isSearchInputVisible = await this.searchInput.isVisible();
    const searchToggleBtn = this.page.getByRole('button', { name: 'Toggle search' });
    
    if (!isSearchInputVisible && await searchToggleBtn.isVisible({ timeout: 2000 })) {
      await searchToggleBtn.click();
      // Wait for the search input to be visible (proves animation completed) instead of a fixed delay
      await this.searchInput.waitFor({ state: 'visible', timeout: 3000 });
    }

    // Fill the search field
    await this.searchInput.fill('');
    // Use pressSequentially to ensure all key events are properly fired for the search debounce
    await this.searchInput.pressSequentially(employeeName, { delay: 50 });

    // Wait for the table loader overlay to appear and then disappear
    await PageHelper.waitForTableLoaderToDisappear(this.page);

    // Click the employee row and handle new tab
    const employeeRow = this.tableRows.filter({ hasText: employeeName }).first();
    await employeeRow.waitFor({ state: 'visible', timeout: 15000 });

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      employeeRow.click()
    ]);

    await newPage.waitForLoadState('load');
    await PageHelper.waitForLoaderToDisappear(newPage);

    return newPage;
  }
}
