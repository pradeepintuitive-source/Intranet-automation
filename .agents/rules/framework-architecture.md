# Framework Architecture & Test Design Rules

These rules apply to ALL automation work in this project.
Apply them alongside `locator-strategy.md` and `playwright-pom-standards.md`.

---

## Architecture Rules

### Project Structure
Before creating any new file or folder:
1. Inspect the existing project structure
2. Understand the current architecture
3. Reuse existing utilities, fixtures, Page Objects, config, and helpers
4. Do not introduce a second architecture for the same purpose
5. Do not create duplicate utilities, Page Objects, or helpers

Maintain clear separation:
```
Tests → Page Objects → Components/Utilities → Playwright
```
- **Tests**: business scenarios and intent only
- **Page Objects**: UI interaction logic only
- **Utilities**: reusable technical functionality
- **Test Data**: separated from UI interaction logic

### Page Object Responsibility
- Page Objects represent application behavior — not "god classes"
- Split reusable UI components (Header, Sidebar, Modal, DataTable, Toast, Pagination, Filter) into component classes when they appear on multiple pages
- Do NOT duplicate a component implementation across multiple pages

```
pages/
    CandidatePage.ts
    EmployeePage.ts
components/
    Modal.ts
    DataTable.ts
    Toast.ts
    Pagination.ts
```

### Fixtures
- Use Playwright fixtures (`test.extend`) for reusable setup
- Good candidates: authenticated page, API client, Page Objects, test data factory
- Fixtures must have a single clear responsibility

---

## Test Design Rules

### Independence
Tests must be: Independent · Repeatable · Deterministic · Maintainable · Isolated

A test must NEVER depend on another test having run first.
BAD: Test 2 edits a record created by Test 1.
Use `test.describe.configure({ mode: 'serial' })` ONLY when the business workflow genuinely requires it — not to hide dependency problems.

### Test Naming
Describe business behavior, not implementation.
```ts
// GOOD
test('should create a candidate with valid mandatory details', ...)
test('should display validation message when candidate email is invalid', ...)

// BAD
test('click button test', ...)
test('candidate input test', ...)
```

### Test Structure — Arrange → Act → Assert
```ts
test('should create candidate successfully', async ({ candidatePage }) => {
    // Arrange
    await candidatePage.open();
    await candidatePage.enterCandidateName('John Doe');

    // Act
    await candidatePage.clickSave();

    // Assert
    await expect(candidatePage.successMessage).toHaveText('Candidate created successfully');
});
```

---

## Assertion Rules

Every important business action must have an appropriate assertion.
NEVER consider a click itself as proof of success.

```ts
// BAD — no assertion
await page.getByRole('button', { name: 'Save' }).click();

// GOOD
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByRole('alert')).toHaveText('Candidate created successfully');
```

Prefer Playwright assertions: `toBeVisible`, `toBeHidden`, `toHaveText`, `toHaveValue`, `toBeChecked`, `toHaveAttribute`, `toHaveURL`

Never weaken assertions to make a test pass (false positives).
Never over-tie assertions to implementation details like CSS classes or DOM nesting (false negatives).

---

## Waiting & Synchronization

NEVER use `await page.waitForTimeout(N)` to make tests pass.

Use the correct mechanism:
```ts
await expect(button).toBeEnabled();            // UI state
await page.waitForURL('**/candidates');         // navigation
await page.waitForResponse(...);               // API
await expect(progressbar).toBeHidden();        // loading indicator
```

Do NOT overuse `await page.waitForLoadState('networkidle')` after every action.
Wait only for the specific condition the test requires.

---

## Authentication & Secrets

- Do NOT log in through the UI before every test unless testing login itself
- Use Playwright `storageState` for authenticated tests
- Credentials must NEVER be hardcoded in `.spec.ts`, Page Objects, fixtures, or test data
- Use environment variables: `process.env.TEST_USERNAME`, `process.env.TEST_PASSWORD`
- Never commit passwords, API keys, tokens, or production credentials to the repository
- Never log credentials in console output or reports

---

## Environment Management

- Support multiple environments without changing test code (`.env.dev`, `.env.qa`, `.env.staging`)
- Use `baseURL` from config — never hardcode domain URLs in tests
```ts
// GOOD
await page.goto('/candidates');

// BAD
await page.goto('https://qa.intranet.example.com/candidates');
```

---

## Test Data Management

- Separate test data from test logic
- Do not hardcode large amounts of data inside test cases — use data objects or fixtures
```ts
const candidate = candidateData.validCandidate;  // GOOD
```
- Generate unique data safely when uniqueness is required:
```ts
const email = `qa_${Date.now()}@example.com`;
```
- Clean up only records created by the test; never delete shared/real data
- Prefer API/DB cleanup over expensive UI cleanup where possible

---

## API Usage

- Use API to set up test data when the UI workflow itself is not being tested (faster, more reliable)
- Keep API clients separate from Page Objects
- Validate API responses beyond just status codes — check structure, fields, and business rules
```ts
// BAD — only checks status
expect(response.status()).toBe(200);

// GOOD
const body = await response.json();
expect(response.status()).toBe(200);
expect(body.id).toBeDefined();
expect(body.name).toBe(candidateName);
```
- Use network mocking only for unavailable external systems, deterministic error scenarios, or third-party services — not to bypass real backend testing

---

## Negative Testing

For each major feature, cover:
- Valid input (happy path)
- Missing mandatory fields
- Invalid input / boundary values
- Duplicate data
- Unauthorized access / incorrect permissions
- Invalid state
- Empty results / large datasets
- Special characters

Focus on meaningful business scenarios — not hundreds of redundant tests.

---

## Parallel Execution & Isolation

Tests must be safe to run in parallel by default.
Avoid: shared mutable state, shared test accounts, shared records, fixed filenames, fixed ports.
Fix isolation issues at the root — do not disable parallelism as a workaround.

---

## Modals & Scoping

Always scope locators to the appropriate dialog when duplicate elements exist on a page:
```ts
const dialog = page.getByRole('dialog');
await dialog.getByRole('textbox', { name: 'Candidate Name' }).fill('John Doe');
await dialog.getByRole('button', { name: 'Save' }).click();
```

---

## Method Design

Avoid "god methods" — break workflows into composable actions:
```ts
// BAD
await candidatePage.createCandidateAndVerifyAndDelete();

// GOOD — compose in tests
await candidatePage.enterCandidateDetails(data);
await candidatePage.clickSave();
await candidatePage.searchCandidate(data.name);
await candidatePage.deleteCandidate(data.name);
```

---

## Navigation

Use Page Object `goto()` methods — do not repeat raw navigation in every test.
Use relative routes with `baseURL`:
```ts
await this.page.goto('/candidates');
```

---

## Error Handling

Never silently swallow errors:
```ts
// BAD
try { ... } catch { /* ignore */ }

// GOOD
try {
    await candidatePage.createCandidate(data);
} catch (error) {
    throw new Error(`Failed to create candidate: ${data.name}`, { cause: error });
}
```

---

## CI/CD & Cross-Platform

- Tests must work both locally and in CI/CD
- Do not depend on developer-specific paths, local browser installations, or local-only credentials
- Use `path.join()` — never hardcode Windows (`C:\Users\...`) or Unix paths
- Tests must work in headless mode — no reliance on screen coordinates or resolution

---

## Configuration

Centralize all configuration in `playwright.config.ts`, env files, and fixtures:
- Timeouts · base URLs · browser settings · API URLs · retry values
- Never scatter these throughout individual tests
- Use targeted timeouts for genuinely slow operations — do not raise global timeout for one slow test

---

## Retries & Flakiness

- Retries are for genuine environmental flakiness — not for hiding broken tests
- Investigate and fix the root cause of any test that only passes after retrying
- Reports should clearly identify flaky/retried tests

---

## Failure Diagnosis

Configure Playwright artifacts:
```
trace: retain-on-failure
screenshot: only-on-failure
video: retain-on-failure
```

When a test fails, investigate in order:
1. Error message
2. Screenshot / trace
3. DOM state
4. Network/API response
5. Console errors
6. Application logs

Fix the root cause — do not randomly change the locator.

Root-cause checklist:
- Is the element actually present?
- Is the locator correct?
- Is authentication valid?
- Is the data present?
- Is the API responding?
- Is the element disabled or blocked by a modal?
- Is there a frontend or backend error?

---

## Tagging

Use meaningful tags: `@smoke`, `@regression`, `@critical`, `@ui`, `@api`, `@payroll`, `@candidate`
Document the purpose of each tag. Do not over-tag.

Smoke tests must be: fast · stable · critical · representative.

---

## File Uploads & Downloads

- Use Playwright's built-in file upload mechanisms
- Keep test files in a controlled `test-data/` directory — never reference developer desktop paths
- For downloads: validate that the download initiated, the file exists, filename, type, and contents where required

---

## Date/Time

- Never assume developer's local timezone
- Be explicit about timezone context for date-sensitive tests (UTC, IST, server TZ, browser TZ)
- Cover month-end, payroll dates, effective dates, and due dates explicitly

---

## Change Control

Before making a large framework change:
1. Understand the current implementation
2. Identify the problem precisely
3. Determine the smallest safe change
4. Implement, validate, and report

Do not refactor unrelated areas while implementing a new test.
Never execute destructive Git commands automatically.
Never modify the application under test just to make automation pass — report application defects instead.

---

## Logging

Log meaningful actions:
```
Creating candidate: John Doe
Navigating to Candidates page
Candidate created successfully
```
Never log sensitive data (passwords, tokens, session cookies, auth headers).

---

## Documentation

Document major framework utilities and architectural patterns:
- Purpose · Usage · Example · Limitations
Do not write documentation for every trivial locator.

---

## Never Claim Success Without Validation

Always distinguish clearly:
- **Implemented** — code written
- **Validated** — compilation + lint + targeted test run confirmed
- **Not validated** — explicitly stated as such
- **Blocked / Failed** — explicitly stated

Never report "test passed" without actually running the validation.

---

## Implementation Report Format

After each implementation, provide a concise summary:
```
What changed: ...
Page Object: ...
Locators added/modified: ...
Methods added/modified: ...
Tests added/modified: ...
Validation: ...
Issues/risks: ...
Files changed: ...
```

---

## Stop and Ask

Do not invent business requirements.
If the HTML is sufficient to determine a locator — proceed.
If the test requirement is ambiguous and different interpretations would produce materially different behavior — ask for clarification.

---

## Golden Rule

Optimize for:
Reliability + Maintainability + Readability + Test Isolation + Stable Locators + Meaningful Assertions + Fast Execution + Easy Debugging + CI/CD Compatibility

NOT just: "Make the test pass"
