import { APIRequestContext, expect } from '@playwright/test';

/**
 * Base API Client to handle common request configurations, headers, and error handling.
 */
export class ApiClient {
  protected request: APIRequestContext;
  protected baseUrl: string;

  constructor(request: APIRequestContext, baseUrl = process.env.BASE_URL || 'https://qa.intranet.intuitiveapps.com/') {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  /**
   * Helper to perform POST requests with common JSON headers
   */
  protected async post(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.request.post(`${this.baseUrl}${endpoint}`, {
      headers,
      data,
    });

    expect(response.ok(), `POST ${endpoint} failed with status ${response.status()}`).toBeTruthy();
    return response.json();
  }

  /**
   * Helper to perform GET requests with common JSON headers
   */
  protected async get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.request.get(`${this.baseUrl}${endpoint}`, {
      headers,
    });

    expect(response.ok(), `GET ${endpoint} failed with status ${response.status()}`).toBeTruthy();
    return response.json();
  }
}
