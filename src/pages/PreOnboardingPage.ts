import { Page, expect } from '@playwright/test';
import { FormHelper } from '../utils/FormHelper';
import * as path from 'path';

export class PreOnboardingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillStep1PersonalDetails(params: {
    dob: string,
    emergencyPhone: string,
    address: string,
    state: string,
    city: string,
    postalCode: string,
    aadhaar: string,
    pan: string,
    photoPath: string
  }) {
    // Fill text inputs
    await this.page.locator('#dateOfBirth').fill(params.dob);
    await this.page.locator('#emergencyContactParent').fill(params.emergencyPhone);
    await this.page.locator('#presentAddressLine1').fill(params.address);
    await this.page.locator('#presentPostalCode').fill(params.postalCode);
    await this.page.locator('#aadharNumber').fill(params.aadhaar);
    await this.page.locator('#panNumber').fill(params.pan);

    // Gender - click the label
    await this.page.locator('label').filter({ hasText: /^Male$/ }).click();

    // Comboboxes using FormHelper
    await FormHelper.selectByAriaControls(this.page, 'presentState-dropdown', params.state);
    // Give city dropdown a moment to load based on state
    await this.page.waitForTimeout(1000);
    await FormHelper.selectByAriaControls(this.page, 'presentCity-dropdown', params.city);

    // Upload photo
    await this.page.locator('#profilePicture').setInputFiles(path.resolve(params.photoPath));

    // Click Next
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async fillStep2EducationDetails(params: {
    fieldOfStudy: string,
    institution: string,
    email: string,
    phone: string,
    fromDate: string,
    toDate: string,
    certPath: string
  }) {
    // Education Level is prefilled to Bachelor's Degree
    // Find dynamic inputs inside the form
    await this.page.locator('input[name$="_degreeName"]').fill(params.fieldOfStudy);
    await this.page.locator('textarea[name$="_institution"]').fill(params.institution);
    await this.page.locator('input[name$="_email"]').fill(params.email);
    // Phone number input doesn't have a reliable name, but it's type="tel"
    await this.page.locator('input[type="tel"]').fill(params.phone);
    await this.page.locator('input[name$="_fromDate"]').fill(params.fromDate);
    await this.page.locator('input[name$="_toDate"]').fill(params.toDate);

    // Upload certificate
    await this.page.locator('input[name$="_degree"]').setInputFiles(path.resolve(params.certPath));

    // Click Next
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async fillStep3EmploymentDetails() {
    // Most defaults are fine: Citizen, No past experience
    // Just click Next
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async fillStep4Acknowledgement() {
    // Radio buttons default to No, which is good.
    // Need to check the 4 mandatory checkboxes.
    await this.page.locator('input#aadhaarPanConsent').check({ force: true });
    await this.page.locator('input#ageConfirmation').check({ force: true });
    await this.page.locator('input#conflictDisclosure').check({ force: true });
    await this.page.locator('input#finalConsent').check({ force: true });
    await this.page.locator('#habits').fill('Reading and coding');

    // Click Submit
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async expectSubmissionSuccess() {
    await expect(this.page.getByText('Submission Successful!')).toBeVisible({ timeout: 15000 });
  }
}
