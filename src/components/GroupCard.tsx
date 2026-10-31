import Link from 'next/link';
import type { Group } from '@/lib/queries';

export default function GroupCard({ g }: { g: Group }) {
  return (
    <Link href={`/groups/${g.slug}`} className="gcard">
      <div className="gimg">{g.image ? <img src={g.image} alt="" loading="lazy" /> : <i className={`fa-solid fa-${g.icon || 'people-group'}`} />}</div>
      <div className="gb">
        <span className="badge">{g.type}</span>
        <h3>{g.name}</h3>
        {g.summary && <p>{g.summary}</p>}
        <p style={{ marginTop: 6 }}><i className="fa-solid fa-users" /> {g.members} member{g.members === 1 ? '' : 's'}{g.adviser && <> · Adviser: {g.adviser}</>}</p>
      </div>
    </Link>
  );
}
