import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { HomePage } from '../../src/pages/HomePage';
import { JoinerPage } from '../../src/pages/JoinerPage';
import { AddJoinerModal } from '../../src/pages/AddJoinerModal';
import { IncentivePage } from '../../src/pages/IncentivePage';
import { EmployeePage } from '../../src/pages/EmployeePage';
import { EmployeeProfilePage } from '../../src/pages/EmployeeProfilePage';
import { PageHelper } from '../../src/utils/PageHelper';
import { clients } from '../../test-data/source/clientsData';
import { joinerData } from '../../test-data/source/joinerData';
import { employees } from '../../test-data/source/employeesData';
import { todayFormatted } from '../../src/utils/FormHelper';

test.use({ storageState: 'playwright/.auth/hr.json' });

test.describe('Incentive Module Tests', { tag: ['@regression'] }, () => {

    test('should generate Recruitment incentives when a Joiner is added', async ({ page, context, browser }) => {
        // This test spans 5 steps across 3 browser contexts (HR, Recruiter, Manager).
        // Estimated: joiner creation ~20s + incentive check ~15s + HRMS x2 ~25s + employee logins x2 ~25s ≈ 85s.
        // Override to 120s to match the global default (the global value already covers it; this
        // makes the intent explicit and allows CI to identify regressions if steps start drifting).
        test.setTimeout(120_000);
        // ── Arrange ────────────────────────────────────────────────────────────────
        const mgsLocation = joinerData.mgsChennaiLocation;
        const joiner = {
            name: `${faker.person.firstName().replace(/[^a-zA-Z]/g, '')} ${faker.person.lastName().replace(/[^a-zA-Z]/g, '')}`,
            title: faker.helpers.arrayElement(joinerData.titles),
            client: clients.mizuhoGlobalServices.name,
            location: mgsLocation.city,
            margin: joinerData.margins.junior,
            submissionDate: todayFormatted(),
            ctc: faker.number.int({ min: joinerData.ctc.min, max: joinerData.ctc.max }).toString(),
            recruiter: employees.shalini.dropdownLabel, // using centralized employee data
            dateOfJoining: todayFormatted(),
            status: joinerData.statuses[2],
            comments: faker.lorem.sentence(),
        };

        // We'll use the centralized employees objects for our assertions
        const recruiter = employees.shalini;
        const manager = employees.yokeshwaran;
        // ── Step 1: Log in and go to Accounts Module ──────────────────────────────
        const homePage = new HomePage(page);
        await homePage.goto();
        const accountPage = await homePage.openAccountsModule(context);

        // ── Step 2: Add a Joiner ───────────────────────────────────────────────────
        const joinerPage = new JoinerPage(accountPage);
        await joinerPage.navigateTo();
        await joinerPage.clickAddJoiner();

        const modal = new AddJoinerModal(accountPage);
        await modal.fillJoinerName(joiner.name);
        await modal.selectTitle(joiner.title);
        await modal.selectClient(joiner.client);
        await modal.selectLocation(joiner.location);
        await modal.selectMargin(joiner.margin);
        await modal.fillSubmissionDate(joiner.submissionDate);
        await modal.fillCTC(joiner.ctc);
        await modal.selectRecruiter(joiner.recruiter);
        await modal.fillDateOfJoining(joiner.dateOfJoining);
        await modal.selectStatus(joiner.status);
        await modal.fillComments(joiner.comments);

        await modal.clickSubmit();

        // Wait for success toast to ensure backend processing completes
        const toastMessage = await PageHelper.waitForToast(accountPage, 'success');
        expect(toastMessage).toContain(joinerData.successMessage);

        // ── Step 3: Verify Recruitment Incentive ───────────────────────────────────
        const incentivePage = new IncentivePage(accountPage);
        await incentivePage.navigateTo();

        // Verify an incentive row exists for the newly created joiner
        const candidateRows = incentivePage.getRowsByCandidate(joiner.name);

        // Wait for at least one row to appear for the candidate
        await expect(candidateRows.first()).toBeVisible({ timeout: 15000 });

        // Calculate expected incentive amount: CTC * 0.0833 * 0.05
        const ctc = parseInt(joiner.ctc, 10);
        const expectedAmountRaw = ctc * 0.0833 * 0.05;

        // Verify Recruiter's Incentive (Shalini Chauhan)
        const recruiterRow = incentivePage.getRowByCandidateAndEmployee(joiner.name, recruiter.fullName);
        await expect(recruiterRow).toBeVisible();
        await expect(recruiterRow.locator('td[title="Recruitment"]')).toBeVisible();
        await expect(recruiterRow.locator('td').filter({ hasText: 'Pay' })).toBeVisible();
        const recruiterActualAmount = await incentivePage.getAmountFromRow(recruiterRow);
        expect(Math.abs(recruiterActualAmount - expectedAmountRaw), `Recruiter Amount mismatch`).toBeLessThanOrEqual(1.0);

        // Verify Account Manager's Incentive (Yokeshwaran G)
        const accountManagerRow = incentivePage.getRowByCandidateAndEmployee(joiner.name, manager.fullName);
        await expect(accountManagerRow).toBeVisible();
        await expect(accountManagerRow.locator('td[title="Recruitment"]')).toBeVisible();
        await expect(accountManagerRow.locator('td').filter({ hasText: 'Pay' })).toBeVisible();
        const managerActualAmount = await incentivePage.getAmountFromRow(accountManagerRow);
        expect(Math.abs(managerActualAmount - expectedAmountRaw), `Manager Amount mismatch`).toBeLessThanOrEqual(1.0);

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
            const profilePage = new EmployeeProfilePage(hrmsPage);

            // 4a. Check Recruiter (Shalini)
            const recruiterProfilePageContext = await directoryPage.searchAndOpenEmployee(recruiter.firstName, context);
            const profilePage1 = new EmployeeProfilePage(recruiterProfilePageContext);
            await profilePage1.navigateToIncentives();
            const p1ActualAmount = await profilePage1.getIncentiveAmount(joiner.name);
            expect(Math.abs(p1ActualAmount - expectedAmountRaw), `Profile 1 Amount mismatch`).toBeLessThanOrEqual(1.0);
            await recruiterProfilePageContext.close();

            // Clear search before searching again
            await directoryPage.searchInput.clear();

            // 4b. Check Account Manager (Yokeshwaran)
            const managerProfilePageContext = await directoryPage.searchAndOpenEmployee(manager.firstName, context);
            const profilePage2 = new EmployeeProfilePage(managerProfilePageContext);
            await profilePage2.navigateToIncentives();
            const p2ActualAmount = await profilePage2.getIncentiveAmount(joiner.name);
            expect(Math.abs(p2ActualAmount - expectedAmountRaw), `Profile 2 Amount mismatch`).toBeLessThanOrEqual(1.0);
            await managerProfilePageContext.close();

            await hrmsPage.close();
        } catch (e) {
            console.log("HRMS validation failed or could not navigate:", e);
            throw e;
        }

        // ── Step 5: Log in as Individual Employees and Verify Own Incentives ────────

        // 5a. Verify Recruiter (Shalini)
        const recruiterContext = await browser.newContext({ storageState: 'playwright/.auth/recruiter.json' });
        const recruiterPage = await recruiterContext.newPage();
        const recruiterHomePage = new HomePage(recruiterPage);
        await recruiterHomePage.goto();

        await recruiterHomePage.openProfileDropdown();
        const [recruiterProfileTab] = await Promise.all([
            recruiterContext.waitForEvent('page'),
            recruiterHomePage.profileMenuItem.click()
        ]);
        await recruiterProfileTab.waitForLoadState();

        const ownProfilePage1 = new EmployeeProfilePage(recruiterProfileTab);
        await ownProfilePage1.navigateToIncentives();
        const ownP1ActualAmount = await ownProfilePage1.getIncentiveAmount(joiner.name);
        expect(Math.abs(ownP1ActualAmount - expectedAmountRaw), `Own Profile 1 Amount mismatch`).toBeLessThanOrEqual(1.0);
        await recruiterContext.close();

        // 5b. Verify Account Manager (Yokeshwaran)
        const managerContext = await browser.newContext({ storageState: 'playwright/.auth/manager.json' });
        const managerPage = await managerContext.newPage();
        const managerHomePage = new HomePage(managerPage);
        await managerHomePage.goto();

        await managerHomePage.openProfileDropdown();
        const [managerProfileTab] = await Promise.all([
            managerContext.waitForEvent('page'),
            managerHomePage.profileMenuItem.click()
        ]);
        await managerProfileTab.waitForLoadState();

        const ownProfilePage2 = new EmployeeProfilePage(managerProfileTab);
        await ownProfilePage2.navigateToIncentives();
        const ownP2ActualAmount = await ownProfilePage2.getIncentiveAmount(joiner.name);
        expect(Math.abs(ownP2ActualAmount - expectedAmountRaw), `Own Profile 2 Amount mismatch`).toBeLessThanOrEqual(1.0);
        await managerContext.close();
    });

    test.describe('test', () => {
        
        
    })
});
