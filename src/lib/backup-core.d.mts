export type BackupFile = { name: string; size: number; created: string; kind: 'database' | 'uploads' };
export function backupDir(): string;
export function createBackup(opts?: { uploads?: boolean }): Promise<{ files: string[]; uploadedToS3: boolean }>;
export function listBackups(): Promise<BackupFile[]>;
export function deleteBackup(name: string): Promise<void>;
export function backupPath(name: string): string | null;
