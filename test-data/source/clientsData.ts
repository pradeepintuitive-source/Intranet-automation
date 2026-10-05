/**
 * Company master data — shared across ALL test modules.
 *
 * Source: Application → Companies screen (Type = Client, Status = Active).
 * Update this file when client records change in the application.
 *
 * Usage:
 *   import { clients, activeClientNames } from '../../test-data/source/clientsData';
 *
 *   // Use a specific client's full record
 *   const client = clients.mizuhoGlobalServices;
 *
 *   // Pick a random active client name for variability
 *   const name = faker.helpers.arrayElement(activeClientNames);
 */

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT RECORDS
// Each record mirrors the full Company Details as seen in the application.
// ─────────────────────────────────────────────────────────────────────────────

export const clients = {

  mizuhoGlobalServices: {
    // ── Company Details ──────────────────────────────────────────────────────
    id: 'MGS01',
    name: 'Mizuho Global Services',
    email: 'hrm.chennai@mizuho-cb.com',
    phone: '224 911 2523',
    type: 'Client' as const,
    isMSME: false,

    // ── Payment & Invoice ────────────────────────────────────────────────────
    paymentTerms: {
      fulltime: 'NET 30',
      contract: 'NET 30',
      general: '5',
    },
    invoiceType: 'Multiple Candidates',
    invoicePreference: 'Detailed',
    invoiceSubmission: 'Manual',

    // ── Fee Structure (%) ────────────────────────────────────────────────────
    feeStructure: {
      junior: { fulltimePct: 8.33, contractPct: 10.00 },
      midLevel: { fulltimePct: 9.00, contractPct: 10.00 },
      senior: { fulltimePct: 10.00, contractPct: 10.00 },
    },

    // ── Locations ────────────────────────────────────────────────────────────
    locations: [
      {
        label: 'Chennai, Tamil Nadu',
        address: 'Unit # 1601 - 1804, Tower B, No 5/142, SEZ IT-ITES, Rajiv Gandhi Salai OMR, Perungudi',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pinCode: '600096',
        gstin: '33AANCM3648J2Z4',
        sezStatus: 'Yes',
        gstPct: 0.00,
        pointOfContact: {
          name: 'Gayatri Guhan',
          department: 'Recruitment',
          email: 'gayatri.g@mizuho-cb.com',
          phone: '865 702 5059',
        },
      },
      {
        label: 'Navi Mumbai, Maharashtra',
        address: 'Level 11, Building-Q2, Aurum Q Parc, Thane-Belapur Road, Ghansoli',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        pinCode: '400710',
        gstin: '27AANCM3648J1ZY',
        sezStatus: 'No',
        gstPct: 18.00,
        pointOfContact: {
          name: 'Swetha Balaji',
          department: 'Human Resource',
          email: 'swetha.balaji@mizuho-gs.com',
          phone: '628 003 9685',
        },
      },
    ],

    // ── Projects ─────────────────────────────────────────────────────────────
    projects: [
      {
        name: 'Contract Staffing - MGS',
        code: 'PRJ-005',
        startDate: '2024-01-01',
        endDate: '2030-12-31',
        budget: 200000,
        status: 'Active',
      },
      {
        name: 'Recruitment - MGS',
        code: 'PRJ-002',
        startDate: '2022-10-14',
        endDate: '2030-12-31',
        budget: 1400000,
        status: 'Active',
      },
    ],
  },

  sumintomoMitsuiBankingCorporation: {
    name: 'Sumitomo Mitsui Banking Corporation',
    email: 'admin@smbc.com',
    phone: '907 845 3767',
    type: 'Client' as const,
  },

  intuitiveApps: {
    name: 'Intuitive Apps',
    email: 'info@intuitiveapps.com',
    phone: '813 069 6679',
    type: 'Client' as const,
  },

  oceanFortuneMarine: {
    name: 'Ocean Fortune Marine',
    type: 'Client' as const,
  },
};

/**
 * Flat list of active client names exactly as they appear in dropdowns.
 * Use with faker.helpers.arrayElement() for test variability.
 * Source: Companies screen — Type = Client, Status = Active.
 */
export const activeClientNames: string[] = [
  clients.mizuhoGlobalServices.name,
  clients.sumintomoMitsuiBankingCorporation.name,
  clients.intuitiveApps.name,
];

/**
 * Reusable method to format project name for dropdown selections.
 * @param project The project object containing a name and optionally a code.
 * @returns Formatted string for dropdown matching (e.g., "ProjectName (Code)" or "ProjectName")
 */
export const formatProjectDropdownValue = (project: { name: string; code?: string }): string => {
  return project.code ? `${project.name} (${project.code})` : project.name;
};
