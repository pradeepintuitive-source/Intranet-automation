import { Page, Locator } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

export class AddIncentiveModal {
  readonly page: Page;
  readonly modal: Locator;

  readonly clientDropdown: Locator;
  readonly employeeDropdown: Locator;
  readonly projectDropdown: Locator;
  readonly amountInput: Locator;
  readonly paymentStatusDropdown: Locator;
  readonly paidFromBankDropdown: Locator;
  readonly paymentMonthDropdown: Locator;
  readonly paymentDateInput: Locator;
  readonly commentsTextarea: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('div[role="dialog"]').filter({ hasText: 'Add New Incentive' }); // if it has a role
    // fallback if no role dialog
    if (!this.modal) {
      this.modal = page.locator('div.bg-white.rounded-xl').filter({ hasText: 'Add New Incentive' });
    }

    this.clientDropdown = page.locator('#incentive-client');
    this.employeeDropdown = page.locator('#incentive-employee');
    this.projectDropdown = page.locator('#incentive-project');

    this.amountInput = page.locator('input#incentive-amount');

    this.paymentStatusDropdown = page.locator('#incentive-payment-status');
    this.paidFromBankDropdown = page.locator('#incentive-paid-from-bank');
    this.paymentMonthDropdown = page.locator('#incentive-payment-month');

    this.paymentDateInput = page.locator('input#incentive-payment-date');
    this.commentsTextarea = page.locator('textarea#incentive-comments');

    this.submitBtn = page.locator('button[type="submit"]');
  }

  async selectClient(clientName: string) {
    await PageHelper.selectValueFromDropDown(this.page, this.clientDropdown, clientName);
  }

  async selectEmployee(employeeName: string) {
    await PageHelper.selectValueFromDropDown(this.page, this.employeeDropdown, employeeName);
  }

  async selectProject(projectName: string) {
    await PageHelper.selectValueFromDropDown(this.page, this.projectDropdown, projectName);
  }

  async fillAmount(amount: string) {
    await this.amountInput.fill(amount);
  }

  async selectPaymentStatus(status: string) {
    await PageHelper.selectValueFromDropDown(this.page, this.paymentStatusDropdown, status);
  }

  async selectPaidFromBank(bank: string) {
    await PageHelper.selectValueFromDropDown(this.page, this.paidFromBankDropdown, bank);
  }

  async selectPaymentMonth(month: string) {
    await PageHelper.selectValueFromDropDown(this.page, this.paymentMonthDropdown, month);
  }

  async fillPaymentDate(date: string) {
    await this.paymentDateInput.fill(date);
    // Click outside to close any datepicker
    await this.page.mouse.click(0, 0);
  }

  async fillComments(comments: string) {
    await this.commentsTextarea.fill(comments);
  }

  async submit() {
    await this.submitBtn.click();
    await PageHelper.waitForLoaderToDisappear(this.page);
  }

  /**
   * Helper to fill all fields for an incentive
   */
  async fillIncentiveDetails(details: {
    client: string;
    employee: string;
    lableName: string;
    project?: string;
    amount: string;
    paymentStatus: string;
    paidFromBank: string;
    paymentMonth: string;
    paymentDate: string;
    comments?: string;
  }) {

    await this.selectClient(details.client);
    await this.page.waitForTimeout(500); // Wait for potential employee/project cascading updates

    await this.selectEmployee(details.lableName);

    if (details.project) {
      await this.selectProject(details.project);
    }
    await this.fillAmount(details.amount);

    await this.selectPaymentStatus(details.paymentStatus);
    await this.selectPaidFromBank(details.paidFromBank);

    await this.fillPaymentDate(details.paymentDate);

    if (details.comments) {
      await this.fillComments(details.comments);
    }
  }
}
