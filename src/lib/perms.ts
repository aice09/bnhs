// Pure helpers (safe for client and server) describing roles and permissions.
export const ADMIN_PERMS: [string, string][] = [
  ['posts', 'News & announcements (approve, highlight)'],
  ['pages', 'Pages (history, about, philosophy…)'],
  ['sections', 'Page sections (facts, library, athletics…)'],
  ['programs', 'Academic programs'],
  ['staff', 'Faculty & staff'],
  ['downloads', 'Downloads & links'],
  ['messages', 'Contact messages'],
  ['groups', 'Groups, organizations & research centers'],
  ['users', 'Users, alumni approval & permissions'],
  ['appearance', 'Appearance (logo & colors)'],
  ['settings', 'Site settings'],
  ['backups', 'Backups & storage'],
];

export const GROUP_PERMS: [string, string][] = [
  ['post', 'Write news for the group'],
  ['publish', 'Publish group news without review'],
  ['edit', 'Edit the group page'],
  ['items', 'Manage events, projects & resources'],
  ['members', 'Manage members'],
];

export const GROUP_ROLES: Record<string, string[]> = {
  manager: ['post', 'publish', 'edit', 'items', 'members'],
  editor: ['post', 'items'],
  member: [],
};

export const ACCOUNT_ROLES: [string, string][] = [
  ['admin', 'Administrator (full access)'],
  ['staff', 'Staff (CMS access by permission)'],
  ['student', 'Student'],
  ['alumni', 'Alumni'],
  ['researcher', 'Research center member'],
  ['member', 'Other member'],
];

export const GROUP_TYPES = [
  'Student Organization', 'Academic Club', 'Arts & Culture', 'Community Service', 'Publication', 'Sports Team', 'Research Center', 'Other', 'Office',
];

// Offices are the school departments. Each has managers; teams, centers and clubs belong to an office.
export const DEPTS: Record<string, { name: string; childLabel: string; childType: string }> = {
  research: { name: 'Research & Innovation', childLabel: 'research center', childType: 'Research Center' },
  athletics: { name: 'Athletics', childLabel: 'sports team', childType: 'Sports Team' },
  'student-groups': { name: 'Student Groups', childLabel: 'student group', childType: 'Student Organization' },
  sgo: { name: 'Student Government', childLabel: '', childType: '' },
  publication: { name: 'Campus Publication', childLabel: '', childType: '' },
  alumni: { name: 'Alumni', childLabel: '', childType: '' },
  library: { name: 'Library', childLabel: '', childType: '' },
  admission: { name: 'Admission', childLabel: '', childType: '' },
  sdg: { name: 'SDG', childLabel: '', childType: '' },
};

export type Account = { id: number; email: string; name: string; role: string; status: string; permissions: string[] };

export const isStaff = (u: Pick<Account, 'role'> | null | undefined) => !!u && (u.role === 'admin' || u.role === 'staff');
export const hasPerm = (u: Account | null | undefined, perm: string) =>
  !!u && (u.role === 'admin' || (u.role === 'staff' && u.permissions.includes(perm)));

export function groupPerms(m: { role: string; permissions: string[] } | null | undefined, autoPublish = false): Set<string> {
  if (!m) return new Set();
  const set = new Set([...(GROUP_ROLES[m.role] ?? []), ...m.permissions]);
  if (autoPublish && set.has('post')) set.add('publish');
  return set;
}
