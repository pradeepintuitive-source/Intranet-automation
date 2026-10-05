import { Page, Locator } from "@playwright/test";
import { PageHelper } from '../utils/PageHelper';

export class AddJoinerModal {
  // ═══════════════════════════════════════
  // LOCATORS
  // ═══════════════════════════════════════
  readonly page: Page;
  readonly candidateNameInput: Locator;
  readonly titleDropdown: Locator;
  readonly clientDropdown: Locator;
  readonly locationDropdown: Locator;
  readonly marginDropdown: Locator;
  readonly submissionDateInput: Locator;
  readonly ctcInput: Locator;
  readonly recruiterDropdown: Locator;
  readonly dateOfJoiningInput: Locator;
  readonly statusDropdown: Locator;
  readonly commentsTextarea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.candidateNameInput = page.locator('#candidateName');
    this.titleDropdown = page.locator('[aria-controls="title-dropdown"]');
    this.clientDropdown = page.locator('[aria-controls="client-dropdown"]');
    this.locationDropdown = page.locator('[aria-controls="location-dropdown"]');
    this.marginDropdown = page.locator('label', { hasText: 'Margin' }).locator('xpath=..').locator('[role="combobox"]');
    this.submissionDateInput = page.getByPlaceholder('DD-MM-YYYY').first();
    this.ctcInput = page.getByRole('textbox', { name: 'CTC' });
    this.recruiterDropdown = page.locator('label', { hasText: 'Recruiter' }).locator('xpath=..').locator('[role="combobox"]');
    this.dateOfJoiningInput = page.getByPlaceholder('DD-MM-YYYY').last();
    this.statusDropdown = page.locator('label', { hasText: 'Status' }).locator('xpath=..').locator('[role="combobox"]');
    this.commentsTextarea = page.getByRole('textbox', { name: 'Comments' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════

  async fillJoinerName(name: string): Promise<void> {
    await this.candidateNameInput.fill(name);
  }

  async fillCTC(amount: string): Promise<void> {
    await this.ctcInput.fill(amount);
  }

  async fillComments(comments: string): Promise<void> {
    await this.commentsTextarea.fill(comments);
  }

  async selectTitle(titleName: string): Promise<void> {
    await PageHelper.selectValueFromCreatableDropDown(this.page, this.titleDropdown, titleName);
  }

  async selectClient(clientName: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.clientDropdown, clientName);
  }

  async selectLocation(locationLabel: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.locationDropdown, locationLabel);
  }

  async selectMargin(marginLabel: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.marginDropdown, marginLabel);
  }

  /** @param date - Format: DD-MM-YYYY */
  async fillSubmissionDate(date: string): Promise<void> {
    await this.submissionDateInput.fill(date);
  }

  /** @param date - Format: DD-MM-YYYY */
  async fillDateOfJoining(date: string): Promise<void> {
    await this.dateOfJoiningInput.fill(date);
  }

  async selectRecruiter(recruiterName: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.recruiterDropdown, recruiterName);
  }

  async selectStatus(status: string): Promise<void> {
    await PageHelper.selectValueFromDropDown(this.page, this.statusDropdown, status);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }
}