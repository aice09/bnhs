import Link from 'next/link';
import { logout } from '../../admin/actions';
import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { membershipsOf, reviewQueue } from '@/lib/groups';
import Avatar from '@/components/Avatar';
import { hasPerm, isStaff } from '@/lib/perms';

export const metadata = { title: 'My portal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const LABEL: Record<string, string> = { student: 'Student', alumni: 'Alumni', researcher: 'Research center member', member: 'Member', admin: 'Administrator', staff: 'Staff' };

export default async function Portal() {
  const user = await requireUser();
  const mine = await membershipsOf(user.id);
  const allGroups = hasPerm(user, 'groups') ? await query<{ slug: string; name: string; type: string }>('SELECT slug, name, type FROM groups WHERE status=\'approved\' ORDER BY is_office DESC, name') : [];
  const [queue, pending, joinable] = await Promise.all([
    reviewQueue(user),
    query<{ slug: string; name: string }>("SELECT g.slug, g.name FROM group_members m JOIN groups g ON g.id=m.group_id WHERE m.user_id=$1 AND m.status='pending'", [user.id]),
    query<{ slug: string; name: string; type: string }>(`SELECT g.slug, g.name, g.type FROM groups g WHERE g.status='approved' AND g.listed AND NOT g.is_office
      AND NOT EXISTS (SELECT 1 FROM group_members m WHERE m.group_id=g.id AND m.user_id=$1 AND m.status IN ('active','pending')) ORDER BY g.name`, [user.id]),
  ]);
  const posts = await query<{ id: number; title: string; status: string; stage: string; review_note: string; slug: string; group_slug: string; group_name: string }>(
    `SELECT p.id, p.title, p.status, p.stage, p.review_note, p.slug, g.slug AS group_slug, g.name AS group_name
     FROM posts p JOIN groups g ON g.id = p.group_id WHERE p.author_id=$1 ORDER BY p.published_at DESC LIMIT 12`, [user.id]);
  return (
    <div className="portal">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row"><Avatar seed={user.id} name={user.name} size={56} /><div><h1 style={{ margin: 0 }}>Welcome, {user.name}</h1><span className="badge">{LABEL[user.role] ?? user.role}</span></div></div>
        <div className="row">
          {isStaff(user) && <Link className="btn" href="/admin"><i className="fa-solid fa-gauge" /> Admin CMS</Link>}
          <Link className="btn out" href="/portal/profile"><i className="fa-solid fa-user-pen" /> My profile</Link>
          <form action={logout}><button className="btn out"><i className="fa-solid fa-right-from-bracket" /> Sign out</button></form>
        </div>
      </div>

      {queue.length > 0 && <div className="alert"><i className="fa-solid fa-clipboard-check" /> <Link href="/portal/review"><b>{queue.length} article{queue.length > 1 ? 's' : ''} waiting for your approval</b></Link></div>}

      <div className="panel" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>My groups &amp; dashboards</h2>
        {mine.length === 0 && <div className="empty">You are not part of any group yet. The school administrator or a group manager can add you.</div>}
        {pending.length > 0 && <p className="help">Waiting for approval: {pending.map((x) => x.name).join(', ')}</p>}
        <div className="grid g3">
          {mine.map((m) => (
            <Link key={m.group_id} href={`/portal/groups/${m.slug}`} className="gcard">
              <div className="gb"><span className="badge">{m.type}</span><h3><i className={`fa-solid fa-${m.icon || 'people-group'}`} /> {m.name}</h3>
                <p>{m.title || m.role}{m.perms.has('post') ? ' · can write news' : ''}{m.perms.has('publish') ? ' · can publish' : ''}</p></div>
            </Link>))}
        </div>
      </div>

      {joinable.length > 0 && user.role !== 'admin' && (
        <div className="panel"><h2 style={{ marginTop: 0 }}>Join a group or club</h2>
          <p className="help">Open a group and press <b>Apply to join</b>. The group manager approves your request.</p>
          <div className="chips">{joinable.map((g) => <Link key={g.slug} className="chip" href={`/groups/${g.slug}`}>{g.name}</Link>)}</div></div>)}

      {allGroups.length > 0 && (
        <div className="panel"><h2 style={{ marginTop: 0 }}>All groups (administrator)</h2>
          <div className="chips">{allGroups.map((g) => <Link key={g.slug} className="chip" href={`/portal/groups/${g.slug}`}>{g.name}</Link>)}</div></div>)}

      {user.role === 'alumni' && <div className="panel"><h2 style={{ marginTop: 0 }}>Alumni</h2>
        <p>Keep your alumni profile up to date so classmates can find you.</p>
        <Link className="btn" href="/portal/profile">Edit my alumni profile</Link> <Link className="btn out" href="/alumni">Alumni directory</Link></div>}

      {posts.length > 0 && (
        <div className="panel"><h2 style={{ marginTop: 0 }}>My news submissions</h2>
          <table className="tbl"><tbody>{posts.map((p) => (
            <tr key={p.id}><td>{p.status === 'published' ? <Link href={`/news/${p.slug}`}>{p.title}</Link> : p.title}<br /><small>{p.group_name}</small>{p.review_note && <><br /><small>Reviewer note: {p.review_note}</small></>}</td>
              <td><span className={'badge' + (p.status === 'pending' ? ' warn' : p.status === 'rejected' ? ' bad' : '')}>{p.status === 'pending' ? (p.stage === 'group' ? 'awaiting group manager' : p.stage === 'publication' ? 'awaiting publication manager' : 'awaiting admin') : p.status}</span></td>
              <td><Link className="btn sm out" href={`/portal/groups/${p.group_slug}/posts/${p.id}`}>Edit</Link></td></tr>))}</tbody></table></div>)}
    </div>
  );
}
