// Usage: npm run db:restore -- backups/db-YYYYMMDD-HHMMSS.sql.gz --yes
// Replaces the current database contents with the backup. Stop the app first.
import './load-env.mjs';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

const file = process.argv[2];
if (!file || !process.argv.includes('--yes')) {
  console.error('Usage: npm run db:restore -- <backup.sql.gz> --yes   (this OVERWRITES the current database)');
  process.exit(1);
}
const psql = spawn('psql', ['--set', 'ON_ERROR_STOP=1', '--quiet', '--dbname', process.env.DATABASE_URL], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => psql.on('close', (c) => (c === 0 ? res() : rej(new Error('psql exited with ' + c)))));
await Promise.all([pipeline(createReadStream(file), createGunzip(), psql.stdin), done]);
console.log('Restore complete. Clear Redis cache if needed:  redis-cli --scan --pattern "*:c:*" | xargs redis-cli del');
