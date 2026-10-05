# Proposed Playwright Framework Architecture

The proposed automation framework will be built using **Playwright** and **TypeScript**, specifically targeting UI automation for the Intranet QA application. The architecture is designed to be scalable, maintainable, and aligned with standard Page Object Model (POM) patterns.

## Directory Structure
```
tests/
  ui/
    login.spec.ts             # Test files organized by module
    payroll/                  # Subdirectories for complex modules
    accounts/
src/
  config/
    env.ts                    # Environment variables loader
  fixtures/
    test-setup.ts             # Custom Playwright fixtures (e.g., initialized Page Objects)
  pages/
    LoginPage.ts              # Page Object classes matching actual app pages
    DashboardPage.ts
    ...
  components/
    Table.ts                  # Reusable UI components (Tables, Dropdowns, DatePickers)
    Dropdown.ts
  utils/
    helpers.ts                # General utilities
  data/
    test-data.json            # Externalized test data
  types/
    models.d.ts               # TypeScript types for users, responses, etc.
```

## Key Architectural Decisions

1. **Page Object Model (POM):**
   - Page Objects will represent actual pages discovered in the Intranet application.
   - We will not create mock or imaginary pages.
   - Reusable components (e.g., standard table structures, navigation bars) will be separated into `src/components/` and composed within Page Objects to adhere to DRY principles.

2. **Locators Strategy:**
   - Following Playwright best practices, we will prioritize user-centric locators: `getByRole`, `getByText`, `getByLabel`.
   - `getByTestId` will be used if test attributes (`data-testid`) are present in the DOM.
   - CSS and XPath will be avoided unless absolutely necessary for complex, dynamic elements.

3. **Authentication:**
   - We will discover the real authentication mechanism (e.g., form-based login, token injection).
   - We will utilize Playwright's `storageState` to reuse authenticated sessions across tests, significantly reducing test execution time and backend load.

4. **Test Data Management:**
   - Test data will be strictly decoupled from test logic and Page Objects.
   - Data will be injected into tests using JSON files or data generation utilities in `src/data/`.

5. **Test Isolation:**
   - Each test file/case will be independently executable. State will not bleed between tests.
   - We will rely on existing data where possible for UI-only tests, and eventually transition to API-based state setup when Phase 2 (API Automation) begins.

6. **Configuration & Execution:**
   - The framework will be configured to run against the QA environment by default (`https://qa.intranet.intuitiveapps.com/`).
   - Tags (e.g., `@smoke`, `@payroll`) will be used to execute specific subsets of tests.
   - CI/CD ready with environment variables for sensitive data (handled via `.env` locally).
