import Link from 'next/link';

const LINKS = [
  ['/alumni', 'Home', 'house'], ['/alumni/directory', 'Directory', 'address-book'],
  ['/alumni/events', 'Events', 'calendar-days'], ['/alumni/stories', 'Stories', 'book-open-reader'],
] as const;

export default function AlumniNav({ active }: { active: string }) {
  return (
    <div className="subnav"><div className="wrap">
      {LINKS.map(([href, label, icon]) => (
        <Link key={href} href={href} className={active === href ? 'on' : ''}><i className={`fa-solid fa-${icon}`} /> {label}</Link>))}
    </div></div>
  );
}

export function JoinButtons({ isAlumni }: { isAlumni: boolean }) {
  return (
    <div className="row" style={{ marginTop: 18 }}>
      {isAlumni
        ? <Link className="btn" href="/portal"><i className="fa-solid fa-id-card" /> My alumni dashboard</Link>
        : <><Link className="btn" href="/portal/register?as=alumni"><i className="fa-solid fa-user-plus" /> Join the alumni network</Link>
          <Link className="btn out" href="/portal/login?as=alumni"><i className="fa-solid fa-right-to-bracket" /> Alumni login</Link></>}
    </div>
  );
}

export const fmtDate = (d: string | null) =>
  d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
