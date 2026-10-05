import { Page, Locator } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

export class EmployeeProfilePage {
  readonly page: Page;
  readonly compensationBtn: Locator;
  
  constructor(page: Page) {
    this.page = page;
    // According to HTML dump, the button has the text "Compensation"
    this.compensationBtn = page.getByRole('button', { name: 'Compensation' });
  }

  async navigateToIncentives(): Promise<void> {
    await this.compensationBtn.click();
    await PageHelper.waitForLoaderToDisappear(this.page);
    
    // There should be a tab or link for "Incentives" under Compensation
    const incentivesTab = this.page.getByRole('button', { name: 'Incentives', exact: true });
    await incentivesTab.click();
    await PageHelper.waitForLoaderToDisappear(this.page);
  }

  /**
   * Retrieves the incentive amount for a given joiner from the profile page.
   * Playwright Best Practice: POM methods should return state, not make assertions.
   */
  async getIncentiveAmount(joinerName: string): Promise<number> {
    const tableBody = this.page.locator('table tbody');
    await tableBody.waitFor({ state: 'visible', timeout: 15000 });
    
    // Wait for the specific row to appear
    const row = tableBody.locator('tr').filter({ hasText: joinerName }).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });

    const rowText = await row.textContent();
    const amountMatch = rowText?.match(/₹\s*([\d,]+\.\d{2})/);
    
    if (!amountMatch) {
      throw new Error(`Could not find formatted amount in row text: ${rowText}`);
    }
    
    return parseFloat(amountMatch[1].replace(/,/g, ''));
  }
}
