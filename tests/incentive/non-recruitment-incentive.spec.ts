import { test, expect } from '@playwright/test';
import toastMessages from '../../test-data/toast/toastMessages.json';
import { faker } from '@faker-js/faker';
import { HomePage } from '../../src/pages/HomePage';
import { IncentivePage } from '../../src/pages/IncentivePage';
import { AddIncentiveModal } from '../../src/pages/AddIncentiveModal';
import { EmployeePage } from '../../src/pages/EmployeePage';
import { EmployeeProfilePage } from '../../src/pages/EmployeeProfilePage';
import { PageHelper } from '../../src/utils/PageHelper';
import { clients } from '../../test-data/source/clientsData';
import { employees } from '../../test-data/source/employeesData';
import { todayFormatted } from '../../src/utils/FormHelper';

test.use({ storageState: 'playwright/.auth/hr.json' });

test.describe('Non-Recruitment Incentive Module Tests', { tag: ['@regression'] }, () => {

    test('should allow creating and verifying a manual non-recruitment incentive', async ({ page, context, browser }) => {
        test.setTimeout(70000); // The E2E flow is long and requires more than the 30s default timeout

        // ── Arrange ────────────────────────────────────────────────────────────────
        const employee = employees.shalini; // The employee receiving the manual incentive
        const incentiveAmount = '1500';
        const expectedAmountRaw = parseFloat(incentiveAmount);

        const incentiveDetails = {
            client: clients.intuitiveApps.name,
            employee: employee.fullName,
            lableName: employee.dropdownLabel,
            amount: incentiveAmount,
            paymentStatus: 'Paid',
            paidFromBank: 'IndusInd Bank • 0221',
            paymentMonth: 'September', // Or another valid month depending on current date
            paymentDate: todayFormatted(),
            comments: faker.lorem.sentence(),
        };

        // ── Step 1: Log in and go to Accounts Module ──────────────────────────────
        const homePage = new HomePage(page);
        await homePage.goto();
        const accountPage = await homePage.openAccountsModule(context);

        // ── Step 2: Add New Incentive ──────────────────────────────────────────────
        const incentivePage = new IncentivePage(accountPage);
        await incentivePage.navigateTo();

        await incentivePage.clickAddButton();

        const addModal = new AddIncentiveModal(accountPage);
        page.pause;
        
        await addModal.fillIncentiveDetails(incentiveDetails);
        await addModal.submit();

        // Wait for success toast and verify message
        const expectedToastMessage = toastMessages.find(t => t.messageKey === 'generated_407_incentive')?.messageTemplate || 'Incentive created.';
        const actualToastMessage = await PageHelper.waitForToast(accountPage, 'success');
        expect(actualToastMessage).toContain(expectedToastMessage);

        // ── Step 3: Verify Incentive in Table ──────────────────────────────────────
        // Find row by Employee and Client
        const incentiveRow = incentivePage.getRowByEmployee(employee.fullName, incentiveDetails.client).first();
        await expect(incentiveRow).toBeVisible();
        await expect(incentiveRow.locator('td').filter({ hasText: incentiveDetails.paymentStatus })).toBeVisible();
        const actualAmount = await incentivePage.getAmountFromRow(incentiveRow);
        expect(Math.abs(actualAmount - expectedAmountRaw), `Incentive Table Amount mismatch`).toBeLessThanOrEqual(1.0);

        // ── Step 4: Verify Incentives in HRMS Employee Directory ────────────────────

        // Go back to the main Home tab
        await page.bringToFront();

        try {
            // Open HRMS Module
            const hrmsPage = await homePage.openHrmsModule(context);

            // Navigate to Directory (fallback to direct URL if UI click fails)
            await hrmsPage.locator('aside').getByText('Directory', { exact: true }).click({ timeout: 5000 }).catch(() => hrmsPage.goto('/hrms/hr/directory'));
            await PageHelper.waitForLoaderToDisappear(hrmsPage);

            const directoryPage = new EmployeePage(hrmsPage);

            // Check the Employee Profile
            const profilePageContext = await directoryPage.searchAndOpenEmployee(employee.firstName, context);
            const profilePage = new EmployeeProfilePage(profilePageContext);
            await profilePage.navigateToIncentives();

            // Pass an empty string or the client name since there is no joiner name
            const p1ActualAmount = await profilePage.getIncentiveAmount(incentiveDetails.client);
            expect(Math.abs(p1ActualAmount - expectedAmountRaw), `HRMS Profile Amount mismatch`).toBeLessThanOrEqual(1.0);
            await profilePageContext.close();

            await hrmsPage.close();
        } catch (e) {
            console.log("HRMS validation failed or could not navigate:", e);
            throw e;
        }


    });

});
