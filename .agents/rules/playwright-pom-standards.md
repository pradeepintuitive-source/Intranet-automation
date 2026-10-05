# Playwright POM Industry Standards

Follow these standards for all Page Object Model files:

## Structure
- Use **Single-Class POM** pattern (Playwright recommended)
- Organize with section headers: `LOCATORS`, `NAVIGATION`, `PRIVATE HELPERS`, `ACTIONS`
- All locators defined as `readonly` properties in the constructor

## Rules
1. **Assertions belong in tests, NOT in POMs** — POMs only contain locators and actions
2. **Expose assertion-worthy locators** (e.g., `successToast`, `errorMessage`) as public readonly properties so tests can assert on them
3. **No `waitForTimeout`** — use event-based waits (`waitFor`, `waitForSelector`, `expect().toBeEnabled()`)
4. **Actions return useful data** when applicable (e.g., extracted text, status values)
5. **Private helpers** for shared logic within the POM (e.g., `findCandidateRow`)
6. **Handle UI overlays** in `navigateTo()` (e.g., dismiss notifications panel) so actions start from a clean state

## Example
```typescript
export class ExamplePage {
  // ═══════════════════════════════════════
  // LOCATORS
  // ═══════════════════════════════════════
  readonly page: Page;
  readonly submitButton: Locator;
  readonly successToast: Locator;

  constructor(page: Page) { ... }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════
  async navigateTo() { ... }

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════
  async submitForm(data: FormData) { ... } // No assertions here
}

// In the test file:
await examplePage.submitForm(data);
await expect(examplePage.successToast).toBeVisible(); // Assertion lives in test
```
