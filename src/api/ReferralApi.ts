import { APIRequestContext } from '@playwright/test';
import { ApiClient } from './ApiClient';

/**
 * API methods for Referral-related operations.
 * Used to set up test data rapidly bypassing the UI.
 */
export class ReferralApi extends ApiClient {
  
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Creates a referral directly via API.
   * This should be used in test setup hooks to bypass the UI flow when testing HR approval.
   * 
   * @param candidateData The candidate payload
   * @param token Authentication token of the employee
   */
  async createReferral(candidateData: any, token: string) {
    // TODO: Update endpoint and payload structure based on actual API documentation
    const endpoint = 'api/v1/referrals';
    
    console.log(`[API Setup] Creating referral for ${candidateData.email} via API...`);
    const response = await this.post(endpoint, candidateData, token);
    
    return response;
  }
}
