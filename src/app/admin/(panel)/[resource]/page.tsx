import Link from 'next/link';
import { notFound } from 'next/navigation';
import DataTable from '@/components/DataTable';
import { one, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { togglePage } from '../../actions';
import { RESOURCES, scope } from '@/lib/resources';

export default async function List({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { resource } = await params;
  const r = RESOURCES[resource];
  if (!r) notFound();
  await requireAdmin(r.perm);
  const sc = scope(r);
  const rows = r.listSql ? await query(r.listSql) : await query(`SELECT * FROM ${r.table} WHERE ${sc.sql} ORDER BY ${r.order}`, sc.params);
  const page = r.section ? await one<{ id: number; enabled: boolean }>('SELECT id, enabled FROM pages WHERE slug=$1', [r.section]) : null;
  return (
    <>
      <div className="bar">
        <h1 style={{ margin: 0 }}>{r.label}</h1>
        {r.canCreate !== false && <Link className="btn" href={`/admin/${resource}/new`}><i className="fa-solid fa-plus" /> Add {r.singular.toLowerCase()}</Link>}
      </div>
      {(await searchParams).saved && <div className="alert">Saved.</div>}
      {page && (
        <div className={page.enabled ? 'alert' : 'alert err'}>
          <div className="row">
            <span>The public <b>{r.label}</b> page is <b>{page.enabled ? 'ENABLED' : 'DISABLED'}</b>
              {page.enabled ? <> — <Link href={`/${r.section}`} target="_blank">view page</Link></> : ' (hidden from the website and menu)'}.</span>
            <form action={togglePage.bind(null, r.section!, `/admin/${resource}`)}><button className="btn sm">{page.enabled ? 'Disable page' : 'Enable page'}</button></form>
            <Link className="btn sm out" href={`/admin/pages/${page.id}`}>Edit intro text</Link>
          </div>
        </div>
      )}
      <DataTable columns={r.columns} rows={JSON.parse(JSON.stringify(rows))} resource={resource} />
    </>
  );
}
