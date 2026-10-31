import { saveAppearance } from '../../actions';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/queries';
import { themeFromSettings } from '@/lib/theme';
import ThemeEditor from './ThemeEditor';

export default async function Appearance({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin('appearance');
  const s = await getSettings();
  return (
    <>
      <h1>Appearance</h1>
      {(await searchParams).saved && <div className="alert">Saved. The public site now uses the new look.</div>}
      <ThemeEditor initial={themeFromSettings(s)} logo={s.logo_url || ''} avatar={s.avatar_style || 'none'} action={saveAppearance} />
    </>
  );
}
