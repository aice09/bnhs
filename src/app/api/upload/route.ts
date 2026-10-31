import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { isStaff } from '@/lib/perms';
import { MIME, saveUpload } from '@/lib/storage';

const IMAGES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  const ext = path.extname(file.name).toLowerCase();
  // Staff may upload documents too; students, alumni and group members may upload images and PDFs only.
  const allowed = isStaff(user) ? ext in MIME : IMAGES.has(ext) || ext === '.pdf';
  if (!allowed) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'File too large (8 MB max)' }, { status: 400 });
  const name = `${Date.now()}-${randomBytes(4).toString('hex')}${ext}`;
  try {
    return NextResponse.json({ url: await saveUpload(name, Buffer.from(await file.arrayBuffer()), MIME[ext]) });
  } catch {
    return NextResponse.json({ error: 'Storage error. Check the S3 / upload settings.' }, { status: 500 });
  }
}
