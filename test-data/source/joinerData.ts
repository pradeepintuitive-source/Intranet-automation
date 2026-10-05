/**
 * Test data specific to the Add Joiner workflow.
 *
 * Client data is imported from clientsData.ts (shared across all modules).
 * Only joiner-specific reference values live here.
 *
 * For dynamic runtime values (candidate name, CTC, comments) use faker in tests.
 *
 * Usage:
 *   import { joinerData } from '../../test-data/source/joinerData';
 *   import { clients, activeClientNames } from '../../test-data/source/clientsData';
 */

import { activeClientNames, clients } from './clientsData';
import { employees } from './employeesData';
import toastMessages from '../toast/toastMessages.json';

export const joinerData = {
  /**
   * Active client names as they appear in the Client dropdown.
   * Sourced from clientsData — single source of truth for all modules.
   */
  clients: activeClientNames,

  /**
   * Valid job titles as they appear in the Title dropdown.
   */
  titles: [
    'Software Engineer',
    'Senior Software Engineer',
    'QA Engineer',
    'Product Manager',
    'HR Manager',
    'Business Analyst',
  ],

  /**
   * Margin% dropdown labels exactly as they appear in the application.
   * Derived from clientsData.mizuhoGlobalServices.feeStructure (fulltime).
   */
  margins: {
    junior: 'Junior – 8.33%',
    midLevel: 'Mid-Level – 9.00%',
    senior: 'Senior – 10.00%',
  },

  /**
   * Valid status values exactly as they appear in the Status dropdown.
   */
  statuses: ['Pending', 'Accepted', 'Joined', 'Dropped', 'Declined'] as const,

  /**
   * Pinned location for MGS Chennai (index 0).
   * Use .label to match the Location dropdown option text.
   */
  mgsChennaiLocation: clients.mizuhoGlobalServices.locations[0],

  /**
   * CTC range boundaries (INR) for faker.number.int() and boundary-value tests.
   */
  ctc: {
    min: 100000,
    max: 10000000,
    typical: 1500000,
  },

  recruiter: {
    ajith: employees.ajith.dropdownLabel,
    shalini: employees.shalini.dropdownLabel,
  },

  successMessage: toastMessages.find((msg) => msg.messageKey === 'generated_470_joiners')?.messageTemplate || 'Joiner created',
};
