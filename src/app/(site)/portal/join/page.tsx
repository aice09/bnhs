import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { browseGroups, MEMBER_CATEGORIES } from '@/lib/groups';
import GroupButtons from '../GroupButtons';

export const metadata = { title: 'Join a group', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function JoinPage() {
  const user = await requireUser();
  const all = await browseGroups(user.id);
  return (
    <div className="portal">
      <p><Link href="/portal">← My portal</Link></p>
      <h1>Join a group, center or team</h1>
      <p className="help">Pick a category, then apply. The manager, coach or team leader approves your request. You can leave at any time (also with approval) and rejoin later; your history is kept.</p>
      {MEMBER_CATEGORIES.map((c) => {
        const groups = all.filter((g) => c.depts.includes(g.dept));
        const types = [...new Set(groups.map((g) => g.type))];
        return (
          <div className="panel" key={c.key} id={c.key}>
            <h2 style={{ marginTop: 0 }}><i className={`fa-solid fa-${c.icon}`} /> {c.title}</h2>
            <p className="help">{c.blurb}</p>
            {groups.length === 0 && <div className="empty">Nothing to join here yet.</div>}
            {types.map((t) => (
              <div key={t}>
                <h3 style={{ margin: '14px 0 6px' }}>{t}</h3>
                <div className="grid g3">
                  {groups.filter((g) => g.type === t).map((g) => (
                    <div className="gcard" key={g.id}><div className="gb">
                      <h3><i className={`fa-solid fa-${g.icon || 'people-group'}`} /> <Link href={`/groups/${g.slug}`}>{g.name}</Link></h3>
                      {g.summary && <p>{g.summary}</p>}
                      <p className="help">{g.people || 'Manager not assigned yet'}</p>
                      <GroupButtons slug={g.slug} status={g.my_status} leave={g.my_leave} role={g.my_role} />
                    </div></div>))}
                </div>
              </div>))}
          </div>);
      })}
    </div>
  );
}
