import ImageField from '@/components/ImageField';
import type { Block } from '@/lib/sections';

export type Entry = {
  id?: number; section?: string; block?: string; title?: string; meta?: string; category?: string; extra?: string; description?: string;
  image?: string; url?: string; event_date?: string | null; tags?: string; featured?: boolean; credit?: string;
};

export default function EntryForm({ action, targets, e = {}, canFeature, label }: {
  action: (fd: FormData) => Promise<void>; targets: { section: string; block: Block }[]; e?: Entry; canFeature: boolean; label: string;
}) {
  const cur = e.section ? `${e.section}/${e.block}` : '';
  const hint = targets.map((t) => `${t.block.title}: ${t.block.hint}`).join(' • ');
  return (
    <form action={action}>
      <div className="fld"><label>Where it appears</label>
        <select name="target" defaultValue={cur} required>{targets.map((t) => <option key={`${t.section}/${t.block.key}`} value={`${t.section}/${t.block.key}`}>{t.block.title}</option>)}</select>
        <div className="help">{hint}</div></div>
      <div className="fld"><label>Title</label><input name="title" defaultValue={e.title} required maxLength={200} /></div>
      <div className="row">
        <div className="fld" style={{ flex: 1, minWidth: 160 }}><label>Meta (date, status, place…)</label><input name="meta" defaultValue={e.meta} /></div>
        <div className="fld" style={{ flex: 1, minWidth: 160 }}><label>Category</label><input name="category" defaultValue={e.category} /></div>
        <div className="fld" style={{ flex: 1, minWidth: 160 }}><label>Extra (venue, result, authors…)</label><input name="extra" defaultValue={e.extra} /></div>
      </div>
      <div className="row">
        <div className="fld" style={{ flex: 1, minWidth: 160 }}><label>Date</label><input type="date" name="event_date" defaultValue={e.event_date ?? ''} /></div>
        <div className="fld" style={{ flex: 2, minWidth: 200 }}><label>Tags (comma separated)</label><input name="tags" defaultValue={e.tags} /></div>
      </div>
      <div className="fld"><label>Description</label><textarea name="description" rows={3} defaultValue={e.description} /></div>
      <div className="fld"><label>Image</label><ImageField name="image" initial={e.image ?? ''} /></div>
      <div className="fld"><label>Credit members (emails, optional)</label><input name="credit" defaultValue={e.credit ?? ''} placeholder="student@example.com, coach@example.com" />
        <div className="help">The entry will appear on those members&apos; profile achievements.</div></div>
      <div className="fld"><label>Link (optional)</label><input name="url" defaultValue={e.url} placeholder="https://… or /page" /></div>
      {canFeature && <label style={{ fontWeight: 400 }}><input type="checkbox" name="featured" defaultChecked={e.featured} style={{ width: 'auto' }} /> Feature (large banner on the achievements page)</label>}
      <div className="row" style={{ marginTop: 10 }}><button className="btn sm">{label}</button></div>
    </form>
  );
}
