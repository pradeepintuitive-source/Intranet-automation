# Intranet QA Automation

## Toast Message Testing

This project uses a data-driven approach for testing Toast Messages. 
The SOURCE OF TRUTH for all toast messages is the Excel inventory file:
\`test-data/source/Toast_Messages_Inventory.xlsx\`

### 1. Generating Test Data

Do NOT manually create expected toast messages in your test files. Instead, generate the test data from the Excel inventory:

\`\`\`bash
npm run generate:toast-data
\`\`\`

*(Note: You can add `"generate:toast-data": "npx tsx scripts/generate-toast-data.ts"` to your `package.json` scripts)*

This script reads the Excel file and generates:
- \`test-data/toast/toastMessages.json\`
- \`test-data/toast/toastMessages.ts\`

These files contain the exact expected messages and dynamic templates from the application.

### 2. Using Toast Data in Tests

When writing a test that expects a toast message, use the `Toast` component and the `getToastMessageByKey` function.

**Example:**
\`\`\`typescript
import { Toast } from '../../src/components/Toast';
import { getToastMessageByKey } from '../../test-data/toast/toastMessages';

test('Should show success toast', async ({ page }) => {
  const toast = new Toast(page);
  
  // Perform action...
  await page.getByRole('button', { name: 'Submit' }).click();

  // Get the expected message definition from the generated data
  const expectedMessage = getToastMessageByKey('REFERRAL_CREATED');
  
  // Assert using the Toast component
  await toast.expectSuccessToast(expectedMessage);
});
\`\`\`

### 3. Dynamic Messages

If a toast message contains placeholders (e.g. `Invoice status updated to {new_status}.`), you can use the template assertion:

\`\`\`typescript
const expectedMessage = getToastMessageByKey('INVOICE_STATUS_UPDATED');
await toast.expectToastTemplate(expectedMessage, { new_status: 'Paid' });
\`\`\`

### 4. Updating Messages

If a toast message changes in the application, do NOT update the `toastMessages.ts` directly.
1. Update the original `Toast_Messages_Inventory.xlsx` file.
2. Re-run `npm run generate:toast-data`.

### 5. Notification Testing

Notification testing is kept separate from Toast testing. 
Do not assume every toast has a notification. 
Notifications should be tested using a separate `Notification` component (to be created) when required, taking into account notification IDs, timestamps, and read status to handle duplicates correctly.
