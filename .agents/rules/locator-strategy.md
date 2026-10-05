# Playwright Locator Strategy & Automation Rules

These rules apply to ALL Playwright automation work in this project.
When implementing locators and Page Object methods, always follow this document.

---

## Objective

When given any HTML/DOM snippet, screenshot, or UI description:
1. Understand what the element represents
2. Inspect the full HTML structure
3. Evaluate all possible locator strategies
4. Select the most stable, reliable, and maintainable locator
5. Add to the correct existing Page Object class (do not create duplicates)
6. Create a reusable business-level method when appropriate
7. Reuse existing locators and methods wherever possible

---

## Locator Priority Hierarchy

Apply in order. Use the first strategy that yields a stable, unique, reliable locator.

### 1. `getByRole()` with accessible name
Use when the element has a clear, stable, unique accessible name.
```ts
page.getByRole('button', { name: 'Save' })
page.getByRole('textbox', { name: 'Candidate Name' })
page.getByRole('combobox', { name: 'Department' })
```
Do NOT use a bare `page.getByRole('textbox')` when multiple textboxes exist.

### 2. `getByLabel()`
Use for properly labelled form controls.
```ts
page.getByLabel('Candidate Name')
```

### 3. Stable Unique ID
A stable, semantically-named ID is high priority.
```ts
page.locator('#candidateName')   // GOOD — stable, unique
page.locator('#input-839274')    // BAD  — dynamically generated
```

### 4. Dedicated Test/Automation Attribute
Use the project's established convention.
```ts
page.getByTestId('candidate-name')
page.locator('[data-qa="save-button"]')
```

### 5. Other Stable Attributes (name, aria-*, data-*, type)
```ts
page.locator('input[name="candidateName"]')
```

### 6. `getByPlaceholder()`
Use when placeholder text is meaningful and reasonably stable.
```ts
page.getByPlaceholder('John Doe')
```

### 7. Simple CSS Selector
Use when semantic locators and stable attributes are unavailable.
```ts
page.locator('input[name="candidateName"]')   // OK
page.locator('div > div:nth-child(2) input')  // AVOID
```

### 8. XPath (Last Resort)
Only when no other stable locator exists. Never positional XPath.

---

## Absolute Prohibitions

| Do NOT use | Reason |
|---|---|
| CSS styling class selectors | Break when UI is restyled |
| Positional selectors (.nth, nth-child) | Break when DOM changes |
| Framework-generated dynamic IDs | Change between sessions/builds |
| waitForTimeout() | Arbitrary sleep — use auto-waiting |

---

## Stability Assessment

**Stable:** candidateName, employeeId, department, email, saveButton
**Unstable (dynamic):** input-839274, radix-:r1:, ember123, React/Headless UI IDs, UUIDs

If an ID looks dynamically generated, do NOT use it.

---

## Dropdown Strategy

| Type | Strategy |
|---|---|
| Native select | await locator.selectOption({ label: 'Value' }) |
| ARIA combobox | click combobox, then click option by getByRole('option') |
| Custom/searchable | Analyze DOM — click trigger, type/select option |

Never assume every dropdown is a native select.

---

## Tables & Rows

Never use positional row selectors. Identify rows by meaningful content.

```ts
// GOOD
page.getByRole('row').filter({ hasText: 'John Doe' })

// BAD
page.locator('tbody tr:nth-child(3)')
```

Row action pattern:
```ts
async clickEditForCandidate(candidateName: string): Promise<void> {
    const row = this.page.getByRole('row').filter({ hasText: candidateName });
    await row.getByRole('button', { name: 'Edit' }).click();
}
```

---

## Waiting Strategy

Always use Playwright built-in auto-waiting.
NEVER use: await page.waitForTimeout(3000)
USE instead: await expect(locator).toBeVisible() or let Playwright auto-wait on actions.

---

## Page Object Model Rules

1. One class per page/modal — never create CandidatePage2, CandidatePageNew, etc.
2. All locators defined as readonly properties in the constructor.
3. No assertions inside Page Object methods — expose locators for tests to assert.
4. Business-level method names: enterCandidateName(), selectDepartment(), NOT fillInput().
5. Check for duplicates before adding any locator or method.
6. Reuse existing Page Objects — search the project before creating anything new.

---

## Method Naming

GOOD: enterCandidateName(), selectDepartment(), clickSave(), searchCandidate()
BAD: clickButton(), fillInput(), clickElement()

---

## TypeScript Quality

```ts
readonly candidateNameInput: Locator;
async enterCandidateName(name: string): Promise<void>
```
Avoid unnecessary `any`. Follow existing project TypeScript config.

---

## HTML Analysis Process

When HTML is provided, always:
1. UNDERSTAND — What does this element represent?
2. INSPECT — Identify role, accessible name, label, ID, test ID, name, placeholder, aria-*, data-*, stable vs dynamic attributes.
3. COMPARE — Evaluate all locator strategies against the priority hierarchy.
4. SELECT — Choose the most stable and maintainable locator. Explain the choice.
5. IMPLEMENT — Add/update in the correct existing Page Object.
6. METHOD — Create a reusable business-level method when appropriate.
7. REUSE — Check for existing locators/methods first. Never duplicate.
8. VALIDATE — Confirm the change does not break existing automation.

---

## Final Quality Checklist

- Locator is stable and sufficiently unique
- Locator does not depend on styling classes
- Locator does not depend on DOM position
- Locator does not use a dynamically generated ID
- Existing Page Object reused where possible
- No duplicate locator introduced
- Method names are meaningful and business-oriented
- TypeScript types are correct
- No waitForTimeout introduced
- Existing functionality not unnecessarily modified
- Code follows the existing project conventions
