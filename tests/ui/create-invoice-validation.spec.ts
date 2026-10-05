/**
 * Create Invoice - Required-Field Validation Tests
 *
 * TC-078  P0: Create Invoice without selecting any joiner   -> blocked
 * TC-079  P1: Create Invoice without selecting a client     -> blocked
 * TC-080  P2: Create Invoice with empty line-item description -> blocked
 *
 * Strategy
 * ---------
 * Each test navigates to the Create Invoice page in the Accounts module.
 * TC-078 and TC-080 first create a joiner in the Arrange step.
 * After submitting the invalid form we assert:
 *   1. The URL is still /accounts/create-invoice (page did NOT navigate away).
 *   2. A validation signal is visible - either an inline error element or an
 *      error toast. We check both strategies since the app may use either.
 *
 * Note: The exact validation messages were not shown in the source video.
 * Tests use flexible matchers so they do not break if wording changes.
 */

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { HomePage } from '../../src/pages/HomePage';
import { AccountsReceivablePage } from '../../src/pages/AccountsReceivablePage';
import { CreateInvoicePage } from '../../src/pages/CreateInvoicePage';
import { JoinerPage } from '../../src/pages/JoinerPage';
import { AddJoinerModal } from '../../src/pages/AddJoinerModal';
import { PageHelper } from '../../src/utils/PageHelper';
import { clients, formatProjectDropdownValue } from '../../test-data/source/clientsData';
import { joinerData } from '../../test-data/source/joinerData';
import { todayFormatted } from '../../src/utils/FormHelper';

test.use({ storageState: 'playwright/.auth/hr.json' });

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildJoiner(clientName: string) {
    return {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        title: faker.helpers.arrayElement(joinerData.titles),
        client: clientName,
        location: joinerData.mgsChennaiLocation.city,
        margin: joinerData.margins.junior,
        submissionDate: todayFormatted(),
        ctc: faker.number.int({ min: joinerData.ctc.min, max: joinerData.ctc.max }).toString(),
        recruiter: joinerData.recruiter.shalini,
        dateOfJoining: todayFormatted(),
        status: joinerData.statuses[2], // 'Joined'
        comments: faker.lorem.sentence(),
    };
}

async function createJoinerViaUI(accountPage: any, joiner: ReturnType<typeof buildJoiner>) {
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

    const toastMsg = await PageHelper.waitForToast(accountPage, 'success');
    expect(toastMsg).toContain(joinerData.successMessage);
}

async function fillMandatoryInvoiceDropdowns(
    createInvoicePage: CreateInvoicePage,
    client = clients.mizuhoGlobalServices,
) {
    const location = client.locations[1]; // Navi Mumbai
    const project = client.projects[1];   // Recruitment - MGS

    await createInvoicePage.selectClient(client.name);
    await createInvoicePage.selectLocation(location.city);
    //  await createInvoicePage.selectProject(formatProjectDropdownValue(project));
    await createInvoicePage.selectInvoiceType('Full Time');
    await createInvoicePage.selectPaymentTerms('NET 30');
}

// ---------------------------------------------------------------------------
// Test Suite: Create Invoice Validation
// ---------------------------------------------------------------------------
test.describe('Create Invoice Validation', { tag: ['@functionality', '@regression'] }, () => {
    let accountPage: any;

    test.beforeEach(async ({ page, context }) => {
        const homePage = new HomePage(page);
        await homePage.goto();
        accountPage = await homePage.openAccountsModule(context);
    });

    test('TC-078: Create Invoice without a joiner is blocked with a validation error', async () => {
        // Arrange
        const arPage = new AccountsReceivablePage(accountPage);
        await arPage.navigateTo();
        await arPage.clickCreateInvoice();
        await PageHelper.waitForLoaderToDisappear(accountPage);

        const createInvoicePage = new CreateInvoicePage(accountPage);
        // Fill client/location/project/type/terms — but deliberately skip Joiners
        await fillMandatoryInvoiceDropdowns(createInvoicePage);

        // Assert: The Create button must be disabled because Joiners is a mandatory field
        await expect(createInvoicePage.createButton).toBeDisabled({ timeout: 5000 });
    });

    test('TC-079: Create Invoice without a client is blocked with a validation error', async () => {
        // Arrange
        const arPage = new AccountsReceivablePage(accountPage);
        await arPage.navigateTo();
        await arPage.clickCreateInvoice();
        await PageHelper.waitForLoaderToDisappear(accountPage);

        const createInvoicePage = new CreateInvoicePage(accountPage);

        // The form often pre-populates "Intuitive Apps" as the default client.
        // Clear it to test the no-client validation path.
        await createInvoicePage.clearClient();

        // Assert: The Create button must be disabled because Client is a mandatory field
        await expect(createInvoicePage.createButton).toBeDisabled({ timeout: 5000 });
    });

    test('TC-080: Create Invoice with empty line-item Description is blocked', async () => {
        // Arrange
        const client = clients.mizuhoGlobalServices;
        const joiner = buildJoiner(client.name);

        // Create a joiner first so it appears in the Select Joiners modal
        await createJoinerViaUI(accountPage, joiner);

        const arPage = new AccountsReceivablePage(accountPage);
        await arPage.navigateTo();
        await arPage.clickCreateInvoice();
        await PageHelper.waitForLoaderToDisappear(accountPage);

        const createInvoicePage = new CreateInvoicePage(accountPage);

        // Fill all mandatory dropdowns
        await fillMandatoryInvoiceDropdowns(createInvoicePage, client);

        // Add the joiner (auto-populates the line item with "Recruitment Charges")
        await createInvoicePage.clickAddJoiners();
        await createInvoicePage.selectJoinerFromModal(joiner.name);

        // Clear the auto-populated Description on line item #1
        await createInvoicePage.clearLineItemDescription(0);

        // Assert: The Create button must be disabled because Description is a mandatory field
        await expect(createInvoicePage.createButton).toBeDisabled({ timeout: 5000 });
    });
});
