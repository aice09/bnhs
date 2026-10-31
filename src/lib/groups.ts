import { one, query } from './db';
import { GROUP_PERMS, groupPerms, hasPerm, type Account } from './perms';

export type Membership = {
  group_id: number; slug: string; name: string; type: string; icon: string; auto_publish: boolean;
  role: string; title: string; permissions: string[]; perms: Set<string>;
};

export async function membershipsOf(userId: number): Promise<Membership[]> {
  const rows = await query<Omit<Membership, 'perms'>>(
    `SELECT g.id AS group_id, g.slug, g.name, g.type, g.icon, g.auto_publish, m.role, m.title, m.permissions
     FROM group_members m JOIN groups g ON g.id = m.group_id WHERE m.user_id = $1 AND m.status = 'active' AND g.status = 'approved' ORDER BY g.is_office DESC, g.name`, [userId]);
  return rows.map((r) => ({ ...r, perms: groupPerms(r, r.auto_publish) }));
}

export async function membershipBySlug(userId: number, slug: string): Promise<Membership | null> {
  return (await membershipsOf(userId)).find((m) => m.slug === slug) ?? null;
}

export type Member = { user_id: number; name: string; email: string; role: string; title: string; permissions: string[]; account_role: string; leave_requested: boolean };
export const membersOf = (groupId: number) =>
  query<Member>(
    `SELECT m.user_id, u.name, u.email, m.role, m.title, m.permissions, u.role AS account_role, m.leave_requested
     FROM group_members m JOIN users u ON u.id = m.user_id WHERE m.group_id = $1 AND m.status = 'active'
     ORDER BY (m.role='manager') DESC, (m.role='coach') DESC, (m.role='leader') DESC, (m.role='editor') DESC, u.name`, [groupId]);

export async function addMember(groupId: number, email: string, role: string, title = ''): Promise<string | null> {
  const u = await one<{ id: number; status: string }>('SELECT id, status FROM users WHERE lower(email)=lower($1)', [email.trim()]);
  if (!u) return 'No account with that email. Ask the person to register first, or create the account under Users.';
  if (u.status !== 'active') return 'That account is not active yet.';
  await query(
    `INSERT INTO group_members(group_id, user_id, role, title) VALUES ($1,$2,$3,$4)
     ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, title = EXCLUDED.title, status = 'active', left_at = NULL, leave_requested = false`, [groupId, u.id, role, title]);
  await logMember(groupId, u.id, `added as ${role}`);
  return null;
}

export const saveMember = (groupId: number, userId: number, role: string, title: string, permissions: string[]) =>
  query('UPDATE group_members SET role=$3, title=$4, permissions=$5 WHERE group_id=$1 AND user_id=$2', [groupId, userId, role, title, permissions]);

// Members who leave are kept (status 'left') so their group history stays on their profile.
export async function removeMember(groupId: number, userId: number, actorId?: number, action?: string) {
  await query("UPDATE group_members SET status='left', left_at=now(), leave_requested=false WHERE group_id=$1 AND user_id=$2", [groupId, userId]);
  await logMember(groupId, userId, action ?? (actorId && actorId !== userId ? 'removed' : 'left'), actorId);
}

// Every join, leave and role change is recorded so a person's full group history is kept.
export const logMember = (groupId: number, userId: number, action: string, actorId?: number) =>
  query('INSERT INTO group_member_log(group_id,user_id,action,actor_id) VALUES($1,$2,$3,$4)', [groupId, userId, action, actorId ?? null]);

export const MEMBER_CATEGORIES = [
  { key: 'student-groups', title: 'Student Groups', icon: 'people-group', depts: ['student-groups', 'sgo', 'publication'], blurb: 'Projects, activities, SGO, subject clubs and the publication team. Each has a manager and a leader.' },
  { key: 'research', title: 'Research & Innovation Centers', icon: 'flask', depts: ['research'], blurb: 'Research and innovation centers, each with a manager and a leader.' },
  { key: 'athletics', title: 'Athletics', icon: 'medal', depts: ['athletics'], blurb: 'Choose a sport. Each sport has a manager, a coach and a team leader.' },
];

export type BrowseGroup = { id: number; slug: string; name: string; type: string; icon: string; summary: string; dept: string; people: string; my_status: string | null; my_leave: boolean; my_role: string | null };

export const browseGroups = (userId: number) =>
  query<BrowseGroup>(
    `SELECT g.id, g.slug, g.name, g.type, g.icon, g.summary, g.dept,
       (SELECT string_agg(m2.role || ': ' || u.name, ' · ' ORDER BY (m2.role='manager') DESC, (m2.role='coach') DESC, u.name)
          FROM group_members m2 JOIN users u ON u.id=m2.user_id WHERE m2.group_id=g.id AND m2.status='active' AND m2.role IN ('manager','coach','leader')) AS people,
       m.status AS my_status, COALESCE(m.leave_requested,false) AS my_leave, m.role AS my_role
     FROM groups g LEFT JOIN group_members m ON m.group_id=g.id AND m.user_id=$1
     WHERE g.status='approved' AND g.listed AND NOT g.is_office AND g.dept = ANY($2)
     ORDER BY g.type, g.sort, g.name`, [userId, MEMBER_CATEGORIES.flatMap((c) => c.depts)]);

export const memberLog = (userId: number, n = 30) =>
  query<{ action: string; created_at: string; name: string }>(
    `SELECT l.action, to_char(l.created_at,'YYYY-MM-DD HH24:MI') AS created_at, g.name FROM group_member_log l JOIN groups g ON g.id=l.group_id
     WHERE l.user_id=$1 ORDER BY l.created_at DESC, l.id DESC LIMIT ${Number(n)}`, [userId]);

export async function managerCount(groupId: number) {
  return Number((await one<{ n: string }>("SELECT count(*) n FROM group_members WHERE group_id=$1 AND role='manager' AND status='active'", [groupId]))!.n);
}

export type GroupRow = {
  id: number; slug: string; name: string; type: string; dept: string; is_office: boolean; parent_id: number | null; status: string;
  auto_publish: boolean; icon: string; image: string; summary: string;
};

// Workspace access: administrators, members, and managers of the parent office (who oversee its teams, centers and clubs).
export async function accessFor(user: Account, slug: string) {
  const group = await one<GroupRow>('SELECT * FROM groups WHERE slug=$1', [slug]);
  if (!group) return null;
  const admin = hasPerm(user, 'groups');
  const m = await one<{ role: string; permissions: string[]; title: string }>(
    "SELECT role, permissions, title FROM group_members WHERE group_id=$1 AND user_id=$2 AND status='active'", [group.id, user.id]);
  let perms = m ? groupPerms(m, group.auto_publish) : new Set<string>();
  let via: 'admin' | 'member' | 'office' | null = m ? 'member' : null;
  if (!m && group.parent_id) {
    const o = await one("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND status='active' AND role='manager'", [group.parent_id, user.id]);
    if (o) { perms = new Set(GROUP_PERMS.map(([k]) => k)); via = 'office'; }
  }
  if (admin) { perms = new Set(GROUP_PERMS.map(([k]) => k)); via = m ? 'member' : 'admin'; }
  if (!via) return null;
  return { group, perms, admin, member: m, via };
}

export async function isPublicationManager(userId: number) {
  return !!(await one("SELECT 1 FROM group_members m JOIN groups g ON g.id=m.group_id WHERE m.user_id=$1 AND m.status='active' AND m.role='manager' AND g.dept='publication' AND g.status='approved'", [userId]));
}

// Where a submitted article goes next: group manager → (SDG manager) → publication manager → published.
// Articles tagged with SDGs get an extra stop at the SDG manager (unless written by the SDG Office itself).
export async function routePost(user: Account, g: GroupRow, perms: Set<string>, sdg = ''): Promise<{ status: string; stage: string }> {
  if (hasPerm(user, 'posts') || g.auto_publish || (await isPublicationManager(user.id))) return { status: 'published', stage: '' };
  const needsSdg = !!sdg && g.dept !== 'sdg' && g.dept !== 'publication';
  if (g.dept === 'publication' || perms.has('publish')) return { status: 'pending', stage: needsSdg ? 'sdg' : 'publication' };
  return { status: 'pending', stage: 'group' };
}

export type ReviewPost = { sdg: string; id: number; title: string; excerpt: string; content: string; stage: string; slug: string; group_name: string; group_slug: string; author: string | null; published_at: string };
export async function reviewQueue(user: Account): Promise<ReviewPost[]> {
  const admin = hasPerm(user, 'posts');
  return query<ReviewPost>(
    `SELECT p.sdg, p.id, p.title, p.excerpt, p.content, p.stage, p.slug, g.name AS group_name, g.slug AS group_slug, u.name AS author, p.published_at
     FROM posts p JOIN groups g ON g.id = p.group_id LEFT JOIN users u ON u.id = p.author_id
     WHERE p.status = 'pending' AND ($2 OR
       (p.stage = 'group' AND EXISTS (SELECT 1 FROM group_members m WHERE m.user_id=$1 AND m.status='active' AND m.role='manager' AND (m.group_id = g.id OR m.group_id = g.parent_id))) OR
       (p.stage = 'sdg' AND EXISTS (SELECT 1 FROM group_members m JOIN groups sg ON sg.id = m.group_id WHERE m.user_id=$1 AND m.status='active' AND m.role='manager' AND sg.dept='sdg')) OR
       (p.stage = 'publication' AND EXISTS (SELECT 1 FROM group_members m JOIN groups pg ON pg.id = m.group_id WHERE m.user_id=$1 AND m.status='active' AND m.role='manager' AND pg.dept='publication')))
     ORDER BY p.published_at`, [user.id, admin]);
}
