---
name: playwright-best-practices
description: >-
  Provides mandatory coding standards, architectural rules, and best practices for writing Playwright automation tests in the Intranet QA Automation framework. Use this skill when creating or modifying Playwright test files, Page Objects, or utilities to ensure scalability, reliability, and parallel execution.
---

# Playwright Best Practices

When writing or reviewing Playwright automation code for the Intranet QA Automation project, adhere strictly to the following rules to prevent flakiness and maintain scalability.

## 1. Test Isolation and Parallelization
- **No Shared Global State**: Never use global mutable variables (e.g., `let testState = {}`) to pass data between test blocks. Each `test()` must be completely isolated and independent.
- **Avoid Serial Execution**: Do not use `test.describe.serial` unless absolutely necessary. Playwright is designed to run tests in parallel isolated worker processes. If tests share state, they cannot run in parallel.
- **Setup via API**: If a test requires specific data (e.g., a candidate or referral already created), prefer setting this up via API requests in a `beforeEach` hook rather than relying on sequential UI execution.
- **Use Custom Fixtures**: If state must be shared or injected, use Playwright Custom Fixtures to inject isolated data per test.

## 2. Synchronization and Waits
- **No Hardcoded Waits**: Never use `page.waitForTimeout(ms)`. This is the primary cause of flaky tests.
- **Use Auto-Waiting**: Rely on Playwright's built-in auto-waiting for actionability (visibility, enablement).
- **Wait for Network/API**: When waiting for a backend operation (like submitting a form that shows a loading spinner), wait for the specific network response using `page.waitForResponse(url_pattern)` rather than arbitrary timeouts.
- **Avoid Swallowing Promises**: Do not use `.catch(() => {})` indiscriminately, especially on network idle checks, as it masks real application performance bugs.

## 3. Page Object Model (POM) Design
- **Assertions in Tests Only**: Do not embed `expect()` assertions inside Page Objects or Utility helpers. POM methods should perform actions and return state or element handles. The test (`.spec.ts`) should make the assertion.
- **Dependency Injection**: Do not evaluate `process.env` directly inside a Page Object (e.g., `LoginPage`). Pass credentials or configuration as parameters to the POM methods from the test script or a central configuration loader.

## 4. Interaction Strategies
- **Avoid Force Clicks**: Avoid using `{ force: true }` for clicks or checks unless absolutely necessary. `force: true` bypasses Playwright's actionability checks (ensuring the element is visible, stable, and not covered by an overlay), which can result in tests passing artificially when a real user would fail.
- **Robust Overlay Dismissal**: When dismissing overlays or notifications (like a side panel), use explicit locators targeting the "Close" button rather than blindly pressing the `Escape` key or clicking on coordinates.
- **Semantic Locators**: Use user-facing locators like `getByRole()`, `getByLabel()`, `getByPlaceholder()`, or `getByText()` instead of fragile CSS selectors or XPath.

## 5. Security
- Never hardcode user credentials or secrets into the repository. Continue using `.env` files and `auth.setup.ts`, but ensure the `.env` file is excluded from commits.

## 6. Timeouts and Synchronization

### 6.1 Test Timeout Policy
- **Default Timeout**: Use Playwright's configured global/default test timeout for normal tests. Do NOT add `test.setTimeout()` to every test.
- **Test-Specific Timeout**: Use `test.setTimeout(<milliseconds>)` ONLY when the complete test genuinely represents a long-running end-to-end business workflow (e.g., multiple modules, browser contexts, or authenticated users).
- **Justification Required**: Whenever adding `test.setTimeout()`, determine why the test requires the extended timeout. Never increase timeout merely to make a failing test pass.

### 6.2 Expectation Timeout Policy
- Use assertion-level timeouts (e.g., `await expect(locator).toBeVisible({ timeout: 30000 })`) when a specific UI/API operation legitimately needs additional time.
- Do not automatically use extremely large assertion timeouts. Anything above 60 seconds requires investigation and justification.

### 6.3 Never Use Fixed Sleeps as Synchronization
- Avoid `await page.waitForTimeout(5000)`. Do not use fixed waits to compensate for page loading, API processing, toast messages, etc.
- Instead, wait for a meaningful condition (e.g., specific text, network response, or a locator).

### 6.4 Wait for Business State, Not Time
- When an operation triggers asynchronous processing, identify the actual business state that proves completion before proceeding.

### 6.5 Distinguish Test Timeout from Assertion Timeout
- `test.setTimeout()` = maximum duration of the entire test.
- `expect timeout` = maximum time for a specific assertion.
- `navigation timeout` = maximum time for navigation.
- `action timeout` = maximum time for an individual Playwright action.

### 6.6 Locator Failure Rule
- When a locator fails, DO NOT immediately increase its timeout. Investigate if the element exists, the locator is correct, the page state, data correctness, etc.

### 6.7 Retry Policy
- Do not add retries simply to hide flaky tests. Retries may be used for genuinely transient failures, but the root cause of flakiness must still be investigated.

### 6.8 Page Navigation
- Prefer Playwright's built-in navigation synchronization (`await page.goto(url)` followed by `expect(...).toBeVisible()`) over arbitrary `waitForTimeout` after navigation.

### 6.9 API/Backend Synchronization
- If UI behavior depends on an API request, prefer waiting for the relevant response/request when appropriate using `page.waitForResponse()`.

### 6.10 Polling for Eventual Consistency
- If the application uses asynchronous processing, use controlled polling (`expect.poll()`) rather than fixed sleeps.

### 6.11 Test Splitting Rule
- If a test requires an unusually large timeout because it performs too many unrelated operations, consider splitting the test into focused business-flow tests. Do NOT split a logically atomic E2E business workflow merely to reduce its timeout.

### 6.12 Timeout Configuration
- Keep framework-wide timeout configuration centralized in `playwright.config.ts`. Do not scatter arbitrary timeout values throughout the project.

### 6.13 Page Object Model Rule
- Page Objects must NOT contain arbitrary long waits (`page.waitForTimeout()`).

### 6.14 Debugging Order
- When a test fails due to timeout, investigate in this order: Locator correctness -> Page/state correctness -> Test-data correctness -> Application/API response -> Synchronization condition -> Actual defect -> Only then consider increasing timeout.

### 6.15 Code Review Rule
- Before accepting code containing timeouts or waits, ensure there is a clear justification. Ensure the framework principle "WAIT FOR STATE, NOT TIME" is strictly followed.
