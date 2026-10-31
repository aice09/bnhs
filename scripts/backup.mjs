// Usage: npm run db:backup            (database only)
//        npm run db:backup -- --uploads  (also archive ./uploads when S3 is not used)
// Schedule with cron, e.g.  0 2 * * *  cd /path/to/app && npm run db:backup
import './load-env.mjs';
import { createBackup } from '../src/lib/backup-core.mjs';

const r = await createBackup({ uploads: process.argv.includes('--uploads') });
console.log('Created:', r.files.join(', '), r.uploadedToS3 ? '(copied to S3)' : '');
