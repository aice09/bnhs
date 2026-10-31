import Avatar from '@/components/Avatar';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { setUserStatus } from '../../actions';

export default async function Users({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin('users');
  const sp = await searchParams;
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.last_login, u.created_at,
       coalesce((SELECT string_agg(g.name, ', ') FROM group_members m JOIN groups g ON g.id = m.group_id WHERE m.user_id = u.id), '') AS groups
     FROM users u ORDER BY (u.status='pending') DESC, u.created_at DESC`);
  const pending = rows.filter((r: any) => r.status === 'pending');
  return (
    <>
      <div className="bar"><h1 style={{ margin: 0 }}>Users & Alumni</h1><Link className="btn" href="/admin/users/new"><i className="fa-solid fa-plus" /> Add user</Link></div>
      {sp.saved && <div className="alert">Saved.</div>}
      {sp.error && <div className="alert err">{sp.error}</div>}
      {pending.length > 0 && (
        <div className="panel"><h2 style={{ marginTop: 0 }}>Waiting for approval</h2>
          {pending.map((u: any) => (
            <div className="row" key={u.id} style={{ justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="row" style={{ gap: 10 }}><Avatar seed={u.id} name={u.name} size={32} /><span><b>{u.name}</b> · {u.email} · {u.role}</span></span>
              <span className="row">
                <form action={setUserStatus.bind(null, u.id, 'active')}><button className="btn sm">Approve</button></form>
                <form action={setUserStatus.bind(null, u.id, 'disabled')}><button className="btn sm out">Reject</button></form>
                <Link className="btn sm out" href={`/admin/users/${u.id}`}>Open</Link>
              </span>
            </div>))}
        </div>)}
      <DataTable
        columns={[{ key: 'name', title: 'Name' }, { key: 'email', title: 'Email' }, { key: 'role', title: 'Role' }, { key: 'status', title: 'Status' }, { key: 'groups', title: 'Groups' }, { key: 'last_login', title: 'Last login' }]}
        rows={JSON.parse(JSON.stringify(rows))} resource="users" />
    </>
  );
}
