import MailosaurClient from 'mailosaur';

/**
 * Utility to intercept and read emails using Mailosaur
 */
export class EmailHelper {
  private static client: MailosaurClient;

  private static getClient() {
    if (!this.client) {
      if (!process.env.MAILOSAUR_API_KEY) {
        throw new Error('MAILOSAUR_API_KEY environment variable is missing.');
      }
      this.client = new MailosaurClient(process.env.MAILOSAUR_API_KEY);
    }
    return this.client;
  }

  private static getServerId() {
    if (!process.env.MAILOSAUR_SERVER_ID) {
      throw new Error('MAILOSAUR_SERVER_ID environment variable is missing.');
    }
    return process.env.MAILOSAUR_SERVER_ID;
  }

  /**
   * Generates a unique, valid email address routing to the Mailosaur server.
   */
  static generateRandomEmail(): string {
    const serverId = this.getServerId();
    const randomString = Math.random().toString(36).substring(2, 10);
    // Format: qa-xxxxxxxx@ahrf69uu.mailosaur.net
    // Kept short to avoid app field-length truncation issues
    return `qa-${randomString}@${serverId}.mailosaur.net`;
  }

  /**
   * Polls the Mailosaur inbox for an email sent to a specific address.
   * @param email The exact email address it was sent to
   * @param timeoutMs Max time to wait for the email (default 60s)
   */
  static async waitForEmail(email: string, timeoutMs = 60000): Promise<string> {
    const client = this.getClient();
    const serverId = this.getServerId();
    
    console.log(`Waiting for email to ${email} (Timeout: ${timeoutMs}ms)`);
    
    const message = await client.messages.get(
      serverId,
      { sentTo: email },
      { timeout: timeoutMs }
    );

    // Prefer HTML body, fallback to text
    return message.html?.body || message.text?.body || '';
  }

  /**
   * Extracts a URL from the email body using a regex pattern.
   * @param emailBody The raw HTML/Text of the email
   * @param keyword Optional keyword the URL must contain
   */
  static extractLinkFromEmail(emailBody: string, keyword?: string): string {
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
    const links = emailBody.match(urlRegex);

    if (!links) {
      throw new Error('No links found in the email body.');
    }

    if (keyword) {
      const specificLink = links.find(link => link.toLowerCase().includes(keyword.toLowerCase()));
      if (!specificLink) {
        throw new Error(`Link containing "${keyword}" not found in email. Available links: ${links.join(', ')}`);
      }
      return specificLink;
    }

    return links[0];
  }
}
