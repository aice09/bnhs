import { createBackup } from './lib/backup-core.mjs';

export function startBackupScheduler() {
  const hours = Number(process.env.BACKUP_EVERY_HOURS || 0);
  if (!hours) return;
  const run = () => createBackup().catch((e: Error) => console.error('Scheduled backup failed:', e.message));
  setInterval(run, hours * 3600_000).unref();
}
