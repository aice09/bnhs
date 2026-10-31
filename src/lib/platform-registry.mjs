// The School Digital Platform: 20 core systems, 10 extensions and 12 shared services.
// The website/CMS is system 01 and acts as the hub. Status is honest: live = built and usable,
// partial = a first version exists inside another module, planned = not built yet.
// Row: [no, key, name, summary, phase, status, public_url, admin_url, portal_url]

export const SUITES = [
  ['institutional', 'Institutional platform', 'building-columns'],
  ['academic', 'Academic and administration', 'graduation-cap'],
  ['student-dev', 'Student development', 'people-group'],
  ['research-external', 'Research and external relations', 'flask'],
  ['extended', 'Extended institutional services', 'puzzle-piece'],
  ['shared', 'Shared platform services', 'layer-group'],
];

export const MODULES = {
  institutional: [
    [1, 'website-cms', 'School Website and CMS', 'Public website, pages, news, events, galleries, history, vision and mission, downloads.', 1, 'live', '/', '/admin', ''],
    [2, 'admissions', 'Admissions and Applicant Management', 'Online applications, requirements, evaluation and admission decisions.', 2, 'partial', '/admissions', '', '/portal/groups/admission-office'],
    [3, 'communications', 'Digital Communications and Information', 'Announcements, newsletters, public advisories and internal communications. Email/SMS are not connected yet.', 7, 'partial', '/news', '/admin/posts', ''],
  ],
  academic: [
    [4, 'sis', 'Student Information System (SIS)', 'Learner registry, LRN, profiles, guardians and academic history.', 2, 'planned', '', '', ''],
    [5, 'enrollment', 'Enrollment and Registrar', 'Enrollment, re-enrollment, transfers, promotion and graduation eligibility.', 2, 'planned', '', '', ''],
    [6, 'curriculum', 'Academic and Curriculum Management', 'Curriculum, subjects, sections, teachers and class schedules. Academic programs are published today.', 3, 'partial', '/academics', '/admin/programs', ''],
    [7, 'grading', 'Online Grading and Assessment', 'Digital ECR, grading engine, approvals and report cards.', 3, 'planned', '', '', ''],
    [8, 'attendance', 'Attendance and Learner Monitoring', 'Daily and subject attendance, absences, lateness and reports.', 3, 'planned', '', '', ''],
    [9, 'dcms', 'Digital Credentials and Records (DCMS)', 'SF9/SF10 data, diplomas, certificates, digital signatures and QR verification.', 4, 'planned', '', '', ''],
  ],
  'student-dev': [
    [10, 'student-government', 'Student Government Management', 'SSLG officers, committees, action plans and accomplishment reports.', 5, 'partial', '/student-groups', '', '/portal/groups/student-government'],
    [11, 'elections', 'Student Election Management', 'Candidate registration, voting, canvassing and proclamation.', 5, 'planned', '', '', ''],
    [12, 'kapisanan', 'Student Clubs and Organizations (KAPISANAN)', 'Clubs, sports teams, memberships, officers, advisers; join and leave with approval.', 5, 'live', '/groups', '', '/portal/join'],
    [13, 'events', 'Student Events and Activities', 'Events, competitions, calendars, registration and accomplishment reports.', 7, 'partial', '/news', '', ''],
    [14, 'wellbeing', 'Student Wellbeing and Safeguarding', 'Guidance referrals, child protection and restricted intervention records.', 7, 'planned', '', '', ''],
    [15, 'publications', 'Student Publications and Media', 'Editorial board, writers and the approval chain before news is published.', 7, 'live', '/news', '/admin/posts', '/portal/groups/campus-publication'],
    [16, 'community', 'Community Engagement and Volunteerism', 'Outreach, volunteer registration and community projects.', 7, 'planned', '', '', ''],
  ],
  'research-external': [
    [17, 'research', 'Research and Innovation Management', 'Research centers, projects, innovation, papers and publications.', 6, 'live', '/research', '', '/portal/groups/research-office'],
    [18, 'career', 'Career Development and Professional Readiness', 'Career guidance, skills training, mentorship and industry exposure.', 6, 'planned', '', '', ''],
    [19, 'partnerships', 'Partnerships and External Relations', 'Partner showcase, applications, benefits and approval by the Partnerships Office.', 6, 'live', '/partnerships', '/admin/partnerships', '/portal/groups/partnership-office'],
    [20, 'alumni', 'Alumni and Mentorship', 'Alumni directory, stories, events and approval of alumni accounts.', 8, 'live', '/alumni', '/admin/alumni', '/portal/groups/alumni-association'],
  ],
  extended: [
    [21, 'lms', 'Learning Management System (LMS)', 'Learning materials, assignments, quizzes and learning progress.', 9, 'planned', '', '', ''],
    [22, 'finance', 'Finance and Accounting', 'Budget, collections, billing, expenses and reporting.', 9, 'planned', '', '', ''],
    [23, 'library', 'Library Management', 'Library page, services and e-resources. Catalogue circulation is not built yet.', 9, 'partial', '/library', '/admin/library', '/portal/groups/library-office'],
    [24, 'facilities', 'Facilities and Asset Management', 'Classrooms, laboratories, equipment, inventory and reservations.', 9, 'planned', '', '', ''],
    [25, 'clinic', 'School Health and Clinic', 'Clinic visits, authorized health records and referrals.', 9, 'planned', '', '', ''],
    [26, 'drrm', 'Disaster Risk Reduction and Safety', 'Drills, safety inspections and incident reports.', 9, 'planned', '', '', ''],
    [27, 'sustainability', 'Environment and Sustainability', 'Waste management, campus gardening and sustainability reports. SDG projects are published today.', 9, 'partial', '/sdg', '/admin/sdg', '/portal/groups/sdg-office'],
    [28, 'research-centers', 'School Research Centers Management', 'Center governance, facilities, projects, personnel and performance.', 9, 'live', '/research', '', '/portal/groups/research-office'],
    [29, 'scholarship', 'Scholarship and Student Assistance', 'Scholarship page and partner-funded assistance. Applications and renewals are not built yet.', 9, 'partial', '/scholarships', '/admin/scholarships', ''],
    [30, 'analytics', 'School Analytics and Institutional Reporting', 'Enrollment, performance, attendance and institutional KPIs.', 10, 'planned', '', '', ''],
  ],
  shared: [
    [31, 'iam', 'Identity and Access Management', 'One account for staff, students, alumni, coaches and partners with role-based access. Keycloak/OIDC single sign-on is planned.', 1, 'partial', '', '/admin/users', '/portal/login'],
    [32, 'learner-registry', 'Central Learner Registry', 'LRN and one learner identity shared by every system.', 2, 'planned', '', '', ''],
    [33, 'workflow', 'Workflow Engine', 'Approvals and routing: news chain, join and leave requests, partner and admission requests.', 1, 'partial', '', '', '/portal/review'],
    [34, 'documents', 'Document Management', 'File storage with local disk or S3. Versioning is not built yet.', 1, 'partial', '', '/admin/downloads', ''],
    [35, 'notifications', 'Notification Service', 'Email, SMS and in-app alerts. Contact messages are collected today.', 7, 'planned', '', '/admin/messages', ''],
    [36, 'signatures', 'Digital Signature Service', 'CA/PNPKI PDF signing for official documents.', 4, 'planned', '', '', ''],
    [37, 'audit', 'Audit and Compliance', 'Event history of who changed what. Records are append-only.', 1, 'live', '', '/admin/platform/audit', ''],
    [38, 'reporting', 'Reporting Engine', 'PDF, Excel and analytics exports.', 10, 'planned', '', '', ''],
    [39, 'integration', 'Integration Gateway', 'DepEd imports and exports.', 10, 'planned', '', '', ''],
    [40, 'api', 'API Gateway', 'Central API access for all modules.', 10, 'planned', '', '', ''],
    [41, 'search', 'Search Service', 'School-wide search.', 10, 'partial', '/news', '', ''],
    [42, 'backup', 'Backup and Recovery', 'Database and file backups with download and restore.', 1, 'live', '', '/admin/backups', ''],
  ],
};
