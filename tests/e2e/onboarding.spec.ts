import { test, expect } from '@playwright/test';
import { ReferralPage } from '../../src/pages/ReferralPage';
import { HRReferralPage } from '../../src/pages/HRReferralPage';
import { JourneyPage } from '../../src/pages/JourneyPage';
import { PreOnboardingPage } from '../../src/pages/PreOnboardingPage';
import { faker } from '@faker-js/faker';
import { EmailHelper } from '../../src/utils/EmailHelper';
import { FormHelper } from '../../src/utils/FormHelper';
import { ToastMessages } from '../../test-data/toast/toastMessages';
import { Toast } from '../../src/components/Toast';

test.describe('End-to-End Employee Onboarding Workflow @e2e @regression', () => {
  // We use a single test to run the full journey across multiple users, 
  // ensuring proper isolation and allowing the suite to run in parallel without `.serial`.
  test('E2E: Referral to Employee Activation', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes for E2E flow to accommodate 2-minute email wait

    // Create candidate data locally within the test to avoid global state leakage
    const candidate = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: '', 
      phone: faker.string.numeric({ length: 9, allowLeadingZeros: false }).padStart(10, '9'),
    };
    
    const cleanFirstName = candidate.firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLastName = candidate.lastName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    candidate.email = `${cleanFirstName}${cleanLastName}@ahrf69uu.mailosaur.net`;
    console.log(`Starting E2E workflow with candidate email: ${candidate.email}`);

    // =========================================================================
    // Phase 1: Employee Referral Submission (Employee Role)
    // =========================================================================
    const employeeContext = await browser.newContext({ storageState: 'playwright/.auth/employee.json' });
    const employeePage = await employeeContext.newPage();
    const referralPage = new ReferralPage(employeePage);
    const employeeToast = new Toast(employeePage);

    await employeePage.goto('/home');
    await referralPage.navigateToReferralForm();
    await referralPage.submitReferral(candidate);
    await employeeToast.expectSuccessToast(ToastMessages.REFERRAL_CREATED);
    await employeeContext.close(); // Clean up context

    // =========================================================================
    // Phase 1b: HR Reviews and accepts candidate (HR Role)
    // =========================================================================
    const hrContext = await browser.newContext({ storageState: 'playwright/.auth/hr.json' });
    const hrPage = await hrContext.newPage();
    const hrReferralPage = new HRReferralPage(hrPage);
    const hrToast = new Toast(hrPage);

    await hrReferralPage.navigateTo();
    await hrReferralPage.acceptCandidate(candidate.email);
    await hrToast.expectSuccessToast(ToastMessages.generated_1277_views);
    console.log(`HR approved referral for ${candidate.email}`);

    // =========================================================================
    // Phase 2: Prospect Profile Setup in Journey (HR Role)
    // =========================================================================
    const journeyPage = new JourneyPage(hrPage);
    await journeyPage.navigateTo();
    await journeyPage.openEditModal(candidate.email);
    await journeyPage.fillAndSubmitEditModal({
      department: 'Recruitment',
      designation: 'Senior HR Recruiter',
      employmentType: 'Full-Time',
    });
    
    await hrToast.expectSuccessToast(ToastMessages.CANDIDATE_UPDATED, 60000);
    await journeyPage.waitForEmailSentStatus(candidate.email);
    console.log('Prospect profile updated and pre-onboarding email sent.');

    // Note: HR context is kept open because we'll need it again for Phase 4

    // =========================================================================
    // Phase 3: Pre-Onboarding Form Submission (Unauthenticated Candidate Role)
    // =========================================================================
    const candidateContext = await browser.newContext();
    const candidatePage = await candidateContext.newPage();

    console.log(`Waiting for pre-onboarding email to: ${candidate.email}`);
    const emailHtml = await EmailHelper.waitForEmail(candidate.email, 120000);
    const preOnboardingUrl = EmailHelper.extractLinkFromEmail(emailHtml, 'pre-onboarding-form');
    
    await candidatePage.goto(preOnboardingUrl);
    await expect(candidatePage).toHaveURL(/.*pre-onboard.*/, { timeout: 15000 });

    const preOnboardingPage = new PreOnboardingPage(candidatePage);
    await preOnboardingPage.fillStep1PersonalDetails({
      dob: '01-01-1990',
      emergencyPhone: '9876543210',
      address: '123 Test Street',
      state: 'Karnataka',
      city: 'Bengaluru',
      postalCode: '560001',
      aadhaar: '123412341234',
      pan: 'ABCDE1234F',
      photoPath: 'tests/fixtures/profile.png'
    });

    await preOnboardingPage.fillStep2EducationDetails({
      fieldOfStudy: 'Computer Science',
      institution: 'Test University',
      email: 'admin@testuniversity.com',
      phone: '1234567890',
      fromDate: '01-08-2015',
      toDate: '31-05-2019',
      certPath: 'tests/fixtures/Naukri_AshmitSaini[0y_3m].pdf'
    });

    await preOnboardingPage.fillStep3EmploymentDetails();
    await preOnboardingPage.fillStep4Acknowledgement();
    await preOnboardingPage.expectSubmissionSuccess();
    
    console.log('Pre-onboarding form submitted successfully by candidate.');
    await candidateContext.close(); // Clean up context

    // =========================================================================
    // Phase 4 & 5: Offer Letter Generation & Verification (HR Role)
    // =========================================================================
    // Using the same HR page we left open earlier
    await hrPage.goto('/hrms/journey');
    
    const row = hrPage.locator('tr').filter({ hasText: candidate.email });
    
    // Clicking the email opens the Candidate Details page in a NEW TAB
    const [detailsPage] = await Promise.all([
      hrContext.waitForEvent('page'),
      row.getByText(candidate.email).click()
    ]);
    await detailsPage.waitForLoadState();
    
    // Wait for the side navigation to appear to confirm we navigated
    await expect(detailsPage.getByText('Offer Letter', { exact: true })).toBeVisible({ timeout: 15000 });
    
    // 1. Click on Offer letter option
    await detailsPage.getByText('Offer Letter', { exact: true }).click();
    
    // 2. enter data
    // Fill Tentative Start Date with today's date
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    
    const startDateInput = detailsPage.getByPlaceholder('DD-MM-YYYY').first();
    await startDateInput.click();
    await startDateInput.fill(formattedDate);
    await startDateInput.press('Tab');
    
    // Select Reporting Manager
    await FormHelper.selectComboboxOption(detailsPage, detailsPage.getByText('Select Reporting Manager'), 'Jai Gupta');
    
    // Select PF Option
    await FormHelper.selectComboboxOption(detailsPage, detailsPage.getByText('Select PF Option'), 'No Contribution');
    
    // Fill CTC
    await detailsPage.locator('input[name="ctc"]').fill('800000');
    
    // 3. click on Preview 
    await detailsPage.getByRole('button', { name: 'Preview', exact: true }).click();
    
    // 4. then click on send 
    await detailsPage.getByRole('button', { name: 'Send', exact: true }).click();
    
    // Close the details tab after sending the offer letter
    await detailsPage.close();
    
    // Skip Instasign steps for now (5, 6, 7, 8)
    
    // 9. click on the same line item
    await hrPage.bringToFront();
    // Refresh Journey page to ensure latest status is visible (if needed)
    await hrPage.reload();
    const row2 = hrPage.locator('tr').filter({ hasText: candidate.email });
    
    // Opens a new tab AGAIN
    const [onboardingDetailsPage] = await Promise.all([
      hrContext.waitForEvent('page'),
      row2.getByText(candidate.email).click()
    ]);
    await onboardingDetailsPage.waitForLoadState();
    
    // Wait for the side navigation to appear
    await expect(onboardingDetailsPage.getByText('Onboarding', { exact: true })).toBeVisible({ timeout: 15000 });
    
    // 10. click on On boarding option
    await onboardingDetailsPage.getByText('Onboarding', { exact: true }).click();
    
    // 11. select the document from drop down and send the onbording document link to email
    await onboardingDetailsPage.locator('[aria-controls="company-doc-form11-dropdown"]').click();
    await onboardingDetailsPage.getByRole('option').first().click();
    await expect(onboardingDetailsPage.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
    await onboardingDetailsPage.getByRole('button', { name: 'Send', exact: true }).click();
    
    // 12. get the link from email and download and upload the same file in onboarding page
    console.log('Waiting for onboarding document email...');
    const onboardingEmail = await EmailHelper.waitForEmail(candidate.email, 120000);
    const docLink = EmailHelper.extractLinkFromEmail(onboardingEmail);
    
    // Use a temporary page to trigger the download
    const tempPage = await browser.newPage();
    const [download] = await Promise.all([
      tempPage.waitForEvent('download'),
      tempPage.goto(docLink)
    ]);
    const docPath = await download.path();
    await tempPage.close();
    
    // Upload the downloaded file to the form11 input on the HR page
    await onboardingDetailsPage.locator('input[name="form11"]').setInputFiles(docPath);
    await onboardingDetailsPage.getByRole('button', { name: 'Save', exact: true }).click();
    await onboardingDetailsPage.close();
    
    console.log('HR finalized candidate verification and processed onboarding docs.');
    await hrContext.close();

    // =========================================================================
    // Phase 6: Set Password & First-Time Login (Candidate Role)
    // =========================================================================
    const finalContext = await browser.newContext();
    const finalPage = await finalContext.newPage();
    console.log('Waiting for set password email...');
    const setPassEmail = await EmailHelper.waitForEmail(candidate.email);
    const setPasswordUrl = EmailHelper.extractLinkFromEmail(setPassEmail);
    await finalPage.goto(setPasswordUrl);
    await finalPage.getByPlaceholder(/New Password/i).fill('NewAdmin@123');
    await finalPage.getByRole('button', { name: /Submit/i }).click();
    await expect(finalPage).toHaveURL(/.*\/home/);
    await finalContext.close();
    console.log('Employee set password and logged in successfully.');
  });
});
