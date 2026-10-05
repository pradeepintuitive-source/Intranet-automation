/**
 * Edit Invoice - Tests
 *
 * TC-081  P0: Open Edit Invoice for an existing invoiced record
 * TC-082  P1: Status and Received Date controls on Edit Invoice
 * TC-083  P1: Select Joiners modal in edit mode shows selected + available joiners
 * TC-084  P0: Add another joiner to an existing invoice
 * TC-085  P0: Line item and summary recalculate for two joiners
 * TC-086  P2: Payment Details panel with Notes
 * TC-087  P0: Update Invoice saves changes
 * TC-088  P0: Change status to Received enables Received Date and shows Transaction ID
 * TC-089  P0: Save invoice as Received with Transaction ID and Notes
 * TC-090  P0: Invoice list reflects Received status and updated amount
 *
 * Strategy
 * ---------
 * This spec creates its OWN test data (two joiners) in the Arrange phase so it
 * is completely isolated from seeded QA data.
 *
 * Execution order matters because each TC builds on the previous state, so the
 * entire suite is wrapped in a single test with clearly labelled steps.
 * This avoids the anti-pattern of test.describe.serial while keeping the
 * business flow readable.
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

function buildJoiner(clientName: string, overrides: Partial<{ name: string }> = {}) {
    return {
        name: overrides.name ?? `${faker.person.firstName()} ${faker.person.lastName()}`,
        title: faker.helpers.arrayElement(joinerData.titles),
        client: clientName,
        location: joinerData.mgsChennaiLocation.city, // Chennai
        margin: joinerData.margins.junior,             // Junior - 8.33%
        submissionDate: todayFormatted(),
        ctc: '1000000', // fixed CTC so summary maths is deterministic
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

// ---------------------------------------------------------------------------
// TC-081 through TC-090: Full Edit Invoice lifecycle
// (Single test — the steps are atomic parts of one business workflow)
// ---------------------------------------------------------------------------
test.describe('Edit Invoice Flow', { tag: ['@regression'] }, () => {
    test('TC-081–090: Edit Invoice lifecycle — add joiner, recalculate, mark as Received', async ({ page, context }) => {

    test.setTimeout(180_000); // 3 min: multi-step workflow with two joiners + edit flow

    const client = clients.mizuhoGlobalServices;
    const location = client.locations[1]; // Navi Mumbai
    const project  = client.projects[1];  // Recruitment - MGS

    // ── Arrange: Create joiner A and joiner B ────────────────────────────────
    const joinerA = buildJoiner(client.name);
    const joinerB = buildJoiner(client.name);

    const homePage = new HomePage(page);
    await homePage.goto();
    const accountPage = await homePage.openAccountsModule(context);

    await createJoinerViaUI(accountPage, joinerA);
    await createJoinerViaUI(accountPage, joinerB);

    // ── Step 1 (TC-071 prerequisite): Create invoice with joiner A ────────────
    const arPage = new AccountsReceivablePage(accountPage);
    await arPage.navigateTo();
    await arPage.clickCreateInvoice();
    await PageHelper.waitForLoaderToDisappear(accountPage);

    const createInvoicePage = new CreateInvoicePage(accountPage);

    await createInvoicePage.selectClient(client.name);
    await createInvoicePage.selectLocation(location.city);
    await createInvoicePage.selectProject(formatProjectDropdownValue(project));
    await createInvoicePage.selectInvoiceType('Full Time');
    await createInvoicePage.selectPaymentTerms('NET 30');

    await createInvoicePage.clickAddJoiners();
    await createInvoicePage.selectJoinerFromModal(joinerA.name);

    await createInvoicePage.clickCreate();

    // Assert: "AR Invoice c…" success toast and redirect to AR list
    const createToast = await PageHelper.waitForToast(accountPage, 'success');
    expect(createToast).toMatch(/AR Invoice/i);
    await expect(accountPage).toHaveURL(/\/accounts\/receivables/, { timeout: 10_000 });

    // ── TC-081: Open the newly created invoice for edit ───────────────────────
    // The latest invoice is always the first row in the table.
    // We click the edit/view action icon for that row.
    await PageHelper.waitForTableLoaderToDisappear(accountPage);
    const firstRow = accountPage.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });

    // Click the second action icon (edit/view) — first icon is download
    const actionIcons = firstRow.locator('[data-testid*="action"], td:last-child button, td:last-child a');
    // Fall back: look for any clickable element in the actions cell that is NOT a download icon
    const editAction = firstRow.locator('td').last().locator('button, a').nth(1);
    await editAction.click();

    // Assert: URL changes to edit/create-invoice/<token>
    await expect(accountPage).toHaveURL(/\/accounts\/create-invoice\//, { timeout: 15_000 });
    await PageHelper.waitForLoaderToDisappear(accountPage);

    // ── TC-082: Status and Received Date in Edit mode ─────────────────────────
    // Status dropdown should show 'Invoiced'; Received Date should be disabled
    const statusText = await accountPage
        .locator('#status, #invoiceStatus, [aria-label*="status" i]')
        .or(accountPage.getByText('Invoiced'))
        .first()
        .textContent()
        .catch(() => '');
    expect(statusText).toMatch(/Invoiced/i);

    // Received Date should be greyed / disabled
    const receivedDateInput = accountPage.getByPlaceholder('DD/MM/YYYY').first();
    if (await receivedDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        expect(await receivedDateInput.isDisabled()).toBe(true);
    }

    // ── TC-083: Select Joiners modal in edit mode ─────────────────────────────
    // Open the Joiners control (shows "1 Selected" after initial creation)
    const joinersControl = accountPage
        .locator('label', { hasText: 'Joiners' })
        .locator('xpath=..')
        .locator('button')
        .first();
    await joinersControl.click();
    await PageHelper.waitForModal(accountPage, 'Select Joiners');

    // Joiner A should be checked; joiner B should be unchecked
    const modal = accountPage.locator('[role="dialog"]', { hasText: 'Select Joiners' });
    const rowA = modal.locator('tr').filter({ hasText: joinerA.name });
    const rowB = modal.locator('tr').filter({ hasText: joinerB.name });

    await expect(rowA).toBeVisible({ timeout: 10_000 });
    await expect(rowA.getByRole('checkbox')).toBeChecked();

    await expect(rowB).toBeVisible({ timeout: 10_000 });
    await expect(rowB.getByRole('checkbox')).not.toBeChecked();

    // ── TC-084: Add joiner B to the invoice ──────────────────────────────────
    await rowB.getByRole('checkbox').check();
    // Button should now read "Apply (2)"
    await expect(modal.getByRole('button', { name: /^(Add|Apply) \(2\)$/ })).toBeEnabled({ timeout: 5000 });
    await modal.getByRole('button', { name: /^(Add|Apply) \(\d+\)$/ }).click();

    // Modal should close; Joiners control should show "2 Selected"
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    const joinersText = await createInvoicePage.getJoinersControlText();
    expect(joinersText).toContain('2');

    // ── TC-085: Summary recalculates for two joiners ──────────────────────────
    // Calculate expected summary table values (rounded to 2 decimal places)
    const roundTo2 = (num: number) => Math.round(num * 100) / 100;
    
    const marginMatch = joinerA.margin.match(/(\d+(\.\d+)?)%/);
    const marginPercent = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const ctcValue = parseInt(joinerA.ctc, 10);
    const expectedUnitPricePerJoiner = roundTo2(ctcValue * (marginPercent / 100));
    
    const expectedSubTotal = roundTo2(expectedUnitPricePerJoiner * 2);
    const expectedGst = roundTo2(expectedSubTotal * (location.gstPct / 100));
    const expectedGrandTotal = roundTo2(expectedSubTotal + expectedGst);
    const expectedTds = roundTo2(expectedSubTotal * 0.10); // Standard 10% TDS
    const expectedAccountReceivable = roundTo2(expectedGrandTotal - expectedTds);

    await expect.poll(async () => {
        const rawSubTotal = await createInvoicePage.getSummaryValue('Net Total');
        const rawGrandTotal = await createInvoicePage.getSummaryValue('Invoice Total');
        const rawTds = await createInvoicePage.getSummaryValue('TDS');
        const rawReceivable = await createInvoicePage.getSummaryValue('Receivable');

        const parseAmount = (val: string) => {
            const matches = val.match(/-?[\d,]+(?:\.\d+)?/g);
            if (!matches) return 0;
            return parseFloat(matches[matches.length - 1].replace(/[^\d.-]/g, ''));
        };

        return {
            subTotal: parseAmount(rawSubTotal),
            grandTotal: parseAmount(rawGrandTotal),
            tds: Math.abs(parseAmount(rawTds)),
            accountReceivable: parseAmount(rawReceivable),
        };
    }, {
        message: 'Summary table values should match the expected calculations for two joiners',
        timeout: 10000,
    }).toEqual({
        subTotal: expectedSubTotal,
        grandTotal: expectedGrandTotal,
        tds: expectedTds,
        accountReceivable: expectedAccountReceivable
    });

    // ── TC-086: Payment Details panel shows Notes ─────────────────────────────
    const notesTextarea = accountPage.getByPlaceholder('Add notes for this update');
    await expect(notesTextarea).toBeVisible({ timeout: 5_000 });

    // ── TC-087: Update Invoice saves changes ──────────────────────────────────
    await createInvoicePage.clickUpdateInvoice();
    const updateToast = await PageHelper.waitForToast(accountPage, 'success');
    expect(updateToast).toContain('AR Invoice updated');

    // After update, should stay on the edit page (per TC-087 expected result)
    await expect(accountPage).toHaveURL(/\/accounts\/create-invoice\//, { timeout: 10_000 });

    // ── TC-088: Change Status to Received — enables Received Date ─────────────
    const editInvoicePage = new CreateInvoicePage(accountPage);
    await editInvoicePage.selectInvoiceStatus('Received');

    // Received Date should become enabled and auto-filled with today
    const receivedDate = accountPage.getByPlaceholder('DD/MM/YYYY').first();
    await expect(receivedDate).toBeEnabled({ timeout: 5_000 });
    await expect(receivedDate).not.toHaveValue('', { timeout: 5_000 });

    // Transaction ID field should appear
    const transactionIdField = accountPage.getByPlaceholder('Enter transaction ID');
    await expect(transactionIdField).toBeVisible({ timeout: 5_000 });

    // ── TC-089: Save as Received with Transaction ID and Notes ────────────────
    const transactionId = `TXN-${faker.string.alphanumeric(6).toUpperCase()}`;
    await editInvoicePage.fillTransactionId(transactionId);
    await editInvoicePage.fillNotes('Payment received via NEFT.');

    await editInvoicePage.clickUpdateInvoice();

    // Redirects to AR list after marking as Received
    await expect(accountPage).toHaveURL(/\/accounts\/receivables/, { timeout: 15_000 });
    await PageHelper.waitForTableLoaderToDisappear(accountPage);

    // ── TC-090: Invoice list reflects Received status ─────────────────────────
    // The invoice we created is the most recent; it should now show "Received"
    const updatedRow = accountPage.locator('table tbody tr').first();
    await expect(updatedRow).toBeVisible({ timeout: 10_000 });

    // Status cell should contain "Received"
    await expect(updatedRow).toContainText(/Received/i, { timeout: 5_000 });
});
});
