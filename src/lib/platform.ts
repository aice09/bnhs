import { one, query } from './db';
import type { Account } from './perms';

export type Module = {
  key: string; no: number; suite: string; name: string; summary: string; phase: number; status: string; enabled: boolean;
  public_url: string; admin_url: string; portal_url: string; notes: string;
};

export const STATUS: Record<string, { label: string; cls: string }> = {
  live: { label: 'Live', cls: '' },
  partial: { label: 'In progress', cls: ' warn' },
  planned: { label: 'Planned', cls: ' bad' },
};

export const listModules = () => query<Module>('SELECT * FROM platform_modules ORDER BY no');

// Shared audit service: every module records who did what here.
export async function audit(actor: Pick<Account, 'id' | 'name'> | null, action: string, entity = '', detail = '') {
  try {
    await query('INSERT INTO audit_log(actor_id,actor,action,entity,detail) VALUES($1,$2,$3,$4,$5)', [actor?.id ?? null, actor?.name ?? '', action.slice(0, 80), entity.slice(0, 120), detail.slice(0, 500)]);
  } catch { /* auditing must never break the action being recorded */ }
}

export type AuditRow = { id: number; actor: string; action: string; entity: string; detail: string; created_at: string };
export async function auditPage(page: number, q: string) {
  const size = 50, like = `%${q}%`;
  const rows = await query<AuditRow>(
    `SELECT id, actor, action, entity, detail, to_char(created_at,'YYYY-MM-DD HH24:MI:SS') AS created_at FROM audit_log
     WHERE ($1 = '' OR actor ILIKE $2 OR action ILIKE $2 OR entity ILIKE $2 OR detail ILIKE $2) ORDER BY id DESC LIMIT ${size} OFFSET ${(page - 1) * size}`, [q, like]);
  const total = Number((await one<{ n: string }>(`SELECT count(*) n FROM audit_log WHERE ($1 = '' OR actor ILIKE $2 OR action ILIKE $2 OR entity ILIKE $2 OR detail ILIKE $2)`, [q, like]))!.n);
  return { rows, total, size };
}
