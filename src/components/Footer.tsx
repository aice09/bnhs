import Link from 'next/link';
import Logo from './Logo';
import type { NavGroup } from '@/lib/nav';
import type { Settings } from '@/lib/queries';

export default function Footer({ s, groups }: { s: Settings; groups: NavGroup[] }) {
  const cols = groups.filter((g) => g.items.length > 1).slice(0, 3).map((g) => ({ ...g, items: g.items.slice(0, 6) }));
  return (
    <footer className="site">
      <div className="wrap">
        <div className="fgrid">
          <div>
            <div className="row" style={{ flexWrap: 'nowrap', marginBottom: 12 }}>
              <Logo src={s.logo_url} name={s.school_name} size={64} />
              <div><h4 style={{ margin: 0 }}>{s.short_name}</h4><div>{s.school_name}</div></div>
            </div>
            <p className="fsmall">{s.tagline}{s.tagline && '. '}{s.levels_text}{s.city ? ` in ${[s.city, s.province].filter(Boolean).join(', ')}` : ''}.</p>
            <p className="fsmall"><i className="fa-solid fa-location-dot" /> {s.address}</p>
            {s.phone && <p className="fsmall"><i className="fa-solid fa-phone" /> {s.phone}</p>}
            {s.email && <p className="fsmall"><i className="fa-solid fa-envelope" /> <a style={{ display: 'inline' }} href={`mailto:${s.email}`}>{s.email}</a></p>}
          </div>
          {cols.map((g) => (
            <div key={g.label}>
              <h4>{g.label}</h4>
              {g.items.map((i) => <Link key={i.href} href={i.href}>{i.label}</Link>)}
            </div>
          ))}
          <div>
            <h4>Portals</h4>
            <Link href="/portal/login?as=student"><i className="fa-solid fa-user-graduate" /> Student login</Link>
            <Link href="/portal/login?as=alumni"><i className="fa-solid fa-people-roof" /> Alumni login</Link>
            <Link href="/portal/login?as=research"><i className="fa-solid fa-microscope" /> Research center login</Link>
            <Link href="/portal/login?as=athletics"><i className="fa-solid fa-medal" /> Athletics login</Link>
            <Link href="/portal/login?as=partner"><i className="fa-solid fa-handshake" /> Partner login</Link>
            <Link href="/admin"><i className="fa-solid fa-lock" /> Staff / admin login</Link>
          </div>
          <div>
            <h4>Connect</h4>
            {s.facebook_url && <a href={s.facebook_url} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-facebook" /> Facebook page</a>}
            <a href="https://www.deped.gov.ph" target="_blank" rel="noopener noreferrer"><i className="fa-solid fa-landmark" /> DepEd</a>
            <Link href="/news">News &amp; Announcements</Link>
            <Link href="/contact"><i className="fa-solid fa-paper-plane" /> Send a message</Link>
          </div>
        </div>
        <div className="copy">
          <span>© {new Date().getFullYear()} {s.school_name} ({s.short_name}). {s.school_id && `School ID ${s.school_id}.`}</span>
          <span><Link href="/sitemap.xml" style={{ display: 'inline', marginRight: 14 }}>Site map</Link><Link href="/admin" style={{ display: 'inline' }}>Staff login</Link></span>
        </div>
      </div>
    </footer>
  );
}
