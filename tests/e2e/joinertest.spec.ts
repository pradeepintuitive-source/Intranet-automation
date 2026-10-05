import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { HomePage } from '../../src/pages/HomePage';
import { JoinerPage } from '../../src/pages/JoinerPage';
import { AddJoinerModal } from '../../src/pages/AddJoinerModal';
import { PageHelper } from '../../src/utils/PageHelper';
import { clients } from '../../test-data/source/clientsData';
import { joinerData } from '../../test-data/source/joinerData';
import { todayFormatted, futureDateFormatted } from '../../src/utils/FormHelper';

test.use({ storageState: 'playwright/.auth/hr.json' });

test.describe('Joiner Management', { tag: ['@regression'] }, () => {
    test('should successfully submit a new joiner with valid details', async ({ page, context }) => {
    // ── Arrange ────────────────────────────────────────────────────────────────
    // Client is pinned to Mizuho Global Services (MGS01).
    // Location is pinned to the Chennai office (index 0).
    // Dynamic fields (name, title, CTC, comments) vary per run via faker.

    const mgsLocation = joinerData.mgsChennaiLocation; // Chennai, Tamil Nadu

    const joiner = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        title: faker.helpers.arrayElement(joinerData.titles),
        client: clients.mizuhoGlobalServices.name,
        location: mgsLocation.city,           // 'Chennai, Tamil Nadu'
        margin: joinerData.margins.junior,   // 'Junior – 8.33%'
        submissionDate: todayFormatted(),
        ctc: faker.number.int({ min: joinerData.ctc.min, max: joinerData.ctc.max }).toString(),
        recruiter: joinerData.recruiter.shalini,   // Pinned; update from app if it changes
        dateOfJoining: todayFormatted(),     // Joining ~1 month from today
        status: joinerData.statuses[2],
        comments: faker.lorem.sentence(),
    };

    console.log('Submitting joiner:', joiner);

    // ── Step 1: Log in as HR and navigate to Home ──────────────────────────────
    const homePage = new HomePage(page);
    await homePage.goto();

    // ── Step 2: Click Account tile — module opens in a new tab ────────────────
    const accountPage = await homePage.openAccountsModule(context);

    // ── Step 3: Navigate to the Joiner page ───────────────────────────────────
    const joinerPage = new JoinerPage(accountPage);
    await joinerPage.navigateTo();

    // ── Step 4: Open the Add Joiner modal ─────────────────────────────────────
    await joinerPage.clickAddJoiner();

    // ── Act: Fill all modal fields ─────────────────────────────────────────────
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

    // ── Assert ─────────────────────────────────────────────────────────────────
    const toastMessage = await PageHelper.waitForToast(accountPage, 'success');
    expect(toastMessage).toContain(joinerData.successMessage);
});
});
