import { createReadStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { backupPath } from '@/lib/backup-core.mjs';
import { hasPerm } from '@/lib/perms';

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const user = await getUser();
  if (!hasPerm(user, 'backups')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const file = backupPath((await params).name);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Length': String(statSync(file).size),
      'Content-Disposition': `attachment; filename="${(await params).name.replace(/[^\w.-]/g, '_')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
