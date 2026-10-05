import { Page, Locator, expect } from '@playwright/test';
import { ToastMessages } from '../../test-data/toast/toastMessages';

/**
 * Reusable component for interacting with Toast notifications.
 */
export class Toast {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ═══════════════════════════════════════
    // LOCATORS
    // ═══════════════════════════════════════

    get locator(): Locator {
        return this.page.locator('.Toastify__toast');
    }

    get successLocator(): Locator {
        return this.page.locator('.Toastify__toast--success');
    }

    get errorLocator(): Locator {
        return this.page.locator('.Toastify__toast--error');
    }

    get warningLocator(): Locator {
        return this.page.locator('.Toastify__toast--warning');
    }

    get infoLocator(): Locator {
        return this.page.locator('.Toastify__toast--info');
    }

    // ═══════════════════════════════════════
    // ACTIONS & EXPECTATIONS
    // ═══════════════════════════════════════

    /**
     * Waits for any toast to appear and returns the locator.
     */
    async waitForToast(timeout = 10000): Promise<Locator> {
        const toast = this.locator.first();
        await toast.waitFor({ state: 'visible', timeout });
        return toast;
    }

    /**
     * Gets the text of the first visible toast.
     */
    async getToastText(timeout = 10000): Promise<string> {
        const toast = await this.waitForToast(timeout);
        return (await toast.textContent())?.trim() || '';
    }

    /**
     * Expects a toast matching the exact message string.
     */
    async expectToast(expectedMessage: string, timeout = 10000) {
        const actualText = await this.getToastText(timeout);
        expect(actualText).toContain(expectedMessage);
    }

    /**
     * Expects a dynamic toast message to appear by interpolating values.
     */
    async expectToastTemplate(templateMessage: string, values: Record<string, string | number>, timeout = 10000) {
        const expectedText = ToastMessages.format(templateMessage, values);
        const actualText = await this.getToastText(timeout);
        expect(actualText).toContain(expectedText);
    }

    /**
     * Expects a specific success toast message.
     */
    async expectSuccessToast(expectedMessage: string, timeout = 10000) {
        await this.successLocator.first().waitFor({ state: 'visible', timeout });
        await this.expectToast(expectedMessage, timeout);
    }

    /**
     * Expects a specific error toast message.
     */
    async expectErrorToast(expectedMessage: string, timeout = 10000) {
        await this.errorLocator.first().waitFor({ state: 'visible', timeout });
        await this.expectToast(expectedMessage, timeout);
    }

    /**
     * Expects a specific warning toast message.
     */
    async expectWarningToast(expectedMessage: string, timeout = 10000) {
        await this.warningLocator.first().waitFor({ state: 'visible', timeout });
        await this.expectToast(expectedMessage, timeout);
    }

    /**
     * Expects a specific info toast message.
     */
    async expectInfoToast(expectedMessage: string, timeout = 10000) {
        await this.infoLocator.first().waitFor({ state: 'visible', timeout });
        await this.expectToast(expectedMessage, timeout);
    }

    /**
     * Generic text assertion for toasts.
     */
    async expectToastContains(expectedText: string, timeout = 10000) {
        const actualText = await this.getToastText(timeout);
        expect(actualText).toContain(expectedText);
    }

    /**
     * Asserts that no toast is currently visible.
     */
    async expectNoUnexpectedToast() {
        const isVisible = await this.locator.first().isVisible();
        expect(isVisible).toBeFalsy();
    }

    /**
     * Waits for all toasts to disappear from the page.
     */
    async waitForToastToDisappear(timeout = 15000) {
        await this.locator.first().waitFor({ state: 'hidden', timeout });
    }
}
