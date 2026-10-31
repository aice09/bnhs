'use server';

import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { invalidateCache, rateLimit } from '@/lib/cache';
import { normTags, slugify } from '@/lib/content';
import { normSdg } from '@/lib/sdg';
import { PARTNER_INTERESTS, PARTNER_TYPES } from '@/lib/partners';
import { one, query } from '@/lib/db';
import { accessFor, addMember, logMember, managerCount, removeMember, reviewQueue, routePost, saveMember } from '@/lib/groups';
import { DEPTS, GROUP_PERMS, GROUP_ROLES, hasPerm } from '@/lib/perms';
import { groupBlocks } from '@/lib/sections';

type Form = { error?: string; ok?: boolean; n?: number; v?: Record<string, string> };
const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? '').trim().slice(0, max);

export async function register(_: unknown, fd: FormData): Promise<Form> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!(await rateLimit('register:' + ip, 5, 3600))) return { error: 'Too many sign-ups from this address. Try again later.' };
  const v = { name: str(fd, 'name', 120), email: str(fd, 'email', 200).toLowerCase(), role: str(fd, 'role', 20), grad_year: str(fd, 'grad_year', 4) };
  const fail = (error: string): Form => ({ error, v, n: Date.now() });
  if (!v.name || !/^\S+@\S+\.\S+$/.test(v.email)) return fail('Enter your name and a valid email address.');
  if (!['alumni', 'student'].includes(v.role)) return fail('Choose alumni or student.');
  const pw = String(fd.get('password') || '');
  if (pw.length < 10) return fail('Use a password of at least 10 characters.');
  if (await one('SELECT 1 FROM users WHERE lower(email)=$1', [v.email])) return fail('An account with that email already exists. Try signing in.');
  const u = await one<{ id: number }>(
    "INSERT INTO users(email,name,role,status,password_hash,note) VALUES($1,$2,$3,'pending',$4,$5) RETURNING id",
    [v.email, v.name, v.role, await bcrypt.hash(pw, 12), str(fd, 'note', 300)]);
  if (v.role === 'alumni')
    await query('INSERT INTO alumni_profiles(user_id, grad_year) VALUES($1,$2)', [u!.id, Number(v.grad_year) || null]);
  return { ok: true };
}

export async function saveAlumniProfile(_: unknown, fd: FormData): Promise<Form> {
  const u = await requireUser();
  if (u.role !== 'alumni') return { error: 'Only alumni accounts have an alumni profile.' };
  const linkedin = str(fd, 'linkedin', 300);
  if (linkedin && !/^https:\/\//.test(linkedin)) return { error: 'LinkedIn link must start with https://' };
  await query(
    `INSERT INTO alumni_profiles(user_id,grad_year,program,occupation,employer,location,bio,photo,linkedin,contact_email,show_contact,listed)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (user_id) DO UPDATE SET grad_year=EXCLUDED.grad_year, program=EXCLUDED.program, occupation=EXCLUDED.occupation,
       employer=EXCLUDED.employer, location=EXCLUDED.location, bio=EXCLUDED.bio, photo=EXCLUDED.photo, linkedin=EXCLUDED.linkedin,
       contact_email=EXCLUDED.contact_email, show_contact=EXCLUDED.show_contact, listed=EXCLUDED.listed, updated_at=now()`,
    [u.id, Number(str(fd, 'grad_year', 4)) || null, str(fd, 'program', 120), str(fd, 'occupation', 120), str(fd, 'employer', 120),
      str(fd, 'location', 120), str(fd, 'bio', 1500), str(fd, 'photo', 300), linkedin, str(fd, 'contact_email', 200),
      fd.get('show_contact') === 'on', fd.get('listed') === 'on']);
  await invalidateCache();
  return { ok: true, n: Date.now() };
}

// ---- Groups ----
async function access(slug: string) {
  const user = await requireUser();
  const a = await accessFor(user, slug);
  if (!a) redirect('/portal');
  return { user, group: a.group, perms: a.perms, admin: a.admin };
}

const back = (slug: string, msg = 'saved') => redirect(`/portal/groups/${slug}?${msg}=1`);

export async function saveGroupPage(slug: string, fd: FormData) {
  const { group, perms } = await access(slug);
  if (!perms.has('edit')) redirect(`/portal/groups/${slug}?denied=1`);
  const image = str(fd, 'image', 300);
  await query('UPDATE groups SET summary=$2, description=$3, private_content=$4, contact=$5, adviser=$6, info=$7, image=$8 WHERE id=$1',
    [group.id, str(fd, 'summary', 300), str(fd, 'description', 20000), str(fd, 'private_content', 20000), str(fd, 'contact', 200), str(fd, 'adviser', 120),
      str(fd, 'info', 10000), /^(\/|https:\/\/)/.test(image) ? image : '']);
  await invalidateCache();
  back(slug);
}

export async function addGroupItem(slug: string, fd: FormData) {
  const { group, perms } = await access(slug);
  if (!perms.has('items')) redirect(`/portal/groups/${slug}?denied=1`);
  const title = str(fd, 'title', 200);
  if (title)
    await query('INSERT INTO group_items(group_id,kind,title,meta,description,url,members_only) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [group.id, str(fd, 'kind', 40) || 'Event', title, str(fd, 'meta', 120), str(fd, 'description', 2000), /^(https?:\/\/|\/)/.test(str(fd, 'url')) ? str(fd, 'url') : '', fd.get('members_only') === 'on']);
  await invalidateCache();
  back(slug);
}

export async function deleteGroupItem(slug: string, id: number) {
  const { group, perms } = await access(slug);
  if (!perms.has('items')) redirect(`/portal/groups/${slug}?denied=1`);
  await query('DELETE FROM group_items WHERE id=$1 AND group_id=$2', [id, group.id]);
  await invalidateCache();
  back(slug);
}

// Entries (projects, facilities, achievements…) show on the group page and on the school-wide page.
export async function saveGroupEntry(slug: string, id: string, fd: FormData) {
  const { group, perms } = await access(slug);
  if (!perms.has('items')) redirect(`/portal/groups/${slug}?denied=1`);
  const target = groupBlocks(group.type, group.dept, group.is_office).find((x) => `${x.section}/${x.block.key}` === str(fd, 'target', 80));
  const title = str(fd, 'title', 200);
  if (!target || !title) redirect(`/portal/groups/${slug}?error=${encodeURIComponent('Choose where the entry appears and give it a title.')}#entries`);
  const url = str(fd, 'url', 400), image = str(fd, 'image', 300);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(fd, 'event_date', 10)) ? str(fd, 'event_date', 10) : null;
  const v = [target.section, target.block.key, title, str(fd, 'meta', 120), str(fd, 'category', 80), str(fd, 'extra', 160), str(fd, 'description', 2000),
    /^(\/|https:\/\/)/.test(image) ? image : '', /^(https?:\/\/|\/)/.test(url) ? url : '', date, normTags(str(fd, 'tags', 200)), fd.get('featured') === 'on' && perms.has('publish'), normSdg(str(fd, 'sdg', 60))];
  let itemId = Number(id);
  if (id === 'new')
    itemId = (await one<{ id: number }>(`INSERT INTO items(section,block,title,meta,category,extra,description,image,url,event_date,tags,featured,sdg,group_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`, [...v, group.id]))!.id;
  else
    await query(`UPDATE items SET section=$1,block=$2,title=$3,meta=$4,category=$5,extra=$6,description=$7,image=$8,url=$9,event_date=$10,tags=$11,featured=$12,sdg=$13 WHERE id=$15 AND group_id=$14`, [...v, group.id, itemId]);
  // credit members so the item shows on their profiles
  const emails = str(fd, 'credit', 600).split(/[,\s;]+/).filter((e) => /^\S+@\S+$/.test(e)).map((e) => e.toLowerCase());
  if (id !== 'new' || emails.length) {
    await query('DELETE FROM item_people WHERE item_id=$1', [itemId]);
    if (emails.length) await query('INSERT INTO item_people(item_id,user_id) SELECT $1, id FROM users WHERE lower(email) = ANY($2) ON CONFLICT DO NOTHING', [itemId, emails]);
  }
  await invalidateCache();
  back(slug);
}

export async function deleteGroupEntry(slug: string, id: number) {
  const { group, perms } = await access(slug);
  if (!perms.has('items')) redirect(`/portal/groups/${slug}?denied=1`);
  await query('DELETE FROM items WHERE id=$1 AND group_id=$2', [id, group.id]);
  await invalidateCache();
  back(slug);
}

export async function addGroupMember(slug: string, fd: FormData) {
  const { group, perms } = await access(slug);
  if (!perms.has('members')) redirect(`/portal/groups/${slug}?denied=1`);
  // Leaders and coaches can invite members; only managers assign roles.
  const role = perms.has('roles') ? str(fd, 'role', 20) : 'member';
  const err = Object.keys(GROUP_ROLES).includes(role) ? await addMember(group.id, str(fd, 'email', 200), role, str(fd, 'title', 80)) : 'Bad role';
  if (err) redirect(`/portal/groups/${slug}?error=${encodeURIComponent(err)}#members`);
  back(slug);
}

export async function updateGroupMember(slug: string, userId: number, fd: FormData) {
  const { user, group, perms } = await access(slug);
  if (!perms.has('roles')) redirect(`/portal/groups/${slug}?denied=1`);
  const role = str(fd, 'role', 20);
  if (!Object.keys(GROUP_ROLES).includes(role)) redirect(`/portal/groups/${slug}`);
  const extra = GROUP_PERMS.map(([k]) => k).filter((k) => fd.get('perm_' + k) === 'on' && !GROUP_ROLES[role].includes(k));
  const cur = await one<{ role: string }>('SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2', [group.id, userId]);
  if (cur?.role === 'manager' && role !== 'manager' && (await managerCount(group.id)) <= 1)
    redirect(`/portal/groups/${slug}?error=${encodeURIComponent('A group needs at least one manager.')}#members`);
  await saveMember(group.id, userId, role, str(fd, 'title', 80), extra);
  if (cur && cur.role !== role) await logMember(group.id, userId, `role changed to ${role}`, user.id);
  back(slug);
}

export async function removeGroupMember(slug: string, userId: number) {
  const { user, group, perms } = await access(slug);
  if (!perms.has('members')) redirect(`/portal/groups/${slug}?denied=1`);
  const cur = await one<{ role: string }>('SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2', [group.id, userId]);
  if (cur && cur.role !== 'member' && !perms.has('roles')) redirect(`/portal/groups/${slug}?denied=1`);
  if (cur?.role === 'manager' && (await managerCount(group.id)) <= 1)
    redirect(`/portal/groups/${slug}?error=${encodeURIComponent('A group needs at least one manager.')}#members`);
  await removeMember(group.id, userId, user.id);
  back(slug);
}

// ---- Group news ----
export async function saveGroupPost(slug: string, id: string, fd: FormData) {
  const { user, group, perms, admin } = await access(slug);
  if (!perms.has('post')) redirect(`/portal/groups/${slug}?denied=1`);
  const title = str(fd, 'title', 200);
  const content = str(fd, 'content', 40000);
  if (!title || !content) redirect(`/portal/groups/${slug}/posts/${id}?error=${encodeURIComponent('Title and content are required.')}`);
  const excerpt = str(fd, 'excerpt', 300) || content.replace(/[#*_>`\[\]()!-]/g, '').slice(0, 150);
  const category = ['News', 'Announcement', 'Events', 'Achievements', 'Research', 'Athletics', 'Alumni', 'Impact'].includes(str(fd, 'category')) ? str(fd, 'category') : 'News';
  const tags = normTags(str(fd, 'tags', 200));
  const sdg = normSdg(str(fd, 'sdg', 60));
  const image = /^(\/uploads\/|https:\/\/)/.test(str(fd, 'image', 300)) ? str(fd, 'image', 300) : '';
  const wantsPublish = fd.get('submit') === 'publish';
  const route = wantsPublish ? await routePost(user, group, perms, sdg) : { status: 'draft', stage: '' };
  const status = route.status;
  const published = status === 'published';

  if (id === 'new') {
    const base = slugify(title);
    let s = base, n = 2;
    while (await one('SELECT 1 FROM posts WHERE slug=$1', [s])) s = `${base}-${n++}`;
    await query(
      `INSERT INTO posts(slug,title,category,excerpt,content,image,tags,group_id,author_id,status,published,published_at,placement,stage,sdg)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),'Normal',$12,$13)`,
      [s, title, category, excerpt, content, image, tags, group.id, user.id, status, published, route.stage, sdg]);
  } else {
    const row = await one<{ author_id: number | null; status: string }>('SELECT author_id, status FROM posts WHERE id=$1 AND group_id=$2', [Number(id), group.id]);
    if (!row) redirect(`/portal/groups/${slug}`);
    // authors edit their own work; managers/admins edit anything in the group
    if (row.author_id !== user.id && !perms.has('publish') && !admin) redirect(`/portal/groups/${slug}?denied=1`);
    // edits to live articles go back through the approval chain unless the editor can publish
    const next = row.status === 'published' && status === 'draft' ? await routePost(user, group, perms, sdg) : route;
    await query(
      `UPDATE posts SET title=$2,category=$3,excerpt=$4,content=$5,image=$6,tags=$7,status=$8,published=$9,stage=$10,sdg=$11,review_note='' WHERE id=$1`,
      [Number(id), title, category, excerpt, content, image, tags, next.status, next.status === 'published', next.stage, sdg]);
  }
  await invalidateCache();
  back(slug, status === 'pending' ? 'submitted' : 'saved');
}

export async function deleteGroupPost(slug: string, id: number) {
  const { user, group, perms, admin } = await access(slug);
  const row = await one<{ author_id: number | null }>('SELECT author_id FROM posts WHERE id=$1 AND group_id=$2', [id, group.id]);
  if (row && (row.author_id === user.id || perms.has('publish') || admin)) {
    await query('DELETE FROM posts WHERE id=$1', [id]);
    await invalidateCache();
  }
  back(slug);
}

// ---- Approval chain: author → group manager → publication manager → published ----
export async function reviewPost(id: number, fd: FormData) {
  const user = await requireUser();
  const queue = await reviewQueue(user);
  const post = queue.find((p) => p.id === id);
  if (!post) redirect('/portal/review?denied=1');
  const note = str(fd, 'note', 300);
  if (fd.get('decision') === 'reject') {
    await query("UPDATE posts SET status='rejected', published=false, review_note=$2 WHERE id=$1", [id, note || 'Returned by reviewer']);
  } else if (post.stage === 'group' && !hasPerm(user, 'posts')) {
    const gd = await one<{ dept: string }>('SELECT g.dept FROM posts p JOIN groups g ON g.id=p.group_id WHERE p.id=$1', [id]);
    const next = post.sdg && gd?.dept !== 'sdg' ? 'sdg' : 'publication';
    await query('UPDATE posts SET stage=$2, review_note=$3 WHERE id=$1', [id, next, '']);
  } else if (post.stage === 'sdg' && !hasPerm(user, 'posts')) {
    await query("UPDATE posts SET stage='publication', review_note='' WHERE id=$1", [id]);
  } else {
    await query("UPDATE posts SET status='published', published=true, stage='', published_at=now(), review_note='' WHERE id=$1", [id]);
  }
  await invalidateCache();
  redirect('/portal/review?done=1');
}

// ---- Joining and leaving groups: both need approval from the group's manager, coach or leader ----
const dest = (to: unknown, fallback: string) => (typeof to === 'string' && /^\/(portal|groups)(\/|$)/.test(to) ? to : fallback);

export async function requestJoin(slug: string, to?: unknown) {
  const user = await requireUser();
  const g = await one<{ id: number; is_office: boolean }>("SELECT id, is_office FROM groups WHERE slug=$1 AND status='approved'", [slug]);
  if (!g || g.is_office) redirect(`/groups/${slug}`);
  const r = await query(
    `INSERT INTO group_members(group_id,user_id,role,status) VALUES($1,$2,'member','pending')
     ON CONFLICT (group_id,user_id) DO UPDATE SET status='pending', left_at=NULL, role='member', title='', leave_requested=false WHERE group_members.status IN ('left','rejected') RETURNING 1`, [g.id, user.id]);
  if (r.length) await logMember(g.id, user.id, 'requested to join', user.id);
  redirect(dest(to, `/groups/${slug}?requested=1`));
}

export async function cancelJoin(slug: string, to?: unknown) {
  const user = await requireUser();
  const g = await one<{ id: number }>('SELECT id FROM groups WHERE slug=$1', [slug]);
  if (g) {
    const r = await query("DELETE FROM group_members WHERE group_id=$1 AND user_id=$2 AND status='pending' RETURNING 1", [g.id, user.id]);
    if (r.length) await logMember(g.id, user.id, 'cancelled join request', user.id);
  }
  redirect(dest(to, '/portal'));
}

export async function leaveGroup(slug: string, to?: unknown) {
  const user = await requireUser();
  const g = await one<{ id: number }>('SELECT id FROM groups WHERE slug=$1', [slug]);
  const cur = g ? await one<{ role: string }>("SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2 AND status='active'", [g.id, user.id]) : null;
  if (!g || !cur) redirect(dest(to, '/portal'));
  if (cur.role === 'manager' && (await managerCount(g.id)) <= 1) redirect('/portal?error=' + encodeURIComponent('Assign another manager before leaving.'));
  // A plain member asks for permission; it is skipped only when nobody in the group can approve.
  const approvers = Number((await one<{ n: string }>("SELECT count(*) n FROM group_members WHERE group_id=$1 AND user_id<>$2 AND status='active' AND role IN ('manager','coach','leader')", [g.id, user.id]))!.n);
  if (cur.role === 'member' && approvers > 0) {
    await query('UPDATE group_members SET leave_requested=true WHERE group_id=$1 AND user_id=$2', [g.id, user.id]);
    await logMember(g.id, user.id, 'requested to leave', user.id);
  } else await removeMember(g.id, user.id, user.id);
  redirect(dest(to, '/portal'));
}

export async function cancelLeave(slug: string, to?: unknown) {
  const user = await requireUser();
  const g = await one<{ id: number }>('SELECT id FROM groups WHERE slug=$1', [slug]);
  if (g) {
    await query('UPDATE group_members SET leave_requested=false WHERE group_id=$1 AND user_id=$2', [g.id, user.id]);
    await logMember(g.id, user.id, 'cancelled leave request', user.id);
  }
  redirect(dest(to, '/portal'));
}

export async function decideMember(slug: string, userId: number, approve: boolean) {
  const { user, group, perms } = await access(slug);
  if (!perms.has('members')) redirect(`/portal/groups/${slug}?denied=1`);
  const r = await query("UPDATE group_members SET status=$3, left_at=NULL WHERE group_id=$1 AND user_id=$2 AND status='pending' RETURNING 1", [group.id, userId, approve ? 'active' : 'rejected']);
  if (r.length) await logMember(group.id, userId, approve ? 'join approved' : 'join declined', user.id);
  back(slug);
}

export async function decideLeave(slug: string, userId: number, approve: boolean) {
  const { user, group, perms } = await access(slug);
  if (!perms.has('members') || userId === user.id) redirect(`/portal/groups/${slug}?denied=1`);
  const cur = await one<{ role: string }>("SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2 AND status='active' AND leave_requested", [group.id, userId]);
  if (cur) {
    if (approve) await removeMember(group.id, userId, user.id, 'leave approved');
    else { await query('UPDATE group_members SET leave_requested=false WHERE group_id=$1 AND user_id=$2', [group.id, userId]); await logMember(group.id, userId, 'leave declined', user.id); }
  }
  back(slug);
}

// ---- Requesting a new team, center or club (approved by the office manager or administrator) ----
export async function requestGroup(officeSlug: string, fd: FormData) {
  const { user, group: office } = await access(officeSlug);
  const dept = DEPTS[office.dept];
  const name = str(fd, 'name', 120);
  if (!office.is_office || !dept?.childType || !name) redirect(`/portal/groups/${officeSlug}?error=${encodeURIComponent('Give the new group a name.')}#requests`);
  const base = slugify(name);
  let s = base, n = 2;
  while (await one('SELECT 1 FROM groups WHERE slug=$1', [s])) s = `${base}-${n++}`;
  const g = await one<{ id: number }>(
    `INSERT INTO groups(slug,name,type,summary,icon,dept,parent_id,status,requested_by,listed,info)
     VALUES($1,$2,$3,$4,$5,$6,$7,'pending',$8,true,$9) RETURNING id`,
    [s, name, dept.kinds?.includes(str(fd, 'type', 40)) ? str(fd, 'type', 40) : dept.childType, str(fd, 'summary', 300), office.icon, office.dept, office.id, user.id, str(fd, 'coach', 200) ? `Requested coach/adviser: ${str(fd, 'coach', 200)}` : '']);
  await query("INSERT INTO group_members(group_id,user_id,role,status) VALUES($1,$2,'member','active') ON CONFLICT DO NOTHING", [g!.id, user.id]);
  redirect(`/portal/groups/${officeSlug}?requested=1#requests`);
}

export async function decideGroup(officeSlug: string, groupId: number, fd: FormData) {
  const { group: office, perms } = await access(officeSlug);
  if (!perms.has('members')) redirect(`/portal/groups/${officeSlug}?denied=1`);
  const g = await one<{ id: number; slug: string; requested_by: number | null }>("SELECT id, slug, requested_by FROM groups WHERE id=$1 AND parent_id=$2 AND status='pending'", [groupId, office.id]);
  if (!g) redirect(`/portal/groups/${officeSlug}`);
  if (fd.get('decision') === 'reject') {
    await query("UPDATE groups SET status='rejected', listed=false WHERE id=$1", [g.id]);
  } else {
    await query("UPDATE groups SET status='approved', info='' WHERE id=$1", [g.id]);
    const coach = str(fd, 'coach', 200);
    if (coach) {
      const err = await addMember(g.id, coach, office.dept === 'athletics' ? 'coach' : 'manager', office.dept === 'athletics' ? 'Coach' : 'Coach / adviser');
      if (err) redirect(`/portal/groups/${officeSlug}?error=${encodeURIComponent(err)}#requests`);
    }
  }
  await invalidateCache();
  redirect(`/portal/groups/${officeSlug}?saved=1#requests`);
}

// ---- Applications (Admission Office) ----
export async function decideApplication(slug: string, id: number, fd: FormData) {
  const { perms } = await access(slug);
  if (!perms.has('members')) redirect(`/portal/groups/${slug}?denied=1`);
  const status = ['approved', 'rejected', 'pending'].includes(str(fd, 'status', 12)) ? str(fd, 'status', 12) : 'pending';
  await query('UPDATE applications SET status=$2, note=$3 WHERE id=$1', [id, status, str(fd, 'note', 300)]);
  back(slug);
}

// ---- Papers (faculty, students, alumni) ----
export async function addPaper(fd: FormData) {
  const user = await requireUser();
  const title = str(fd, 'title', 250);
  const url = str(fd, 'url', 400);
  if (title) await query('INSERT INTO papers(user_id,title,venue,year,url,abstract) VALUES($1,$2,$3,$4,$5,$6)',
    [user.id, title, str(fd, 'venue', 200), Number(str(fd, 'year', 4)) || null, /^https?:\/\//.test(url) ? url : '', str(fd, 'abstract', 2000)]);
  await invalidateCache();
  redirect('/portal/profile?saved=1#papers');
}

export async function deletePaper(id: number) {
  const user = await requireUser();
  await query('DELETE FROM papers WHERE id=$1 AND user_id=$2', [id, user.id]);
  await invalidateCache();
  redirect('/portal/profile#papers');
}

export async function submitApplication(_: unknown, fd: FormData): Promise<Form> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!(await rateLimit('apply:' + ip, 5, 3600))) return { error: 'Too many submissions. Please try again later.' };
  const v = { name: str(fd, 'name', 120), email: str(fd, 'email', 200), phone: str(fd, 'phone', 40) };
  if (!v.name || !/^\S+@\S+\.\S+$/.test(v.email)) return { error: 'Enter the learner\'s name and a valid email address.', v, n: Date.now() };
  const kind = ['Enrollment', 'Transfer', 'Senior High'].includes(str(fd, 'kind', 20)) ? str(fd, 'kind', 20) : 'Enrollment';
  await query('INSERT INTO applications(kind,name,email,phone,grade,prev_school,message) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [kind, v.name, v.email, v.phone, str(fd, 'grade', 20), str(fd, 'prev_school', 160), str(fd, 'message', 1500)]);
  return { ok: true, n: Date.now() };
}

// ---- Partnership requests (public form → Partnerships Office) ----
export async function submitPartnerRequest(_: unknown, fd: FormData): Promise<Form> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!(await rateLimit('partner:' + ip, 5, 3600))) return { error: 'Too many submissions. Please try again later.' };
  const v = { org: str(fd, 'org', 160), contact: str(fd, 'contact', 120), email: str(fd, 'email', 200), phone: str(fd, 'phone', 40) };
  if (!v.org || !v.contact || !/^\S+@\S+\.\S+$/.test(v.email)) return { error: 'Enter the organization, a contact person and a valid email address.', v, n: Date.now() };
  const type = PARTNER_TYPES.includes(str(fd, 'org_type', 40)) ? str(fd, 'org_type', 40) : 'Other';
  const interests = fd.getAll('interests').map(String).filter((i) => PARTNER_INTERESTS.includes(i)).join(', ');
  await query('INSERT INTO partner_requests(org,org_type,contact,position,email,phone,interests,message) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
    [v.org, type, v.contact, str(fd, 'position', 120), v.email, v.phone, interests, str(fd, 'message', 2000)]);
  return { ok: true, n: Date.now() };
}

export async function decidePartnerRequest(slug: string, id: number, fd: FormData) {
  const { group, perms } = await access(slug);
  if (group.dept !== 'partnership' || !perms.has('members')) redirect(`/portal/groups/${slug}?denied=1`);
  const status = ['approved', 'rejected', 'pending'].includes(str(fd, 'status', 12)) ? str(fd, 'status', 12) : 'pending';
  await query('UPDATE partner_requests SET status=$2, note=$3 WHERE id=$1', [id, status, str(fd, 'note', 300)]);
  back(slug);
}

// ---- Alumni office: approve alumni who want to join ----
export async function decideAlumni(slug: string, userId: number, approve: boolean) {
  const { group, perms } = await access(slug);
  if (group.dept !== 'alumni' || !perms.has('members')) redirect(`/portal/groups/${slug}?denied=1`);
  await query("UPDATE users SET status=$2 WHERE id=$1 AND role='alumni' AND status='pending'", [userId, approve ? 'active' : 'disabled']);
  await invalidateCache();
  back(slug);
}
