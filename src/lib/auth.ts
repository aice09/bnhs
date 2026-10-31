import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { one } from './db';
import { hasPerm, isStaff, type Account } from './perms';

export const COOKIE = 'school_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-insecure-secret');

export async function createSession(user: { id: number; email: string; name: string; role: string }) {
  const staff = isStaff(user);
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setExpirationTime(staff ? '8h' : '7d')
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.SITE_URL?.startsWith('https') ?? false,
    path: '/',
    maxAge: staff ? 60 * 60 * 8 : 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: Number(payload.sub), email: String(payload.email), name: String(payload.name), role: String(payload.role || '') };
  } catch {
    return null;
  }
}

// Current account loaded from the database, so role/permission changes and disabled accounts apply immediately.
export const getUser = cache(async (): Promise<Account | null> => {
  const s = await getSession();
  if (!s) return null;
  const u = await one<Account>('SELECT id, email, name, role, status, permissions FROM users WHERE id=$1', [s.id]);
  return u && u.status === 'active' ? u : null;
});

// Signed-in account of any kind (student, alumni, research center member, staff…).
export async function requireUser() {
  const u = await getUser();
  if (!u) redirect('/portal/login');
  return u;
}

// CMS access: administrators and staff. Pass a permission key to require it.
export async function requireAdmin(perm?: string) {
  const u = await getUser();
  if (!u) redirect('/admin/login');
  if (!isStaff(u)) redirect('/portal');
  if (perm && !hasPerm(u, perm)) redirect('/admin?denied=1');
  return u;
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
