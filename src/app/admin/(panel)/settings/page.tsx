import { saveSettings } from '../../actions';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { SETTING_FIELDS } from '@/lib/resources';
import FieldInput from '../FieldInput';

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin('settings');
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM settings');
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <>
      <h1>Site Settings</h1>
      {(await searchParams).saved && <div className="alert">Settings saved.</div>}
      <form className="panel" action={saveSettings}>
        {SETTING_FIELDS.map((f) => <FieldInput key={f.name} f={f} v={s[f.name]} />)}
        <button className="btn"><i className="fa-solid fa-floppy-disk" /> Save settings</button>
      </form>
    </>
  );
}
