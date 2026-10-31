import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Uploads go to S3 (or any S3-compatible service such as MinIO / Cloudflare R2 / Wasabi) when S3_BUCKET is set,
// otherwise to UPLOAD_DIR on local disk. Files are always served through /uploads/<name>.
export const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export const s3Enabled = () => !!process.env.S3_BUCKET;
const prefix = () => process.env.S3_PREFIX ?? 'uploads/';
const localDir = () => path.resolve(process.env.UPLOAD_DIR || './uploads');

const g = globalThis as unknown as { s3?: S3Client };
function s3() {
  return (g.s3 ??= new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || !!process.env.S3_ENDPOINT,
    credentials: process.env.S3_ACCESS_KEY_ID
      ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' }
      : undefined,
  }));
}

export function storageInfo() {
  return s3Enabled()
    ? { mode: 'S3', detail: `${process.env.S3_BUCKET}${process.env.S3_ENDPOINT ? ' @ ' + process.env.S3_ENDPOINT : ''}` }
    : { mode: 'Local disk', detail: localDir() };
}

// Stores a file and returns the public URL to save in the database.
export async function saveUpload(name: string, data: Buffer, contentType: string): Promise<string> {
  if (s3Enabled()) {
    await s3().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: prefix() + name, Body: data, ContentType: contentType }));
    return process.env.S3_PUBLIC_URL ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${prefix()}${name}` : `/uploads/${name}`;
  }
  await mkdir(localDir(), { recursive: true });
  await writeFile(path.join(localDir(), name), data);
  return `/uploads/${name}`;
}

// Reads an upload from S3 first (when enabled) and falls back to local disk, so files saved before S3 was turned on still work.
export async function readUpload(name: string): Promise<Uint8Array | null> {
  if (s3Enabled()) {
    try {
      const res = await s3().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: prefix() + name }));
      if (res.Body) return await res.Body.transformToByteArray();
    } catch {}
  }
  const file = path.resolve(localDir(), name);
  if (!file.startsWith(localDir() + path.sep)) return null;
  try { return await readFile(file); } catch { return null; }
}
