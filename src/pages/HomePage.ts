import { Page, BrowserContext, Locator } from '@playwright/test';
import { PageHelper } from '../utils/PageHelper';

/**
 * Page Object for the Intranet Home page (/home).
 *
 * Locators are derived from the live DOM captured on 2026-09-28.
 * Disabled tiles (Recruitment, IT Support, Training, Sales, Marketing)
 * are exposed as locators only — no action methods, since they are not clickable.
 */
export class HomePage {
  readonly page: Page;

  // ═══════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════

  /** Bell icon in the header. Click to open the Notifications panel. */
  readonly notificationsBellButton: Locator;

  /** Notification count badge on the bell icon (shows e.g. "93"). */
  readonly notificationCountBadge: Locator;

  /** User avatar/profile button in the header. */
  readonly userProfileButton: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS PANEL (slides in from the right)
  // ═══════════════════════════════════════════════════════════════════════

  /** The slide-in notifications panel container. */
  readonly notificationsPanel: Locator;

  /**
   * Close (✕) button inside the notifications panel header.
   * The button has no text/aria-label; scoped inside the panel to avoid
   * collisions with other icon-only buttons on the page.
   */
  readonly notificationsPanelCloseButton: Locator;

  /** "Mark all as read" button at the bottom of the notifications panel. */
  readonly markAllAsReadButton: Locator;

  /** All individual notification card items inside the panel. */
  readonly notificationItems: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // USER PROFILE DROPDOWN (opens when userProfileButton is clicked)
  // ═══════════════════════════════════════════════════════════════════════

  /** The dropdown/menu that appears after clicking the profile avatar. */
  readonly profileDropdownMenu: Locator;

  /** "Profile" or "My Profile" menu item inside the profile dropdown. */
  readonly profileMenuItem: Locator;

  /** "Settings" menu item inside the profile dropdown. */
  readonly settingsMenuItem: Locator;

  /** "Logout" / "Sign Out" menu item inside the profile dropdown. */
  readonly logoutMenuItem: Locator;

  // Active tiles — open in a new browser tab (target="_blank")
  // ═══════════════════════════════════════════════════════════════════════

  /** iDMS Portal tile → https://idms.intuitiveapps.com (external, new tab) */
  readonly idmsPortalTile: Locator;

  /** HRMS tile → /hrms/dashboard (new tab) */
  readonly hrmsTile: Locator;

  /** Accounts tile → /accounts/dashboard (new tab) */
  readonly accountsTile: Locator;

  /** Assets tile → /assets/dashboard (new tab) */
  readonly assetsTile: Locator;

  /** Resources tile → /resources/dashboard (new tab) */
  readonly resourcesTile: Locator;

  /** Delivery tile → /delivery/dashboard (new tab) */
  readonly deliveryTile: Locator;

  /** Data & Reports tile → /migration/dashboard (new tab) */
  readonly dataAndReportsTile: Locator;

  // Disabled tiles — not clickable, exposed for visibility assertions only
  readonly recruitmentTile: Locator;
  readonly itSupportTile: Locator;
  readonly trainingTile: Locator;
  readonly salesTile: Locator;
  readonly marketingTile: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // COMPANY NEWS (section id="news-rewards")
  // ═══════════════════════════════════════════════════════════════════════

  /** "View All" link that navigates to /news */
  readonly companyNewsViewAllLink: Locator;

  /** All visible news card items */
  readonly newsCards: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // REWARDS & RECOGNITION
  // ═══════════════════════════════════════════════════════════════════════

  /** "View All" link that navigates to /employee/rewards-detail */
  readonly rewardsViewAllLink: Locator;

  /** All "🎉 Congratulate" buttons in the Rewards section */
  readonly congratulateButtons: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // HOLIDAY CALENDAR (section id="calendar-polls")
  // ═══════════════════════════════════════════════════════════════════════

  /** "View Full Calendar" button */
  readonly viewFullCalendarButton: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIVE POLL
  // ═══════════════════════════════════════════════════════════════════════

  /** Left chevron (previous) button in the poll carousel */
  readonly pollPreviousButton: Locator;

  /** Right chevron (next) button in the poll carousel */
  readonly pollNextButton: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // UPCOMING EVENTS (section id="events")
  // ═══════════════════════════════════════════════════════════════════════

  /** "View All" link that navigates to /upcoming-events */
  readonly eventsViewAllLink: Locator;

  // ═══════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════

  constructor(page: Page) {
    this.page = page;

    // ── Header ──────────────────────────────────────────────────────────
    this.notificationsBellButton = page.locator('header').getByRole('button').first();
    this.notificationCountBadge  = page.locator('header').locator('span.bg-blue-600');
    this.userProfileButton       = page.locator('header').getByRole('button').last();

    // ── User profile dropdown ────────────────────────────────────────────
    // The menu appears in a radix/popover element after clicking the avatar.
    this.profileDropdownMenu = page.locator('[role="menu"]');
    this.profileMenuItem     = this.profileDropdownMenu.getByRole('menuitem', { name: /My Portfolio|Profile/i });
    this.settingsMenuItem    = this.profileDropdownMenu.getByRole('menuitem', { name: /Settings/i });
    this.logoutMenuItem      = this.profileDropdownMenu.getByRole('menuitem', { name: /Logout|Sign Out/i });

    // ── Notifications panel ──────────────────────────────────────────────
    // The panel is a fixed div with aria-free content. We scope all panel
    // locators inside it to avoid conflicts with the header bell button.
    this.notificationsPanel            = page.locator('div.fixed.top-0.right-0, dialog').filter({ hasText: 'Notifications' }).first();
    // Close button is an icon-only ✕ with no aria-label — scoped to the panel header row
    this.notificationsPanelCloseButton = this.notificationsPanel.locator('div, header').filter({ hasText: /^Notifications/ }).first().getByRole('button');
    this.markAllAsReadButton           = page.getByRole('button', { name: 'Mark all as read' });
    this.notificationItems             = this.notificationsPanel.locator('.rounded-lg.border.p-4');

    // ── Quick Access tiles ───────────────────────────────────────────────
    // The section has no id="" attribute — scoping by #quick-access fails.
    // Link accessible names include the subtitle (e.g. "Accounts Financial Management"),
    // so exact name matching also fails. Href-based locators are the most stable
    // and unambiguous option for these navigation links.
    this.idmsPortalTile     = page.locator('a[href="https://idms.intuitiveapps.com"]');
    this.hrmsTile           = page.locator('a[href="/hrms/dashboard"]');
    this.accountsTile       = page.locator('a[href="/accounts/dashboard"]');
    this.assetsTile         = page.locator('a[href="/assets/dashboard"]');
    this.resourcesTile      = page.locator('a[href="/resources/dashboard"]');
    this.deliveryTile       = page.locator('a[href="/delivery/dashboard"]');
    this.dataAndReportsTile = page.locator('a[href="/migration/dashboard"]');

    // Disabled tiles (no <a>, just <div> with cursor-not-allowed)
    this.recruitmentTile = page.locator('div').filter({ hasText: /^Recruitment$/ }).first();
    this.itSupportTile   = page.locator('div').filter({ hasText: /^IT Support$/ }).first();
    this.trainingTile    = page.locator('div').filter({ hasText: /^Training$/ }).first();
    this.salesTile       = page.locator('div').filter({ hasText: /^Sales$/ }).first();
    this.marketingTile   = page.locator('div').filter({ hasText: /^Marketing$/ }).first();

    // ── Company News ─────────────────────────────────────────────────────
    const newsSection    = page.locator('#news-rewards');
    this.companyNewsViewAllLink = newsSection.getByRole('link', { name: 'View All' }).first();
    this.newsCards              = newsSection.locator('.rounded-lg.border').first().locator('.p-3.rounded-lg');

    // ── Rewards & Recognition ────────────────────────────────────────────
    this.rewardsViewAllLink  = newsSection.getByRole('link', { name: 'View All' }).last();
    this.congratulateButtons = newsSection.getByRole('button', { name: /Congratulate/i });

    // ── Holiday Calendar ─────────────────────────────────────────────────
    this.viewFullCalendarButton = page.getByRole('button', { name: 'View Full Calendar' });

    // ── Active Poll carousel ─────────────────────────────────────────────
    const pollSection      = page.locator('#calendar-polls');
    this.pollPreviousButton = pollSection.getByRole('button').filter({ has: page.locator('.lucide-chevron-left') });
    this.pollNextButton     = pollSection.getByRole('button').filter({ has: page.locator('.lucide-chevron-right') });

    // ── Upcoming Events ──────────────────────────────────────────────────
    this.eventsViewAllLink = page.locator('#events').getByRole('link', { name: 'View All' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /** Navigate to /home and dismiss the notifications panel if open. */
  async goto(): Promise<void> {
    await this.page.goto('/home');
    // Notifications panel auto-opens on login — dismiss it so it doesn't
    // block subsequent interactions on this page.
    await PageHelper.dismissNotificationsPanel(this.page);
  }

  // ── Notifications panel ─────────────────────────────────────────────

  /** Opens the notifications panel by clicking the bell icon in the header. */
  async openNotificationsPanel(): Promise<void> {
    await this.notificationsBellButton.click();
    await this.notificationsPanel.waitFor({ state: 'visible' });
  }

  /** Closes the notifications panel using the ✕ button inside it. */
  async closeNotificationsPanel(): Promise<void> {
    await this.notificationsPanelCloseButton.click();
    await this.notificationsPanel.waitFor({ state: 'hidden' });
  }

  /** Clicks "Mark all as read" inside the notifications panel. */
  async markAllNotificationsAsRead(): Promise<void> {
    await this.markAllAsReadButton.click();
  }

  // ── Quick Access tiles (new-tab helpers) ────────────────────────────

  /**
   * Generic helper: clicks a Quick Access tile that opens a new browser tab
   * and returns the new Page object.
   */
  private async clickTileInNewTab(tile: Locator, context: BrowserContext): Promise<Page> {
    // If a push notification causes the side panel to slide open and cover the tiles, close it first
    if (await this.notificationsPanel.isVisible()) {
      await this.closeNotificationsPanel();
    }
    
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      tile.click(),
    ]);
    await newPage.waitForLoadState();
    return newPage;
  }

  async openAccountsModule(context: BrowserContext): Promise<Page> {
    const accountPage = await this.clickTileInNewTab(this.accountsTile, context);
    // The Notifications panel auto-opens on the new tab too and blocks sidebar
    // navigation buttons (e.g. Compensation, Accounts Receivable). Dismiss it.
    await PageHelper.dismissNotificationsPanel(accountPage);
    return accountPage;
  }

  async openHrmsModule(context: BrowserContext): Promise<Page> {
    const hrmsPage = await this.clickTileInNewTab(this.hrmsTile, context);
    await PageHelper.dismissNotificationsPanel(hrmsPage);
    return hrmsPage;
  }

  async openAssetsModule(context: BrowserContext): Promise<Page> {
    return this.clickTileInNewTab(this.assetsTile, context);
  }

  async openResourcesModule(context: BrowserContext): Promise<Page> {
    return this.clickTileInNewTab(this.resourcesTile, context);
  }

  async openDeliveryModule(context: BrowserContext): Promise<Page> {
    return this.clickTileInNewTab(this.deliveryTile, context);
  }

  async openDataAndReportsModule(context: BrowserContext): Promise<Page> {
    return this.clickTileInNewTab(this.dataAndReportsTile, context);
  }

  // ── Section navigation ──────────────────────────────────────────────

  async clickCompanyNewsViewAll(): Promise<void> {
    await this.companyNewsViewAllLink.click();
  }

  async clickRewardsViewAll(): Promise<void> {
    await this.rewardsViewAllLink.click();
  }

  async clickViewFullCalendar(): Promise<void> {
    await this.viewFullCalendarButton.click();
  }

  async clickEventsViewAll(): Promise<void> {
    await this.eventsViewAllLink.click();
  }

  // ── Poll carousel ───────────────────────────────────────────────────

  async clickPollNext(): Promise<void> {
    await this.pollNextButton.click();
  }

  async clickPollPrevious(): Promise<void> {
    await this.pollPreviousButton.click();
  }

  // ── iDMS Portal ─────────────────────────────────────────────────────

  /**
   * Clicks the iDMS Portal tile.
   * iDMS is an external URL (idms.intuitiveapps.com) so it opens in a new tab
   * like the other module tiles.
   */
  async openIdmsPortal(context: BrowserContext): Promise<Page> {
    return this.clickTileInNewTab(this.idmsPortalTile, context);
  }

  // ── Notification helpers ─────────────────────────────────────────────

  /**
   * Reads the notification count badge from the bell icon.
   * Returns the number shown (e.g. 93), or 0 if the badge is not visible.
   */
  async getNotificationCount(): Promise<number> {
    const isVisible = await this.notificationCountBadge.isVisible();
    if (!isVisible) return 0;
    const text = await this.notificationCountBadge.textContent();
    return parseInt(text?.trim() ?? '0', 10);
  }

  /**
   * Clicks a specific notification item inside the panel by its title text.
   * Opens the panel first if it is not already visible.
   *
   * @param title - Exact notification title, e.g. "Pre-Onboarding: Form submitted"
   */
  async clickNotificationByTitle(title: string): Promise<void> {
    if (!await this.notificationsPanel.isVisible()) {
      await this.openNotificationsPanel();
    }
    await this.notificationsPanel
      .locator(`p[title="${title}"]`)
      .first()
      .click();
  }

  // ── Rewards helpers ──────────────────────────────────────────────────

  /**
   * Clicks the "🎉 Congratulate" button for a specific award identified by its title.
   *
   * @param awardTitle - The award heading text, e.g. "🎉Yayyy... IT Team did it!🎉"
   */
  async clickCongratulateByTitle(awardTitle: string): Promise<void> {
    await this.page
      .locator('#news-rewards')
      .locator('.rounded-lg')
      .filter({ has: this.page.locator(`span:text-is("${awardTitle}")`) })
      .getByRole('button', { name: /Congratulate/i })
      .click();
  }

  // ── User profile dropdown ────────────────────────────────────────────

  /** Opens the user profile dropdown by clicking the avatar button. */
  async openProfileDropdown(): Promise<void> {
    // If a push notification causes the side panel to slide open, it covers the right side of the header
    if (await this.notificationsPanel.isVisible()) {
      await this.closeNotificationsPanel();
    }
    await this.userProfileButton.click();
    await this.profileDropdownMenu.waitFor({ state: 'visible' });
  }

  /** Logs out: opens the profile dropdown and clicks the Logout/Sign Out item. */
  async logout(): Promise<void> {
    await this.openProfileDropdown();
    await this.logoutMenuItem.click();
  }

  /** Opens the profile dropdown and navigates to the Profile page. */
  async goToProfile(): Promise<void> {
    await this.openProfileDropdown();
    await this.profileMenuItem.click();
  }

  /** Opens the profile dropdown and navigates to Settings. */
  async goToSettings(): Promise<void> {
    await this.openProfileDropdown();
    await this.settingsMenuItem.click();
  }
}
