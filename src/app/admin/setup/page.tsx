import { completeSetup } from '../actions';
import ImageField from '@/components/ImageField';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/queries';

export const metadata = { title: 'Set up your school', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Setup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin('settings');
  const s = await getSettings();
  const { error } = await searchParams;
  return (
    <div className="login"><div className="panel" style={{ background: '#fff', padding: 28, borderRadius: 12, maxWidth: 640, width: '100%' }}>
      <h1 style={{ marginTop: 0 }}><i className="fa-solid fa-wand-magic-sparkles" /> Welcome! Let&apos;s set up your school</h1>
      <p className="help">Your administrator account is ready. Tell us about the school – the website title, menus, footer and search-engine information are filled in from this. You can change everything later in Site Settings.</p>
      {error && <div className="alert err">Please enter the school name and its acronym.</div>}
      <form action={completeSetup}>
        <div className="fld"><label>Complete school name *</label><input name="school_name" required defaultValue={s.school_name} placeholder="e.g. Bolo Norte National High School" /></div>
        <div className="row">
          <div className="fld" style={{ flex: 1, minWidth: 180 }}><label>Acronym / short name *</label><input name="short_name" required defaultValue={s.short_name} placeholder="e.g. BNNHS" /></div>
          <div className="fld" style={{ flex: 1, minWidth: 180 }}><label>School ID (DepEd)</label><input name="school_id" defaultValue={s.school_id} placeholder="e.g. 309743" /></div>
          <div className="fld" style={{ flex: 1, minWidth: 120 }}><label>Year established</label><input name="established" defaultValue={s.established} maxLength={4} /></div>
        </div>
        <div className="row">
          <div className="fld" style={{ flex: 1, minWidth: 180 }}><label>City / municipality</label><input name="city" defaultValue={s.city} /></div>
          <div className="fld" style={{ flex: 1, minWidth: 180 }}><label>Province</label><input name="province" defaultValue={s.province} /></div>
          <div className="fld" style={{ flex: 1, minWidth: 180 }}><label>Region</label><input name="region" defaultValue={s.region} placeholder="e.g. Region V" /></div>
        </div>
        <div className="fld"><label>Address</label><input name="address" defaultValue={s.address} /></div>
        <div className="fld"><label>Tagline</label><input name="tagline" defaultValue={s.tagline} /></div>
        <div className="fld"><label>School logo</label><ImageField name="logo_url" initial={s.logo_url ?? ''} /></div>
        <div className="row"><button className="btn"><i className="fa-solid fa-check" /> Save and continue</button>
          <button className="btn out" name="skip" value="1" formNoValidate>Skip for now</button></div>
      </form>
    </div></div>
  );
}
