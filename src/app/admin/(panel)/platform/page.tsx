import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listModules, STATUS } from '@/lib/platform';
import { SUITES } from '@/lib/platform-registry.mjs';
import { saveModule, toggleModule } from '../../actions';

export const metadata = { title: 'Digital platform' };

export default async function Platform({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin('platform');
  const sp = await searchParams;
  const all = await listModules();
  const count = (st: string) => all.filter((m) => m.status === st).length;
  return (
    <>
      <h1>School Digital Platform</h1>
      {sp.saved && <div className="alert">Saved.</div>}
      <p className="help">The website and CMS is the hub of one connected platform. Every system below shares the same accounts, groups, approvals, documents and audit log.
        Switching a system on lists it on the public <Link href="/digital-services" target="_blank">Digital services</Link> page and in members&rsquo; portals; the links you set here are where people are sent.</p>
      <div className="stats">
        <div className="stat"><b>{all.length}</b> Systems &amp; services</div>
        <div className="stat"><b>{count('live')}</b> Live</div>
        <div className="stat"><b>{count('partial')}</b> In progress</div>
        <div className="stat"><b>{count('planned')}</b> Planned</div>
      </div>
      <div className="row" style={{ margin: '8px 0 16px' }}>
        <Link className="btn out" href="/admin/platform/audit"><i className="fa-solid fa-clipboard-list" /> Audit log</Link>
        <Link className="btn out" href="/admin/backups"><i className="fa-solid fa-database" /> Backups</Link>
        <Link className="btn out" href="/admin/users"><i className="fa-solid fa-user-shield" /> Accounts &amp; roles</Link>
      </div>
      {SUITES.map(([suite, title, icon]) => {
        const mods = all.filter((m) => m.suite === suite);
        return (
          <div className="panel" key={suite}>
            <h2 style={{ marginTop: 0 }}><i className={`fa-solid fa-${icon}`} /> {title} <small>({mods.filter((m) => m.status === 'live').length}/{mods.length} live)</small></h2>
            <table className="tbl"><thead><tr><th>#</th><th>System</th><th>Phase</th><th>Status</th><th>Shown</th><th>Open</th></tr></thead><tbody>
              {mods.map((m) => (
                <tr key={m.key} id={m.key}>
                  <td>{String(m.no).padStart(2, '0')}</td>
                  <td><b>{m.name}</b><br /><small>{m.summary}</small>
                    <details style={{ marginTop: 6 }}><summary>Edit</summary>
                      <form action={saveModule.bind(null, m.key)} style={{ marginTop: 8 }}>
                        <div className="row">
                          <label style={{ fontWeight: 400 }}>Status <select name="status" defaultValue={m.status}><option value="live">Live</option><option value="partial">In progress</option><option value="planned">Planned</option></select></label>
                          <label style={{ fontWeight: 400 }}><input type="checkbox" name="enabled" defaultChecked={m.enabled} style={{ width: 'auto' }} /> Show on the site</label>
                        </div>
                        <div className="fld"><label>Public page</label><input name="public_url" defaultValue={m.public_url} placeholder="/partnerships or https://…" /></div>
                        <div className="fld"><label>Admin / CMS page</label><input name="admin_url" defaultValue={m.admin_url} placeholder="/admin/…" /></div>
                        <div className="fld"><label>Member portal / dashboard</label><input name="portal_url" defaultValue={m.portal_url} placeholder="/portal/groups/…" /></div>
                        <div className="fld"><label>Notes</label><input name="notes" defaultValue={m.notes} maxLength={500} /></div>
                        <button className="btn sm">Save</button>
                      </form></details></td>
                  <td>{m.phase}</td>
                  <td><span className={'badge' + STATUS[m.status].cls}>{STATUS[m.status].label}</span></td>
                  <td><form action={toggleModule.bind(null, m.key)}><button className={'btn sm' + (m.enabled ? '' : ' out')}>{m.enabled ? 'On' : 'Off'}</button></form></td>
                  <td className="row">
                    {m.public_url && <a className="btn sm out" href={m.public_url} target="_blank" rel="noopener noreferrer" title="Public page"><i className="fa-solid fa-globe" /></a>}
                    {m.admin_url && <Link className="btn sm out" href={m.admin_url} title="CMS"><i className="fa-solid fa-pen-to-square" /></Link>}
                    {m.portal_url && <Link className="btn sm out" href={m.portal_url} title="Portal"><i className="fa-solid fa-id-card" /></Link>}
                  </td>
                </tr>))}
            </tbody></table>
          </div>);
      })}
    </>
  );
}
