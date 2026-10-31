// Optional scheduled database backups: set BACKUP_EVERY_HOURS (e.g. 24) to enable.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') (await import('./instrumentation-node')).startBackupScheduler();
}
