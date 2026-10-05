import { Page, Locator } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

export class AccountsReceivablePage {
  readonly page: Page;
  readonly accountsMenuBtn: Locator;
  readonly receivablesSubMenuBtn: Locator;
  readonly createInvoiceButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar navigation elements
    const nav = page.locator('nav');
    this.accountsMenuBtn = nav.getByRole('button', { name: 'Accounts', exact: true });
    this.receivablesSubMenuBtn = nav.getByRole('button', { name: 'Accounts Receivable', exact: true });

    this.createInvoiceButton = page.getByRole('button', { name: 'Create Invoice' });
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/accounts/receivables');
    await PageHelper.waitForTableLoaderToDisappear(this.page);
  }

  async clickCreateInvoice(): Promise<void> {
    await this.createInvoiceButton.click();
    await this.page.waitForURL(/\/accounts\/create-invoice/);
  }
}
