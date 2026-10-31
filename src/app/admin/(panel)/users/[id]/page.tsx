import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { one, query } from '@/lib/db';
import { ACCOUNT_ROLES, ADMIN_PERMS } from '@/lib/perms';
import { saveUser } from '../../../actions';

export default async function EditUser({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin('users');
  const { id } = await params;
  if (id !== 'new' && !/^\d+$/.test(id)) notFound();
  const u: any = id === 'new'
    ? { name: '', email: '', role: 'student', status: 'active', permissions: [], note: '' }
    : await one('SELECT * FROM users WHERE id=$1', [Number(id)]);
  if (!u) notFound();
  const groups = id === 'new' ? [] : await query(
    'SELECT g.name, g.slug, m.role FROM group_members m JOIN groups g ON g.id=m.group_id WHERE m.user_id=$1 ORDER BY g.name', [Number(id)]);
  const alumni = id === 'new' ? null : await one('SELECT * FROM alumni_profiles WHERE user_id=$1', [Number(id)]);
  const err = (await searchParams).error;
  return (
    <>
      <h1>{id === 'new' ? 'Add user' : `Edit ${u.name}`}</h1>
      {err && <div className="alert err">{err}</div>}
      <form className="panel" action={saveUser.bind(null, id)}>
        <div className="fld"><label>Name</label><input name="name" defaultValue={u.name} required /></div>
        <div className="fld"><label>Email (login)</label><input name="email" type="email" defaultValue={u.email} required /></div>
        <div className="fld"><label>{id === 'new' ? 'Starting password' : 'New password (leave blank to keep)'}</label><input name="password" type="password" minLength={10} autoComplete="new-password" required={id === 'new'} /></div>
        <div className="fld"><label>Account type</label>
          <select name="role" defaultValue={u.role}>{ACCOUNT_ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <div className="help">Administrators can do everything. Staff only get the CMS areas ticked below. Students, alumni and research members use the portal and get their access from the groups they belong to.</div></div>
        <div className="fld"><label>Status</label>
          <select name="status" defaultValue={u.status}><option value="active">Active</option><option value="pending">Pending approval</option><option value="disabled">Disabled</option></select></div>
        <div className="fld"><label>CMS permissions (for the Staff account type)</label>
          {ADMIN_PERMS.map(([k, l]) => (
            <label key={k} style={{ display: 'flex', gap: 8, fontWeight: 400 }}>
              <input type="checkbox" name={'perm_' + k} defaultChecked={u.permissions.includes(k)} style={{ width: 'auto' }} /> {l}
            </label>))}</div>
        <div className="fld"><label>Internal note</label><input name="note" defaultValue={u.note} /></div>
        {groups.length > 0 && <div className="fld"><label>Groups</label>{groups.map((g: any) => <div key={g.slug}><Link href={`/portal/groups/${g.slug}`}>{g.name}</Link> · {g.role}</div>)}
          <div className="help">Change group roles and permissions in each group's workspace.</div></div>}
        {alumni && <div className="fld"><label>Alumni profile</label><div>Batch {alumni.grad_year || '—'} · {alumni.occupation || 'no occupation'} {alumni.employer && `at ${alumni.employer}`}</div></div>}
        <div className="row"><button className="btn"><i className="fa-solid fa-floppy-disk" /> Save</button><Link className="btn out" href="/admin/users">Cancel</Link></div>
      </form>
    </>
  );
}
