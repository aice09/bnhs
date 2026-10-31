import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { requireUser } from '@/lib/auth';
import { one } from '@/lib/db';
import { personHistory } from '@/lib/queries';
import PasswordForm from '../../../admin/(panel)/account/PasswordForm';
import { addPaper, deletePaper, leaveGroup } from '../actions';
import AlumniForm from './AlumniForm';

export const metadata = { title: 'My profile', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Profile() {
  const user = await requireUser();
  const [p, h] = await Promise.all([user.role === 'alumni' ? one('SELECT * FROM alumni_profiles WHERE user_id=$1', [user.id]) : null, personHistory(user.id)]);
  return (
    <div className="portal" style={{ maxWidth: 760 }}>
      <p><Link href="/portal">← My portal</Link></p>
      <h1>My profile</h1>
      <div className="panel row"><Avatar seed={user.id} name={user.name} size={72} /><div><b>{user.name}</b><br />{user.email}<br /><span className="help">Your avatar style is chosen by the school.</span></div></div>
      {user.role === 'alumni' && <div className="panel"><h2 style={{ marginTop: 0 }}>Alumni profile</h2><AlumniForm p={p} /></div>}

      <div className="panel"><h2 style={{ marginTop: 0 }}>My groups &amp; history</h2>
        {h.groups.length === 0 && <div className="empty">No groups yet.</div>}
        <ul className="hist">{h.groups.map((g) => (
          <li key={g.slug + g.joined}><span className={'dot' + (g.status === 'active' ? ' on' : '')} />
            <div><b>{g.listed ? <Link href={`/groups/${g.slug}`}>{g.name}</Link> : g.name}</b> <small>{g.type}</small><br />
              <small>{g.title || g.role} · joined {g.joined}{g.left ? ` · left ${g.left}` : ' · current member'}</small></div>
            {g.status === 'active' && <form action={leaveGroup.bind(null, g.slug)}><button className="btn sm out">Leave</button></form>}</li>))}</ul>
      </div>

      <div className="panel"><h2 style={{ marginTop: 0 }}>My achievements</h2>
        {h.achievements.length === 0 ? <div className="empty">Achievements credited to you by a group appear here.</div> :
          <ul className="hist">{h.achievements.map((a) => <li key={a.id}><span className="dot on" /><div><Link href={`/items/${a.id}`}><b>{a.title}</b></Link><br /><small>{a.category} {a.event_date && `· ${a.event_date}`}</small></div></li>)}</ul>}
      </div>

      <div className="panel" id="papers"><h2 style={{ marginTop: 0 }}>Research papers &amp; publications</h2>
        {h.papers.length > 0 && <ul className="hist">{h.papers.map((r) => (
          <li key={r.id}><span className="dot on" /><div><b>{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> : r.title}</b><br /><small>{[r.venue, r.year].filter(Boolean).join(' · ')}</small></div>
            <form action={deletePaper.bind(null, r.id)}><button className="btn sm danger" aria-label="Delete"><i className="fa-solid fa-trash" /></button></form></li>))}</ul>}
        <details><summary><b>Add a paper</b></summary>
          <form action={addPaper} style={{ marginTop: 10 }}>
            <div className="fld"><label>Title</label><input name="title" required maxLength={250} /></div>
            <div className="row"><div className="fld" style={{ flex: 2, minWidth: 200 }}><label>Journal / conference</label><input name="venue" /></div>
              <div className="fld" style={{ flex: 1, minWidth: 100 }}><label>Year</label><input name="year" inputMode="numeric" maxLength={4} /></div></div>
            <div className="fld"><label>Link (optional)</label><input name="url" placeholder="https://…" /></div>
            <div className="fld"><label>Abstract (optional)</label><textarea name="abstract" rows={3} /></div>
            <button className="btn sm">Add paper</button></form></details>
      </div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Change password</h2><PasswordForm /></div>
    </div>
  );
}
