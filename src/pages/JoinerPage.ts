import { Page, Locator, expect } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

export class JoinerPage {
  readonly page: Page;
  readonly accountsMenuBtn: Locator;
  readonly joinersSubMenuBtn: Locator;
  readonly addJoinerButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar navigation elements
    const nav = page.locator('nav');
    this.accountsMenuBtn = nav.getByRole('button', { name: 'Accounts', exact: true });
    this.joinersSubMenuBtn = nav.getByRole('button', { name: 'Joiners', exact: true });

    this.addJoinerButton = page.getByRole('button', { name: 'Add', exact: true });
  }

  async navigateTo(): Promise<void> {
    // Navigate directly to bypass UI flakiness with the animating sidebar/notifications panel
    await this.page.goto('/accounts/joiners');
    await PageHelper.waitForTableLoaderToDisappear(this.page);


    // We no longer wait for the 'table' selector here since the table element 
    // might be completely absent when there's no data. Playwright's auto-waiting 
    // will handle it during assertions in the test script.
  }

  /** Clicks the Add button and waits for the modal to appear. */
  async clickAddJoiner(): Promise<void> {
    await this.addJoinerButton.click();
    await PageHelper.waitForModal(this.page, 'Add Joiner');
  }
}
