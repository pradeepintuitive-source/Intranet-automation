import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';
import { EmployeePage } from '../../src/pages/EmployeePage';
import { PageHelper } from '../../src/utils/PageHelper';
import { employees } from '../../test-data/source/employeesData';

test.use({ storageState: 'playwright/.auth/hr.json' });

test('debug yokeshwaran profile link', async ({ page, context }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    const hrmsPage = await homePage.openHrmsModule(context);

    await hrmsPage.locator('aside').getByText('Directory', { exact: true }).click({ timeout: 5000 }).catch(() => hrmsPage.goto('/hrms/hr/directory'));
    await PageHelper.waitForLoaderToDisappear(hrmsPage);

    const directoryPage = new EmployeePage(hrmsPage);
    const yokeshwaranProfileContext = await directoryPage.searchAndOpenEmployee(employees.yokeshwaran.firstName, context);
    
    console.log('Opened URL:', yokeshwaranProfileContext.url());
    
    // Check if Compensation button exists
    const compensationBtn = yokeshwaranProfileContext.getByRole('button', { name: 'Compensation' });
    console.log('Compensation button visible:', await compensationBtn.isVisible());

    // Wait a bit to ensure everything is loaded
    await yokeshwaranProfileContext.waitForTimeout(5000);
});
