/**
 * formOptions.js
 *
 * Phase 4: the ACTUAL onboarding data model - real roles, managers,
 * job titles, departments, teams, and the platform-by-role mapping
 * that drives Step 3's auto-populated platform checklist. This is
 * deliberately separate from src/mockData.js's older option lists
 * (ROLE_OPTIONS, MOCK_JOB_TITLES, MANAGER_OPTIONS, ...), which are a
 * different, smaller taxonomy still used by TransitionForm/
 * ReactivationForm - the two are unrelated and both stay in place.
 */

/** Onboarding Step 1: where the employee works. */
export const WORKING_LOCATIONS = ['Onshore (US)', 'Offshore (Outside US)', 'N/A'];

/** Onboarding Step 2: employment classification. */
export const EMPLOYEE_TYPES = ['Internal', 'External', 'BPO', 'N/A'];

/** Onboarding Step 2: department. */
export const DEPARTMENTS = [
  'Client Success',
  'Sales',
  'Information Technology',
  'Quality Assurance',
  'Training and Development',
  'Finance',
  'Human Resource',
  'Marketing',
  'Leadership',
  'N/A',
];

/** Onboarding Step 2: team. */
export const TEAMS = ['P6', 'Z3', 'H5', 'N1', 'W1', 'X1', 'T1', 'V1', 'F8', 'CC1', 'CC2', 'G1', 'M2', 'CS IH', 'N/A'];

/**
 * Onboarding Step 2: the 31 actual managers this app currently
 * onboards employees under.
 */
export const MANAGERS = [
  'Melissa Kane',
  'Victoria Hatfield',
  'Joel Brough',
  'Haig Papaghanian',
  'McNeil Tayag',
  'Adam Karaali',
  'Albina Hoti',
  'MJ Jhala',
  'Ciara Castillo',
  'Tavier Nkongo',
  'Aaron McNally',
  'Stephen Luthy',
  'Christopher Hallmeyer',
  'Matt Grant',
  'Zack Staniskovski',
  'Richard Horne',
  'Ronnie Kumar',
  'Alfred Dabu',
  'Cameron Ball',
  'Andrea Lasso',
  'Joy Carrera',
  'Matthew Walker',
  'Latu Patetef',
  'Sahar Waris',
  'Steven Mcpherson',
  'Craig Lannak',
  'Trent Garner',
  'Christopher Andrus',
  'James Gambino',
  'Kamaiya Fleming',
  'Cyril Cambronero',
  'N/A',
];

/**
 * Onboarding Step 2: the 38 actual role codes. Selecting one drives
 * Step 3's auto-populated platform checklist via ROLE_PLATFORM_MAPPING
 * below. Prefix convention: IH = in-house, Ext = external/contractor,
 * BPO = business process outsourcing.
 */
export const ROLES = [
  'IH.SalesAgent',
  'IH.CSAgent',
  'IH.Executive',
  'IH.HRManager',
  'IH.HRPayroll',
  'IH.HRRecruiter',
  'IH.ITDeveloper',
  'IH.CSHelpdesk',
  'IH.SalesProcessAdmin',
  'IH.ITProjectManager',
  'IH.ITDialer',
  'IH.MktAnalyst',
  'IH.ProcessingAgent',
  'IH.CSProcessAdmin',
  'IH.FinanceAnalyst',
  'IH.CSQA',
  'IH.QAAgent',
  'IH.QAAnalyst',
  'IH.QAProcessAdmin',
  'IH.CSTrainer',
  'IH.QAContentModerator',
  'IH.QATrainer',
  'IH.SalesHelpdesk',
  'IH.SalesManager',
  'Ext.ITDeveloper',
  'Ext.ITConsultant',
  'Ext.MktConsultant',
  'IH.ITSalesforce',
  'IH.ITSecurity',
  'IH.ITSupport',
  'BPO.SalesAgent',
  'BPO.CSAgent',
  'BPO.Executive',
  'BPO.SalesSupervisor',
  'BPO.SalesQA',
  'BPO.ITManager',
  'BPO.SalesManager',
  'BPO.SalesTrainer',
  'N/A',
];

/**
 * Onboarding Step 2: the 150+ actual job titles.
 */
export const JOB_TITLES = [
  'Account Executive',
  'Adhoc Support',
  'Agent',
  'Assistant Controller',
  'Assistant IT Developer',
  'AWS Architect',
  'CEO',
  'CEO & Founder',
  'Chief Business Development Officer',
  'Chief Compliance Officer',
  'Chief Information Officer',
  'Chief Marketing Officer',
  'Chief Operations Officer',
  'Client Success Representative',
  'Consultant',
  'Content Moderator',
  'CS: Collection Representative',
  'CS: Help Desk Agent',
  'CS: Helpdesk Team Lead',
  'CS: Performance Manager',
  'CS: Process Administrator',
  'CS: Resolution Representative',
  'CS: Senior Agent',
  'CS: T3 Representative',
  'CS: Team Lead',
  'CTO',
  'CTO & Co-Founder',
  'Data Analyst',
  'Data Analyst Consultant',
  'Data Analytics Consultant',
  'Data Engineer',
  'Developer',
  'Dialer Administrator I',
  'Digital Marketing Specialist',
  'Director of Business Development',
  'Director of Business Intelligence & Quality',
  'Director of Client Success and Training & Development',
  'Director of Human Resources',
  'Director of Product',
  'Director of Quality Assurance',
  'Director of Sales',
  'Dreamcyber Developer',
  'Email Marketing',
  'Enterprise Customer Success Team Lead',
  'EVP of Global Staffing and RPO',
  'Executive Assistant',
  'Expert API Development Consultant/Tech Writer',
  'Finance Administrator',
  'Finance & Payroll Administrator',
  'Finance Manager',
  'Finance Officer',
  'Financial Analyst',
  'Financial Rep.',
  'Fintech Web Designer',
  'Group Attorney',
  'Head of Analytics',
  'Head of IT',
  'HR Recruiter',
  'HR Specialist',
  'Human Resources',
  'InHouse Trainer',
  'Integration / Automation Expert Developer',
  'Integration Account',
  'IT Business Analyst',
  'IT Consultant',
  'IT Director',
  'IT Manager',
  'IT Operations Lead & Governance',
  'IT Support',
  'IT Supervisor',
  'Jira Consultant',
  'Junior IT Support Engineer',
  'Mailbox',
  'Manager of Growth Marketing',
  'Marketing',
  'Marketing and Sales Leader',
  'Marketing Development',
  'Marketing Specialist',
  'Moodle Consultant',
  'NA',
  'NowBPO General Manager',
  'Operations Agent',
  'Operations Manager',
  'Paypros Representative',
  'Paypros Support',
  'President Consultant',
  'Processing Manager',
  'Processor',
  'Project Manager',
  'Prosper247 Support',
  'QA',
  'QA Manager',
  'QA Specialist',
  'QA Team Lead',
  'Recruitment Manager',
  'Sales Account Executive',
  'Sales Agent',
  'Sales Jr. Ops Lead',
  'Sales Manager',
  'Sales Operations Lead',
  'Sales Process Admin',
  'Sales Process Administrator',
  'Sales Team Lead',
  'Salesforce Administrator',
  'Salesforce Assistant',
  'Salesforce Developer',
  'Senior Floor Supervisor',
  'Senior Salesforce Developer',
  'Senior Security Engineer',
  'Senior Software Engineer',
  'Sr. Salesforce Technical Architect',
  'SR Human Resources Generalist',
  'Staff Technical Lead Manager',
  'Supervisor',
  'Systems Admin & Project Manager',
  'TCP Academy',
  'TD: Sales Trainer',
  'TD: Service Trainer',
  'TD: Training Coordinator',
  'TD: Training Process Administrator',
  'Technology Leader',
  'Trainer',
  'Two Roads Advisors',
  'UX/UI Designer',
  'V.P. of Merchant Relations',
  'Web Marketing Analytics',
  'Zoho Solution Architect',
  'N/A',
];

/**
 * Onboarding Step 3: the 18 actual platforms this app provisions.
 * Distinct from mockData.js's PLATFORMS (the older 10-platform list
 * offboarding still uses) - see routes/platforms.js's own comment on
 * the backend side for why the two aren't reconciled yet.
 */
export const PLATFORMS = [
  'MS Azure',
  'Atera',
  'Bitdefender',
  'DRATA',
  'StaffCounter',
  'Krisp',
  'Keeper',
  'Observe.ai',
  'Jira',
  'Confluence',
  'Hodu',
  'Salesforce',
  'Zoho',
  'Acuity',
  'Portal',
  'AWS',
  'GitHub',
  'Salesforce Admin',
  'TCP Academy',
];

/**
 * The default platform set for each of the 38 roles - applied to
 * Step 3 the instant a role is selected in Step 2 (PlatformSelector
 * reads this). Not present for 'N/A' - selecting it clears all
 * platforms instead (see PlatformSelector's own N/A handling).
 */
export const ROLE_PLATFORM_MAPPING = {
  // IH (in-house) roles
  'IH.SalesAgent': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Krisp', 'Keeper', 'Observe.ai', 'Jira', 'Confluence', 'Hodu', 'Salesforce'],
  'IH.CSAgent': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Krisp', 'Keeper', 'Zoho', 'Acuity', 'Observe.ai', 'Portal', 'Hodu', 'Salesforce', 'Confluence', 'Jira'],
  'IH.Executive': ['MS Azure', 'Atera', 'Bitdefender', 'Keeper', 'Jira'],
  'IH.HRManager': ['MS Azure', 'Atera', 'Bitdefender', 'Keeper', 'Jira'],
  'IH.HRPayroll': ['MS Azure', 'Atera', 'Bitdefender', 'Keeper', 'Jira'],
  'IH.HRRecruiter': ['MS Azure', 'Atera', 'Bitdefender', 'Keeper', 'Jira'],
  'IH.ITDeveloper': ['MS Azure', 'Atera', 'Bitdefender', 'Keeper', 'StaffCounter', 'AWS', 'GitHub', 'Jira'],
  'IH.CSHelpdesk': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.SalesProcessAdmin': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.ITProjectManager': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.ITDialer': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Hodu', 'Jira'],
  'IH.MktAnalyst': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.ProcessingAgent': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.CSProcessAdmin': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.FinanceAnalyst': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.CSQA': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.QAAgent': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.QAAnalyst': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.QAProcessAdmin': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.CSTrainer': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.QAContentModerator': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.QATrainer': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.SalesHelpdesk': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.SalesManager': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.ITSalesforce': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Salesforce Admin', 'Jira'],
  'IH.ITSecurity': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],
  'IH.ITSupport': ['MS Azure', 'Atera', 'Bitdefender', 'StaffCounter', 'Keeper', 'Jira'],

  // Ext (external/contractor) roles
  'Ext.ITDeveloper': ['MS Azure', 'Keeper', 'AWS', 'GitHub', 'Jira'],
  'Ext.ITConsultant': ['MS Azure', 'Keeper', 'AWS', 'GitHub', 'Jira'],
  'Ext.MktConsultant': ['MS Azure', 'Jira'],

  // BPO (business process outsourcing) roles
  'BPO.SalesAgent': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Krisp', 'Confluence', 'TCP Academy', 'Hodu', 'Salesforce', 'Observe.ai'],
  'BPO.CSAgent': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Krisp', 'Confluence', 'TCP Academy', 'Hodu', 'Salesforce', 'Portal', 'Observe.ai'],
  'BPO.Executive': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Confluence', 'TCP Academy', 'Salesforce'],
  'BPO.SalesSupervisor': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Confluence', 'TCP Academy', 'Salesforce'],
  'BPO.SalesQA': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Confluence', 'TCP Academy', 'Salesforce'],
  'BPO.ITManager': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Confluence', 'TCP Academy', 'Salesforce'],
  'BPO.SalesManager': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Confluence', 'TCP Academy', 'Salesforce'],
  'BPO.SalesTrainer': ['MS Azure', 'Atera', 'StaffCounter', 'Keeper', 'Confluence', 'TCP Academy', 'Salesforce'],
};

/**
 * Onboarding Step 1: full country list. Not enumerated in the Phase 4
 * spec ("use full list") - this is a standard ~195-country English
 * name list, plus N/A.
 */
export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', "Côte d'Ivoire", 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Congo-Brazzaville)',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia (Czech Republic)',
  'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini (Swaziland)', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala',
  'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Holy See', 'Honduras', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar (Burma)', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine State', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'N/A',
];

const formOptions = {
  WORKING_LOCATIONS,
  EMPLOYEE_TYPES,
  DEPARTMENTS,
  TEAMS,
  MANAGERS,
  ROLES,
  JOB_TITLES,
  PLATFORMS,
  ROLE_PLATFORM_MAPPING,
  COUNTRIES,
};

export default formOptions;
