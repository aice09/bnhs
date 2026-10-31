'use server';

import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSession, destroySession, getSession, requireAdmin, requireUser } from '@/lib/auth';
import { ADMIN_PERMS, ACCOUNT_ROLES, isStaff } from '@/lib/perms';
import { createBackup, deleteBackup } from '@/lib/backup-core.mjs';
import { sanitizeTheme } from '@/lib/theme';
import { invalidateCache, rateLimit } from '@/lib/cache';
import { normTags, slugify } from '@/lib/content';
import { one, query } from '@/lib/db';
import { RESOURCES, SETTING_FIELDS, type Field } from '@/lib/resources';

export async function login(_: unknown, fd: FormData): Promise<{ error: string; email?: string; n?: number } | undefined> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!(await rateLimit('login:' + ip, 8, 900))) return { error: 'Too many attempts. Try again in 15 minutes.' };
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const user = await one<{ id: number; email: string; name: string; role: string; status: string; password_hash: string }>(
    'SELECT * FROM users WHERE lower(email)=$1', [email]);
  const ok = user && (await bcrypt.compare(String(fd.get('password') || ''), user.password_hash));
  if (!user || !ok) return { error: 'Invalid email or password.', email, n: Date.now() };
  if (user.status === 'pending') return { error: 'Your account is waiting for approval by the school administrator.', email, n: Date.now() };
  if (user.status !== 'active') return { error: 'This account is disabled.', email, n: Date.now() };
  await createSession(user);
  await query('UPDATE users SET last_login=now() WHERE id=$1', [user.id]);
  const to = String(fd.get('next') || '');
  redirect(isStaff(user) ? '/admin' : to.startsWith('/portal') ? to : '/portal');
}

export async function logout() {
  const staff = isStaff(await getSession());
  await destroySession();
  redirect(staff ? '/admin/login' : '/portal/login');
}

function value(f: Field, fd: FormData): unknown {
  const raw = fd.get(f.name);
  if (f.type === 'checkbox') return raw === 'on';
  if (f.type === 'number') return Number(raw) || 0;
  if (f.type === 'ref') return raw ? Number(raw) || null : null;
  if (f.name === 'tags') return normTags(String(raw ?? ''));
  if (f.type === 'date') return raw ? String(raw) : null;
  if (f.type === 'datetime') return raw ? new Date(String(raw)).toISOString() : new Date().toISOString();
  return String(raw ?? '').trim();
}

export async function saveResource(resource: string, id: string, fd: FormData) {
  const r = RESOURCES[resource];
  if (!r) throw new Error('Unknown resource');
  await requireAdmin(r.perm);
  const fields = r.fields.filter((f) => f.type !== 'heading');
  const cols = fields.map((f) => f.name);
  const vals = fields.map((f) => value(f, fd));
  if (resource === 'posts') {
    cols.push('published'); vals.push(vals[cols.indexOf('status')] === 'published');
  }
  const isNew = id === 'new';
  if (resource === 'posts' && vals[cols.indexOf('placement')] === 'Main')
    await query("UPDATE posts SET placement='Highlight' WHERE placement='Main' AND id <> $1", [isNew ? 0 : Number(id)]);

  if (isNew) {
    if (r.canCreate === false) throw new Error('Not allowed');
    if (r.slugFrom) {
      const base = slugify(String(vals[cols.indexOf(r.slugFrom)]));
      let slug = base, n = 2;
      while (await one(`SELECT 1 FROM ${r.table} WHERE slug=$1`, [slug])) slug = `${base}-${n++}`;
      cols.push('slug'); vals.push(slug);
    }
    if (r.section) { cols.push('section'); vals.push(r.section); }
    await query(
      `INSERT INTO ${r.table} (${cols.join(',')}) VALUES (${cols.map((_, i) => '$' + (i + 1)).join(',')})`, vals);
  } else {
    const set = cols.map((c, i) => `${c}=$${i + 1}`).concat(r.touch ? ['updated_at=now()'] : []);
    await query(`UPDATE ${r.table} SET ${set.join(',')} WHERE id=$${cols.length + 1}${r.section ? ` AND section=$${cols.length + 2}` : ''}`,
      [...vals, Number(id), ...(r.section ? [r.section] : [])]);
  }
  await invalidateCache();
  redirect(`/admin/${resource}?saved=1`);
}

export async function togglePage(slug: string, returnTo: string) {
  await requireAdmin('sections');
  await query('UPDATE pages SET enabled = NOT enabled, updated_at = now() WHERE slug=$1', [slug]);
  await invalidateCache();
  redirect(returnTo);
}

export async function saveSettings(fd: FormData) {
  await requireAdmin('settings');
  for (const f of SETTING_FIELDS.filter((x) => x.type !== 'heading'))
    await query(
      'INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value',
      [f.name, String(fd.get(f.name) ?? '').trim()]);
  await invalidateCache();
  redirect('/admin/settings?saved=1');
}

export async function changePassword(_: unknown, fd: FormData): Promise<{ error?: string; ok?: boolean }> {
  const s = await requireUser();
  const pw = String(fd.get('password') || '');
  if (pw.length < 10) return { error: 'Use at least 10 characters.' };
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(pw, 12), s.id]);
  return { ok: true };
}

async function saveSetting(key: string, value: string) {
  await query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', [key, value]);
}

export async function saveAppearance(fd: FormData) {
  await requireAdmin('appearance');
  const t = sanitizeTheme({
    dark: String(fd.get('dark')), primary: String(fd.get('primary')), accent: String(fd.get('accent')),
    light: String(fd.get('light')), gold: String(fd.get('gold')),
  });
  for (const [k, v] of Object.entries(t)) await saveSetting('theme_' + k, v);
  if (fd.has('avatar_style')) await saveSetting('avatar_style', ['none', 'notion', 'boring', 'multiavatar'].includes(String(fd.get('avatar_style'))) ? String(fd.get('avatar_style')) : 'none');
  if (fd.has('logo_url')) await saveSetting('logo_url', String(fd.get('logo_url') || '').trim());
  await invalidateCache();
  redirect('/admin/appearance?saved=1');
}

// ---- Users ----
const ROLE_KEYS = ACCOUNT_ROLES.map(([k]) => k);
const STATUSES = ['active', 'pending', 'disabled'];

export async function saveUser(id: string, fd: FormData) {
  const me = await requireAdmin('users');
  const role = String(fd.get('role'));
  const status = String(fd.get('status'));
  if (!ROLE_KEYS.includes(role) || !STATUSES.includes(status)) throw new Error('Bad input');
  const perms = ADMIN_PERMS.map(([k]) => k).filter((k) => fd.get('perm_' + k) === 'on');
  const name = String(fd.get('name') || '').trim();
  const email = String(fd.get('email') || '').trim().toLowerCase();
  if (!name || !/^\S+@\S+$/.test(email)) redirect(`/admin/users/${id}?error=Name and a valid email are required`);
  const note = String(fd.get('note') || '').trim();
  const pw = String(fd.get('password') || '');
  if (pw && pw.length < 10) redirect(`/admin/users/${id}?error=Password must be at least 10 characters`);
  if (id === 'new') {
    if (!pw) redirect('/admin/users/new?error=Set a starting password');
    if (await one('SELECT 1 FROM users WHERE lower(email)=$1', [email])) redirect('/admin/users/new?error=That email is already used');
    await query('INSERT INTO users(email,name,role,status,permissions,note,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [email, name, role, status, perms, note, await bcrypt.hash(pw, 12)]);
  } else {
    const uid = Number(id);
    // never let the signed-in admin lock themselves out
    const safeRole = uid === me.id ? 'admin' : role;
    const safeStatus = uid === me.id ? 'active' : status;
    const dup = await one('SELECT 1 FROM users WHERE lower(email)=$1 AND id<>$2', [email, uid]);
    if (dup) redirect(`/admin/users/${id}?error=That email is already used`);
    await query('UPDATE users SET email=$1,name=$2,role=$3,status=$4,permissions=$5,note=$6 WHERE id=$7', [email, name, safeRole, safeStatus, perms, note, uid]);
    if (pw) await query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(pw, 12), uid]);
  }
  await invalidateCache();
  redirect('/admin/users?saved=1');
}

export async function deleteUser(id: number) {
  const me = await requireAdmin('users');
  if (id === me.id) redirect('/admin/users?error=You cannot delete your own account');
  await query('DELETE FROM users WHERE id=$1', [id]);
  await invalidateCache();
  redirect('/admin/users?saved=1');
}

export async function setUserStatus(id: number, status: string) {
  await requireAdmin('users');
  if (!STATUSES.includes(status)) throw new Error('Bad status');
  await query('UPDATE users SET status=$1 WHERE id=$2', [status, id]);
  await invalidateCache();
  redirect('/admin/users?saved=1');
}

// ---- Backups ----
export async function makeBackup(fd: FormData) {
  await requireAdmin('backups');
  try {
    await createBackup({ uploads: fd.get('uploads') === 'on' });
  } catch (e) {
    redirect('/admin/backups?error=' + encodeURIComponent((e as Error).message.slice(0, 200)));
  }
  redirect('/admin/backups?saved=1');
}

export async function removeBackup(name: string) {
  await requireAdmin('backups');
  await deleteBackup(name);
  redirect('/admin/backups?saved=1');
}

export async function completeSetup(fd: FormData) {
  await requireAdmin('settings');
  const g = (k: string, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);
  const put = (k: string, v: string) => query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', [k, v]);
  if (fd.get('skip') !== '1') {
    const name = g('school_name'), short = g('short_name', 30), city = g('city'), province = g('province');
    if (!name || !short) redirect('/admin/setup?error=1');
    const place = [city, province].filter(Boolean).join(', ');
    const logo = g('logo_url', 300);
    for (const [k, v] of Object.entries({
      school_name: name, short_name: short, school_id: g('school_id', 30), established: g('established', 4), city, province, region: g('region'),
      address: g('address', 300) || place, tagline: g('tagline'),
      hero_title: name, hero_subtitle: `Welcome to the official website of ${name}${place ? ` in ${place}` : ''}.`,
      home_eyebrow: [city, province, g('region')].filter(Boolean).join(' · '), community_name: city, area_served: city,
      learners_from: city ? `${city} and nearby communities` : '',
      seo_keywords: [name, short, city && `${city} schools`, city && `high school in ${city}`, province && `${province} high school`, place].filter(Boolean).join(', '),
    })) await put(k, v);
    if (logo) await put('logo_url', logo);
  }
  await put('setup_done', '1');
  await invalidateCache();
  redirect('/admin?welcome=1');
}
