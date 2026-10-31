import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { hasPerm } from '@/lib/perms';
import { one } from '@/lib/db';
import { RESOURCES, scope } from '@/lib/resources';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAdmin();
  const counts = await Promise.all(
    Object.entries(RESOURCES).filter(([, r]) => hasPerm(user, r.perm)).map(async ([k, r]) => {
      const sc = scope(r);
      return [k, r, Number((await one<{ n: string }>(`SELECT count(*) n FROM ${r.table} WHERE ${sc.sql}`, sc.params))!.n)] as const;
    }));
  const unread = Number((await one<{ n: string }>('SELECT count(*) n FROM messages WHERE NOT read'))!.n);
  const pendingPosts = Number((await one<{ n: string }>("SELECT count(*) n FROM posts WHERE status='pending'"))!.n);
  const pendingUsers = Number((await one<{ n: string }>("SELECT count(*) n FROM users WHERE status='pending'"))!.n);
  return (
    <>
      <h1>Dashboard</h1>
      {(await searchParams).denied && <div className="alert err">You do not have permission for that area.</div>}
      {pendingPosts > 0 && hasPerm(user, 'posts') && <div className="alert"><i className="fa-solid fa-hourglass-half" /> {pendingPosts} news item(s) waiting for review. <Link href="/admin/posts">Review</Link></div>}
      {pendingUsers > 0 && hasPerm(user, 'users') && <div className="alert"><i className="fa-solid fa-user-clock" /> {pendingUsers} account(s) waiting for approval. <Link href="/admin/users">Review</Link></div>}
      {unread > 0 && <div className="alert"><i className="fa-solid fa-envelope" /> You have {unread} unread message(s). <Link href="/admin/messages">Open inbox</Link></div>}
      <div className="stats">
        {counts.map(([k, r, n]) => (
          <Link key={k} href={`/admin/${k}`} className="stat" style={{ textDecoration: 'none', color: 'inherit' }}>
            <b>{n}</b><i className={`fa-solid fa-${r.icon}`} /> {r.label}
          </Link>
        ))}
      </div>
      <div className="row">
        <Link className="btn" href="/admin/posts/new"><i className="fa-solid fa-plus" /> New post</Link>
        <Link className="btn out" href="/admin/pages">Edit pages (History, Mission…)</Link>
      </div>
    </>
  );
}
