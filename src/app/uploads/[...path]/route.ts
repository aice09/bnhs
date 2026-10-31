import path from 'node:path';
import { MIME, readUpload } from '@/lib/storage';

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (parts.length !== 1 || parts[0].includes('..')) return new Response('Not found', { status: 404 });
  const data = await readUpload(parts[0]);
  if (!data) return new Response('Not found', { status: 404 });
  const type = MIME[path.extname(parts[0]).toLowerCase()] || 'application/octet-stream';
  const inline = type.startsWith('image/') || type === 'application/pdf';
  return new Response(Buffer.from(data), {
    headers: {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': inline ? 'inline' : 'attachment',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
