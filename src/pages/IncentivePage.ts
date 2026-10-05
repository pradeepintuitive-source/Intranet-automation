import { Page, Locator } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

export class IncentivePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates directly to the Incentives page under the Accounts module.
   */
  async navigateTo(): Promise<void> {
    // Navigate directly to the incentives dashboard to avoid flaky sidebar accordion locators
    // (which occasionally resolve to off-screen mobile menus and fail actionability checks).
    await this.page.goto('/accounts/incentives');
    await PageHelper.waitForTableLoaderToDisappear(this.page);
  }

  /**
   * Returns all table rows that belong to a specific Candidate.
   * Uses the title attribute of the Candidate td for an exact match, preventing issues with truncated text.
   * 
   * @param candidateName The exact name of the candidate (Joiner)
   * @returns Locator for the matching row(s)
   */
  getRowsByCandidate(candidateName: string): Locator {
    return this.page.locator('table tbody tr').filter({
      has: this.page.locator(`td[title="${candidateName}"]`),
    });
  }

  /**
   * Returns a specific row for a candidate and an employee.
   * This is useful when multiple incentives are created for a single joiner 
   * (e.g., one for the recruiter, one for the manager).
   * 
   * @param candidateName The exact name of the candidate (Joiner)
   * @param employeeName The exact name of the employee receiving the incentive
   * @returns Locator for the matching row
   */
  getRowByCandidateAndEmployee(candidateName: string, employeeName: string): Locator {
    return this.getRowsByCandidate(candidateName).filter({
      has: this.page.locator(`td`).filter({ hasText: employeeName }),
    });
  }

  /**
   * Extracts the numerical amount from an incentive row for test assertions.
   * Playwright Best Practice: POM methods should return state, not make assertions.
   */
  async getAmountFromRow(rowLocator: Locator): Promise<number> {
    const rowText = await rowLocator.textContent();
    const amountMatch = rowText?.match(/₹\s*([\d,]+\.\d{2})/);
    
    if (!amountMatch) {
      throw new Error(`Could not find formatted amount in row text: ${rowText}`);
    }
    
    return parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  /**
   * Clicks the Add button to open the Add New Incentive modal
   */
  async clickAddButton() {
    await this.page.getByRole('button', { name: 'Add' }).first().click();
  }

  /**
   * Returns a specific row for a given employee (and optionally client), 
   * useful for non-recruitment incentives where there is no candidate.
   */
  getRowByEmployee(employeeName: string, clientName?: string): Locator {
    let rows = this.page.locator('table tbody tr').filter({
      has: this.page.locator('td').filter({ hasText: employeeName }),
    });
    
    if (clientName) {
      rows = rows.filter({
        has: this.page.locator('td').filter({ hasText: clientName }),
      });
    }
    
    return rows;
  }
}
