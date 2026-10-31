import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { query } from '@/lib/db';
import { hasPerm } from '@/lib/perms';
import { RESOURCES } from '@/lib/resources';

export async function DELETE(_: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { resource, id } = await params;
  if (resource === 'users') {
    if (!hasPerm(user, 'users') || user.id === Number(id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await query('DELETE FROM users WHERE id=$1', [Number(id)]);
    return NextResponse.json({ ok: true });
  }
  const r = RESOURCES[resource];
  if (r && !hasPerm(user, r.perm)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!r || r.canDelete === false || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  await query(`DELETE FROM ${r.table} WHERE id=$1${r.section ? ' AND section=$2' : ''}`, [Number(id), ...(r.section ? [r.section] : [])]);
  await invalidateCache();
  return NextResponse.json({ ok: true });
}
