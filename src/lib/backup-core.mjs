// Database backups: pg_dump -> gzip, optional uploads archive, optional copy to S3, simple retention.
// Used by the admin "Backups" page, the scheduler (BACKUP_EVERY_HOURS) and scripts/backup.mjs.
import { spawn } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

export const backupDir = () => path.resolve(process.env.BACKUP_DIR || './backups');
const NAME = /^(db|uploads)-\d{8}-\d{6}\.(sql|tar)\.gz$/;
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

function run(cmd, args, out) {
  let err = '';
  const p = spawn(cmd, args, { stdio: ['ignore', out ? 'pipe' : 'ignore', 'pipe'] });
  p.stderr.on('data', (d) => (err += d));
  const exited = new Promise((resolve, reject) => {
    p.on('error', (e) => reject(new Error(`${cmd} not available: ${e.message}`)));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed (${code}): ${err.trim().slice(0, 300)}`))));
  });
  const piped = out ? pipeline(p.stdout, createGzip(), createWriteStream(out)) : Promise.resolve();
  return Promise.all([piped, exited]).then(() => undefined);
}

async function s3Put(file) {
  if (!process.env.S3_BUCKET || process.env.BACKUP_TO_S3 === 'false') return false;
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || !!process.env.S3_ENDPOINT,
    credentials: process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' } : undefined,
  });
  const { readFile } = await import('node:fs/promises');
  await client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET, Key: (process.env.S3_BACKUP_PREFIX ?? 'backups/') + path.basename(file),
    Body: await readFile(file), ContentType: 'application/gzip',
  }));
  return true;
}

export async function createBackup({ uploads = false } = {}) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const ts = stamp();
  const files = [];
  const db = path.join(dir, `db-${ts}.sql.gz`);
  await run('pg_dump', ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--dbname', process.env.DATABASE_URL], db);
  files.push(db);
  const up = path.resolve(process.env.UPLOAD_DIR || './uploads');
  if (uploads && !process.env.S3_BUCKET && (await stat(up).catch(() => null))) {
    const tar = path.join(dir, `uploads-${ts}.tar.gz`);
    await run('tar', ['-czf', tar, '-C', path.dirname(up), path.basename(up)]);
    files.push(tar);
  }
  let uploadedToS3 = false;
  try { for (const f of files) uploadedToS3 = (await s3Put(f)) || uploadedToS3; } catch (e) { console.error('Backup S3 upload failed:', e.message); }
  await prune();
  return { files: files.map((f) => path.basename(f)), uploadedToS3 };
}

async function prune() {
  const keep = Number(process.env.BACKUP_KEEP || 14);
  for (const kind of ['db', 'uploads']) {
    const names = (await readdir(backupDir()).catch(() => [])).filter((n) => n.startsWith(kind + '-') && NAME.test(n)).sort().reverse();
    for (const n of names.slice(keep)) await unlink(path.join(backupDir(), n)).catch(() => {});
  }
}

export async function listBackups() {
  const names = (await readdir(backupDir()).catch(() => [])).filter((n) => NAME.test(n));
  const out = [];
  for (const name of names) {
    const s = await stat(path.join(backupDir(), name));
    out.push({ name, size: s.size, created: s.mtime.toISOString(), kind: name.startsWith('db-') ? 'database' : 'uploads' });
  }
  return out.sort((a, b) => b.created.localeCompare(a.created));
}

export function backupPath(name) {
  return NAME.test(name) ? path.join(backupDir(), name) : null;
}

export async function deleteBackup(name) {
  const p = backupPath(name);
  if (p) await unlink(p);
}
