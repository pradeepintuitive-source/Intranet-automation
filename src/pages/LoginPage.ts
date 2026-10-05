import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  readonly emailInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly emailRequiredError: Locator;
  readonly invalidCredentialsError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.phoneNumberInput = page.locator('#email'); // Assuming phone number goes into the same field for now as there is no phone field
    this.passwordInput = page.locator('#password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.emailRequiredError = page.getByText(/Email is Required/i).first();
    this.invalidCredentialsError = page.getByText(/The email address you entered isn't connected to an account/i).first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email?: string, password?: string) {
    if (email === undefined && !process.env.HR_USERNAME) {
      throw new Error('HR_USERNAME env var is missing and no email argument was provided.');
    }
    if (password === undefined && !process.env.HR_PASSWORD) {
      throw new Error('HR_PASSWORD env var is missing and no password argument was provided.');
    }

    const resolvedEmail    = email    ?? process.env.HR_USERNAME    ?? '';
    const resolvedPassword = password ?? process.env.HR_PASSWORD    ?? '';
    await this.emailInput.fill(resolvedEmail);
    await this.passwordInput.fill(resolvedPassword);
    await this.signInButton.click();
  }

  async loginWithPhone(phone?: string, password?: string) {
    if (!phone || !password) {
      throw new Error('Phone and password must be provided to login.');
    }
    await this.phoneNumberInput.fill(phone);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
