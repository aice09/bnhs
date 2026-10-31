import Avatar from '@/components/Avatar';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { query, one } from '@/lib/db';
import { accessFor, membersOf } from '@/lib/groups';
import { DEPTS, GROUP_PERMS, GROUP_ROLES } from '@/lib/perms';
import ImageField from '@/components/ImageField';
import { groupBlocks, sectionByKey } from '@/lib/sections';
import EntryForm from './EntryForm';
import {
  addGroupItem, addGroupMember, decideAlumni, decideApplication, decideGroup, decideMember, requestGroup, deleteGroupEntry, deleteGroupItem, deleteGroupPost, removeGroupMember, saveGroupEntry, saveGroupPage, updateGroupMember,
} from '../../actions';

export const metadata = { title: 'Group workspace', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type SP = { requested?: string; saved?: string; submitted?: string; denied?: string; error?: string };

export default async function Workspace({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const user = await requireUser();
  const g: any = await one('SELECT * FROM groups WHERE slug=$1', [slug]);
  if (!g) notFound();
  const acc = await accessFor(user, slug);
  if (!acc) redirect('/portal');
  const m = acc.member;
  const can = (p: string) => acc.perms.has(p);
  const sp = await searchParams;
  const targets = groupBlocks(g.type, g.dept, g.is_office);
  const [members, items, posts, entries, pendingMembers, children, requests, apps, parent, alumniPending] = await Promise.all([
    membersOf(g.id),
    query('SELECT * FROM group_items WHERE group_id=$1 ORDER BY created_at DESC', [g.id]),
    query<any>(`SELECT p.id, p.title, p.status, p.stage, p.author_id, p.review_note, p.slug, u.name AS author FROM posts p LEFT JOIN users u ON u.id = p.author_id
      WHERE p.group_id=$1 ORDER BY p.published_at DESC LIMIT 30`, [g.id]),
    query<any>("SELECT id, section, block, title, meta, category, extra, description, image, url, to_char(event_date,'YYYY-MM-DD') AS event_date, tags, featured, (SELECT string_agg(u.email, ', ') FROM item_people ip JOIN users u ON u.id=ip.user_id WHERE ip.item_id=items.id) AS credit FROM items WHERE group_id=$1 ORDER BY section, block, event_date DESC NULLS LAST, id DESC", [g.id]),
    query<any>("SELECT m.user_id, u.name, u.email FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=$1 AND m.status='pending' ORDER BY m.created_at", [g.id]),
    g.is_office ? query<any>(`SELECT id, slug, name, type, (SELECT count(*)::int FROM group_members m WHERE m.group_id=groups.id AND m.status='active') AS members,
        (SELECT u.name FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=groups.id AND m.status='active' AND m.role='manager' LIMIT 1) AS coach
        FROM groups WHERE parent_id=$1 AND status='approved' ORDER BY name`, [g.id]) : Promise.resolve([] as any[]),
    g.is_office ? query<any>(`SELECT x.id, x.name, x.summary, x.info, u.name AS requester, u.email FROM groups x LEFT JOIN users u ON u.id=x.requested_by WHERE x.parent_id=$1 AND x.status='pending' ORDER BY x.id`, [g.id]) : Promise.resolve([] as any[]),
    g.dept === 'admission' ? query<any>('SELECT * FROM applications ORDER BY (status=\'pending\') DESC, created_at DESC LIMIT 100') : Promise.resolve([] as any[]),
    g.parent_id ? one<any>('SELECT slug, name FROM groups WHERE id=$1', [g.parent_id]) : Promise.resolve(null),
    g.dept === 'alumni' ? query<any>("SELECT u.id, u.name, u.email, a.grad_year FROM users u LEFT JOIN alumni_profiles a ON a.user_id=u.id WHERE u.role='alumni' AND u.status='pending' ORDER BY u.created_at") : Promise.resolve([] as any[]),
  ]);
  const dept = DEPTS[g.dept];
  const reviewCount = Number((await one<any>(`SELECT count(*) n FROM posts WHERE status='pending' AND group_id IN (SELECT id FROM groups WHERE id=$1 OR parent_id=$1)`, [g.id]))!.n);
  return (
    <div className="portal">
      <p><Link href="/portal">← My portal</Link>{parent && <> · <Link href={`/portal/groups/${parent.slug}`}>{parent.name}</Link></>} · {g.is_office ? 'Office dashboard' : <Link href={`/groups/${g.slug}`}>Public page</Link>}</p>
      <h1 style={{ margin: 0 }}><i className={`fa-solid fa-${g.icon || 'people-group'}`} /> {g.name}</h1>
      <p><span className="badge">{g.type}</span> {m ? <>You are: <b>{m.title || m.role}</b></> : <>Viewing as {acc.via === 'office' ? 'office manager' : 'administrator'}</>}{dept && <> · <span className="badge">{dept.name}</span></>}</p>
      {sp.requested && <div className="alert ok">Request sent. It will appear for approval.</div>}
      {(can('publish') || reviewCount > 0) && <p><Link className="btn sm out" href="/portal/review"><i className="fa-solid fa-clipboard-check" /> Review queue{reviewCount ? ` (${reviewCount} waiting in this ${g.is_office ? 'office' : 'group'})` : ''}</Link></p>}
      {sp.saved && <div className="alert ok">Saved.</div>}
      {sp.submitted && <div className="alert ok">Submitted for review. The school will publish it once approved.</div>}
      {sp.denied && <div className="alert err">You do not have permission for that.</div>}
      {sp.error && <div className="alert err">{sp.error}</div>}

      {g.private_content && (
        <div className="panel"><h2 style={{ marginTop: 0 }}><i className="fa-solid fa-lock" /> Members only</h2><div style={{ whiteSpace: 'pre-line' }}>{g.private_content}</div></div>
      )}

      <div className="panel" id="news">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Group news</h2>
          {can('post') && <Link className="btn sm" href={`/portal/groups/${slug}/posts/new`}><i className="fa-solid fa-pen" /> Write news</Link>}
        </div>
        <p className="help">{g.auto_publish ? 'Your posts publish immediately.' : can('publish') ? 'Your posts go to the publication manager for approval, then publish.' : 'Your posts are approved by the group manager, then by the publication manager, before they appear in the news.'}</p>
        {posts.length === 0 ? <div className="empty">No news yet.</div> : (
          <table className="tbl"><tbody>{posts.map((p: any) => {
            const mine = p.author_id === user.id;
            const editable = can('post') && (mine || can('publish'));
            return (
              <tr key={p.id}><td>{p.status === 'published' ? <Link href={`/news/${p.slug}`}>{p.title}</Link> : p.title}<br /><small>{p.author || ''}</small>{p.review_note && <><br /><small>Note: {p.review_note}</small></>}</td>
                <td><span className={'badge' + (p.status === 'pending' ? ' warn' : p.status === 'rejected' ? ' bad' : '')}>{p.status === 'pending' ? (p.stage === 'group' ? 'awaiting group manager' : p.stage === 'publication' ? 'awaiting publication manager' : 'awaiting admin') : p.status}</span></td>
                <td className="row">{editable && <Link className="btn sm out" href={`/portal/groups/${slug}/posts/${p.id}`}>Edit</Link>}
                  {editable && <form action={deleteGroupPost.bind(null, slug, p.id)}><button className="btn sm danger" aria-label="Delete"><i className="fa-solid fa-trash" /></button></form>}</td></tr>);
          })}</tbody></table>)}
      </div>

      {can('edit') && (
        <form className="panel" action={saveGroupPage.bind(null, slug)}>
          <h2 style={{ marginTop: 0 }}>Group page</h2>
          <div className="fld"><label>Photo / banner</label><ImageField name="image" initial={g.image} /></div>
          <div className="fld"><label>Summary</label><input name="summary" defaultValue={g.summary} maxLength={300} /></div>
          <div className="fld"><label>About (Markdown)</label><textarea name="description" rows={7} defaultValue={g.description} /></div>
          <div className="fld"><label>{g.type === 'Research Center' ? 'Center info' : 'Group info'} (Markdown: location, hours, head, how to join)</label><textarea name="info" rows={5} defaultValue={g.info} /></div>
          <div className="fld"><label>Members-only page</label><textarea name="private_content" rows={5} defaultValue={g.private_content} /><div className="help">Only signed-in members see this.</div></div>
          <div className="fld"><label>Adviser</label><input name="adviser" defaultValue={g.adviser} /></div>
          <div className="fld"><label>Contact</label><input name="contact" defaultValue={g.contact} /></div>
          <button className="btn">Save group page</button>
        </form>)}

      {(entries.length > 0 || can('items')) && (
        <div className="panel" id="entries"><h2 style={{ marginTop: 0 }}>Page content</h2>
          <p className="help">Projects, facilities and learning spaces, schedules, achievements… Each entry appears on this group&apos;s page <b>and</b> on the matching school-wide page ({[...new Set(targets.map((t) => sectionByKey(t.section)?.label))].join(', ')}).</p>
          {entries.map((e: any) => (
            <details key={e.id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
              <summary><b>{e.title}</b> <span className="badge">{sectionByKey(e.section)?.blocks.find((b) => b.key === e.block)?.title}</span></summary>
              {can('items') && <div style={{ marginTop: 10 }}>
                <EntryForm action={saveGroupEntry.bind(null, slug, String(e.id))} targets={targets} e={e} canFeature={can('publish')} label="Save changes" />
                <form action={deleteGroupEntry.bind(null, slug, e.id)} style={{ marginTop: 8 }}><button className="btn sm danger"><i className="fa-solid fa-trash" /> Delete entry</button></form>
              </div>}
            </details>))}
          {can('items') && <details style={{ marginTop: 14 }} open={entries.length === 0}><summary><b><i className="fa-solid fa-plus" /> Add an entry</b></summary>
            <div style={{ marginTop: 10 }}><EntryForm action={saveGroupEntry.bind(null, slug, 'new')} targets={targets} canFeature={can('publish')} label="Add entry" /></div></details>}
        </div>)}

      {(items.length > 0 || can('items')) && (
        <div className="panel" id="items"><h2 style={{ marginTop: 0 }}>Events & announcements</h2>
          {items.map((i: any) => (
            <div className="listrow" key={i.id}><div style={{ flex: 1 }}><b>{i.title}</b> <span className="badge">{i.kind}</span> {i.members_only && <span className="badge warn">members only</span>}<br /><small>{i.meta}</small>{i.description && <p style={{ margin: '4px 0 0' }}>{i.description}</p>}</div>
              {can('items') && <form action={deleteGroupItem.bind(null, slug, i.id)}><button className="btn sm danger" aria-label="Delete"><i className="fa-solid fa-trash" /></button></form>}</div>))}
          {can('items') && (
            <form action={addGroupItem.bind(null, slug)} style={{ marginTop: 14 }}>
              <div className="row">
                <select name="kind" defaultValue="Event"><option>Event</option><option>Project</option><option>Resource</option><option>Announcement</option></select>
                <input name="title" placeholder="Title" required style={{ flex: 1, minWidth: 180 }} />
                <input name="meta" placeholder="Date / place" />
              </div>
              <div className="fld" style={{ marginTop: 8 }}><textarea name="description" rows={2} placeholder="Details (optional)" /></div>
              <div className="fld"><input name="url" placeholder="Link (optional)" /></div>
              <label style={{ fontWeight: 400 }}><input type="checkbox" name="members_only" style={{ width: 'auto' }} /> Members only (hidden from the public page)</label>{' '}
              <button className="btn sm">Add</button>
            </form>)}
        </div>)}


      {g.is_office && (
        <div className="panel" id="requests">
          <h2 style={{ marginTop: 0 }}>{dept?.childLabel ? `${dept.childLabel[0].toUpperCase()}${dept.childLabel.slice(1)}s under this office` : 'Office'}</h2>
          {children.length > 0 && <table className="tbl"><tbody>{children.map((c: any) => (
            <tr key={c.id}><td><Link href={`/portal/groups/${c.slug}`}><b>{c.name}</b></Link><br /><small>{c.members} members · {c.coach ? `Coach/adviser: ${c.coach}` : 'No coach assigned yet'}</small></td>
              <td><Link className="btn sm out" href={`/portal/groups/${c.slug}`}>Manage</Link></td></tr>))}</tbody></table>}
          {children.length === 0 && dept?.childLabel && <div className="empty">No {dept.childLabel}s yet.</div>}
          {requests.length > 0 && <>
            <h3>Requests to create a {dept?.childLabel}</h3>
            {requests.map((r: any) => (
              <form key={r.id} action={decideGroup.bind(null, slug, r.id)} className="panel" style={{ background: 'var(--g1)' }}>
                <b>{r.name}</b> <small>requested by {r.requester} ({r.email})</small>
                {r.summary && <p style={{ margin: '4px 0' }}>{r.summary}</p>}
                {r.info && <p className="help">{r.info}</p>}
                {can('members') ? <div className="row">
                  <input name="coach" type="email" placeholder="Coach / adviser account email (optional)" style={{ flex: 1, minWidth: 220 }} />
                  <button className="btn sm" name="decision" value="approve">Approve</button>
                  <button className="btn sm danger" name="decision" value="reject">Decline</button></div> : null}
              </form>))}</>}
          {dept?.childLabel && can('members') && (
            <details style={{ marginTop: 12 }}><summary><b>Request a new {dept.childLabel}</b></summary>
              <form action={requestGroup.bind(null, slug)} style={{ marginTop: 10 }}>
                <div className="fld"><label>Name</label><input name="name" required maxLength={120} /></div>
                <div className="fld"><label>What is it about?</label><input name="summary" maxLength={300} /></div>
                <div className="fld"><label>Proposed coach / adviser (name or email)</label><input name="coach" maxLength={200} /></div>
                <button className="btn sm">Send request</button>
              </form></details>)}
        </div>)}

      {g.dept === 'admission' && (
        <div className="panel" id="applications"><h2 style={{ marginTop: 0 }}>Applications ({apps.filter((a: any) => a.status === 'pending').length} pending)</h2>
          {apps.length === 0 && <div className="empty">No applications yet.</div>}
          {apps.map((a: any) => (
            <details key={a.id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
              <summary><b>{a.name}</b> · {a.kind} {a.grade && `· Grade ${a.grade}`} <span className={'badge' + (a.status === 'pending' ? ' warn' : a.status === 'rejected' ? ' bad' : '')}>{a.status}</span></summary>
              <p style={{ margin: '8px 0' }}>{a.email}{a.phone && ` · ${a.phone}`}{a.prev_school && ` · Previous school: ${a.prev_school}`}</p>
              {a.message && <p style={{ margin: '0 0 8px', whiteSpace: 'pre-line' }}>{a.message}</p>}
              {can('members') && <form action={decideApplication.bind(null, slug, a.id)} className="row">
                <select name="status" defaultValue={a.status}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Declined</option></select>
                <input name="note" defaultValue={a.note} placeholder="Note to file" style={{ flex: 1, minWidth: 200 }} /><button className="btn sm">Save</button></form>}
            </details>))}
        </div>)}

      {g.dept === 'alumni' && (
        <div className="panel" id="alumni-requests"><h2 style={{ marginTop: 0 }}>Alumni waiting to join ({alumniPending.length})</h2>
          {alumniPending.length === 0 && <div className="empty">No pending alumni.</div>}
          {alumniPending.map((u: any) => (
            <div className="row" key={u.id} style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--line)', padding: '6px 0' }}>
              <span><b>{u.name}</b> <small>{u.email}{u.grad_year ? ` · Batch ${u.grad_year}` : ''}</small></span>
              {can('members') && <span className="row">
                <form action={decideAlumni.bind(null, slug, u.id, true)}><button className="btn sm">Approve</button></form>
                <form action={decideAlumni.bind(null, slug, u.id, false)}><button className="btn sm danger">Decline</button></form></span>}
            </div>))}
        </div>)}

      {pendingMembers.length > 0 && (
        <div className="panel" id="join"><h2 style={{ marginTop: 0 }}>Requests to join ({pendingMembers.length})</h2>
          {pendingMembers.map((pm: any) => (
            <div className="row" key={pm.user_id} style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--line)', padding: '6px 0' }}>
              <span><b>{pm.name}</b> <small>{pm.email}</small></span>
              {can('members') ? <span className="row">
                <form action={decideMember.bind(null, slug, pm.user_id, true)}><button className="btn sm">Accept</button></form>
                <form action={decideMember.bind(null, slug, pm.user_id, false)}><button className="btn sm danger">Decline</button></form></span> : <small>Awaiting a manager</small>}
            </div>))}
        </div>)}

      <div className="panel" id="members"><h2 style={{ marginTop: 0 }}>Members ({members.length})</h2>
        {members.map((mm) => (
          <details key={mm.user_id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
            <summary><Avatar seed={mm.user_id} name={mm.name} size={26} className="inl" /> <b>{mm.name}</b> · {mm.title || mm.role} <small>({mm.email})</small></summary>
            {can('members') ? (
              <form action={updateGroupMember.bind(null, slug, mm.user_id)} style={{ marginTop: 10 }}>
                <div className="row">
                  <select name="role" defaultValue={mm.role}>{Object.keys(GROUP_ROLES).map((r) => <option key={r}>{r}</option>)}</select>
                  <input name="title" defaultValue={mm.title} placeholder="Position (e.g. Editor-in-Chief)" />
                </div>
                <div className="help">Roles: manager = everything, editor = write news and manage events, member = read members-only pages. Extra permissions:</div>
                {GROUP_PERMS.map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', gap: 8, fontWeight: 400 }}><input type="checkbox" name={'perm_' + k} defaultChecked={mm.permissions.includes(k)} style={{ width: 'auto' }} /> {l}</label>))}
                <div className="row" style={{ marginTop: 8 }}><button className="btn sm">Save</button></div>
              </form>) : null}
            {can('members') && <form action={removeGroupMember.bind(null, slug, mm.user_id)}><button className="btn sm danger" style={{ marginTop: 6 }}>Remove from group</button></form>}
          </details>))}
        {can('members') && (
          <form action={addGroupMember.bind(null, slug)} className="row" style={{ marginTop: 14 }}>
            <input name="email" type="email" placeholder="Member's account email" required style={{ flex: 1, minWidth: 200 }} />
            <select name="role" defaultValue="member">{Object.keys(GROUP_ROLES).map((r) => <option key={r}>{r}</option>)}</select>
            <input name="title" placeholder="Position" />
            <button className="btn sm">Add member</button>
          </form>)}
      </div>
    </div>
  );
}
