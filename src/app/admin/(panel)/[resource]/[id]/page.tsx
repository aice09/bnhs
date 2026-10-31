import Link from 'next/link';
import { notFound } from 'next/navigation';
import { saveResource } from '../../../actions';
import { requireAdmin } from '@/lib/auth';
import { one, query } from '@/lib/db';
import { RESOURCES, scope } from '@/lib/resources';
import FieldInput from '../../FieldInput';

export default async function Edit({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const r = RESOURCES[resource];
  if (!r || (id === 'new' && r.canCreate === false) || (id !== 'new' && !/^\d+$/.test(id))) notFound();
  await requireAdmin(r.perm);
  const sc = scope(r, 2);
  const groups = r.fields.some((f) => f.optionsFrom === 'groups') ? await query<{ id: number; name: string }>('SELECT id, name FROM groups ORDER BY name') : [];
  const refs = { groups: ['|School (official)', ...groups.map((g) => `${g.id}|${g.name}`)] };
  const row = id === 'new' ? {} : await one(`SELECT * FROM ${r.table} WHERE id=$1 AND ${sc.sql}`, [Number(id), ...sc.params]);
  if (!row) notFound();
  if (resource === 'messages' && id !== 'new' && !(row as any).read) {
    await query('UPDATE messages SET read=true WHERE id=$1', [Number(id)]);
  }
  return (
    <>
      <h1>{id === 'new' ? `Add ${r.singular.toLowerCase()}` : `Edit ${r.singular.toLowerCase()}`}</h1>
      {resource === 'groups' && id !== 'new' && <div className="alert"><i className="fa-solid fa-users-gear" /> Add members, set their roles and permissions, and manage events/resources in the <Link href={`/portal/groups/${(row as any).slug}`}>group workspace</Link>.</div>}
      <form className="panel" action={saveResource.bind(null, resource, id)}>
        {r.fields.map((f) => <FieldInput key={f.name} f={f.optionsFrom ? { ...f, options: refs[f.optionsFrom] } : f} v={(row as any)[f.name]} />)}
        <div className="row"><button className="btn"><i className="fa-solid fa-floppy-disk" /> Save</button><Link className="btn out" href={`/admin/${resource}`}>Cancel</Link></div>
      </form>
    </>
  );
}
