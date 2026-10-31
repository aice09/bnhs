import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { reviewQueue } from '@/lib/groups';
import { reviewPost } from '../actions';

export const metadata = { title: 'Review queue', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Review({ searchParams }: { searchParams: Promise<{ done?: string; denied?: string }> }) {
  const user = await requireUser();
  const [queue, sp] = await Promise.all([reviewQueue(user), searchParams]);
  return (
    <div className="portal">
      <p><Link href="/portal">← My portal</Link></p>
      <h1>Review queue</h1>
      <p className="help">Articles move through: <b>writer → group manager → publication manager → published</b>. You see the articles waiting for your approval. Administrators can approve any article.</p>
      {sp.done && <div className="alert ok">Done.</div>}
      {sp.denied && <div className="alert err">That article is not waiting for you.</div>}
      {queue.length === 0 && <div className="empty">Nothing is waiting for your approval.</div>}
      {queue.map((p) => (
        <form key={p.id} action={reviewPost.bind(null, p.id)} className="panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{p.title}</h3>
            <span className="badge warn">{p.stage === 'group' ? 'Step 1: group manager' : p.stage === 'publication' ? 'Step 2: publication manager' : 'Admin'}</span>
          </div>
          <p className="help">{p.group_name} · by {p.author ?? 'unknown'} </p>
          {p.excerpt && <p>{p.excerpt}</p>}
          <details style={{ margin: '0 0 10px' }}><summary>Read the full article</summary><div style={{ whiteSpace: 'pre-line', marginTop: 8 }}>{p.content}</div></details>
          <div className="row">
            <input name="note" placeholder="Note to the writer (when returning)" style={{ flex: 1, minWidth: 220 }} />
            <button className="btn sm" name="decision" value="approve"><i className="fa-solid fa-check" /> {p.stage === 'group' ? 'Approve → publication' : 'Approve & publish'}</button>
            <button className="btn sm danger" name="decision" value="reject">Return</button>
          </div>
        </form>))}
    </div>
  );
}
