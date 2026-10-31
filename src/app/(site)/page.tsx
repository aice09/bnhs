import Link from 'next/link';
import DateBadge from '@/components/DateBadge';
import HeroCarousel, { type Slide } from '@/components/HeroCarousel';
import Logo from '@/components/Logo';
import PostCard from '@/components/PostCard';
import { fmtDate } from '@/lib/content';
import { featuredPost, getPage, getSettings, highlightPosts, latestPosts, listPrograms, upcomingItems } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [s, posts, programs, history, main, upcoming] = await Promise.all([
    getSettings(), latestPosts(6), listPrograms(), getPage('history'), featuredPost(), upcomingItems(4),
  ]);
  const highlights = await highlightPosts(main?.id ?? null, 3);
  const slides: Slide[] = [
    { key: 'school', kicker: s.home_eyebrow, title: s.hero_title, text: s.hero_subtitle, image: '', href: '/admissions', cta: 'Enroll now' },
    ...[main, ...highlights].filter((p): p is NonNullable<typeof main> => !!p && !!p.image).slice(0, 4).map((p) => (
      { key: 'p' + p.id, kicker: p.placement === 'Main' ? 'Top story' : p.category, title: p.title, text: p.excerpt, image: p.image, href: `/news/${p.slug}`, cta: 'Read story' })),
  ];
  const audience: [string, string, string, string][] = [
    ['user-plus', 'Future students', '/admissions', 'Admissions'], ['user-graduate', 'Current students', '/portal/login', 'Portal'],
    ['chalkboard-user', 'Faculty & staff', '/faculty', 'Our teachers'], ['users', 'Alumni', '/alumni', 'Reconnect'],
    ['flask', 'Researchers', '/research', 'Research center'], ['handshake', 'Partners', '/partnerships', 'Collaborate'],
    ['bullhorn', 'The public', '/news', 'News & events'],
  ];
  const intro = (history?.content || '').split('\n').find((l) => l.length > 80 && !l.startsWith('#')) || '';
  return (
    <>
      {s.home_hero === 'static' ? (
        <section className="hero">
          <div className="wrap hero-in">
            <div>
              <div className="eyebrow">{s.home_eyebrow}</div>
              <h1>{s.hero_title}</h1>
              <p>{s.hero_subtitle}</p>
              <div className="btns">
                <Link className="btn gold" href="/admissions"><i className="fa-solid fa-user-plus" /> Enroll now</Link>
                <Link className="btn ghost" href="/academics"><i className="fa-solid fa-graduation-cap" /> Our programs</Link>
              </div>
            </div>
            <div className="hero-logo"><Logo src={s.logo_url} name={s.school_name} size={300} /></div>
          </div>
        </section>
      ) : <HeroCarousel slides={slides} />}

      <div className="wrap">
        <nav className="aud" aria-label="Quick access">
          {audience.map(([icon, t, href, sub]) => <Link key={t} href={href}><i className={`fa-solid fa-${icon}`} /><b>{t}</b><small>{sub}</small></Link>)}
        </nav>
      </div>

      {main && (
        <section className="s">
          <div className="wrap">
            <div className="sh"><div><div className="eyebrow">Top story</div><h2>Headline &amp; Highlights</h2></div><Link href="/news">All news →</Link></div>
            <div className="headline">
              <Link href={`/news/${main.slug}`} className={'main-story' + (main.image ? ' has-img' : '')} style={main.image ? { backgroundImage: `linear-gradient(0deg,color-mix(in srgb,var(--g9) 92%,transparent),color-mix(in srgb,var(--g9) 15%,transparent)), url(${main.image})` } : undefined}>
                <span className="tag gold"><i className="fa-solid fa-star" /> {main.placement === 'Main' ? 'Top story' : main.category}</span>
                <h3>{main.title}</h3>
                <p>{main.excerpt}</p>
                <small>{fmtDate(main.published_at, { dateStyle: 'long' })} · Read full story →</small>
              </Link>
              <div className="hl-list">
                {highlights.map((h) => (
                  <Link href={`/news/${h.slug}`} className="hl" key={h.id}>
                    <div className="hl-thumb">{h.image ? <img src={h.image} alt="" loading="lazy" /> : <i className="fa-solid fa-newspaper" />}</div>
                    <div><span className="tag">{h.category}</span><h4>{h.title}</h4><small className="meta">{fmtDate(h.published_at)}</small></div>
                  </Link>
                ))}
                {highlights.length === 0 && <div className="side" style={{ margin: 0 }}>Mark a post as <b>Highlight</b> in the CMS to show it here.</div>}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={'s' + (main ? ' alt' : '')}>
        <div className="wrap two">
          <div>
            <div className="eyebrow">About the school</div>
            <h2 style={{ fontSize: 34, margin: '6px 0 14px' }}>Serving the {s.community_name} community{s.established ? ` since ${s.established}` : ''}</h2>
            <p>{intro.replace(/\*\*/g, '')}</p>
            <p>{s.school_name} offers {s.levels_text}{s.learners_from ? ` to learners from ${s.learners_from}` : ''}.</p>
            <div className="row"><Link className="btn" href="/about/history">Read our history</Link><Link className="btn out" href="/about/mission-vision">Mission &amp; Vision</Link><Link className="btn out" href="/facts">Facts</Link></div>
          </div>
          <div className="facts" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="fact"><b>{s.established}</b><span>Year established</span></div>
            <div className="fact"><b>7–12</b><span>Grade levels</span></div>
            <div className="fact"><b>{s.feeder_barangays || '—'}</b><span>Feeder barangays</span></div>
            <div className="fact"><b>{s.land_area || '—'}</b><span>Campus area</span></div>
          </div>
        </div>
      </section>

      <section className={'s' + (main ? '' : ' alt')}>
        <div className="wrap">
          <div className="sh"><div><div className="eyebrow">Academics</div><h2>Junior High &amp; Senior High School</h2></div><Link href="/academics">All programs →</Link></div>
          <div className="grid g3">
            {programs.map((p) => (
              <div className="card" key={p.id}><div className="body">
                <span className="pico"><i className={`fa-solid fa-${p.icon}`} /></span>
                <span className="meta">{p.level}</span><h3>{p.name}</h3><p>{p.track}</p>
              </div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="s alt">
        <div className="wrap">
          <div className="sh"><div><div className="eyebrow">Latest</div><h2>News &amp; Announcements</h2></div><Link href="/news">View all →</Link></div>
          <div className="chips" style={{ marginBottom: 16 }}>
            {['News', 'Announcement', 'Events', 'Achievements', 'Research', 'Athletics', 'Alumni'].map((c) => <Link key={c} className="chip" href={`/news?category=${encodeURIComponent(c)}`}>{c}</Link>)}
          </div>
          <div className="grid g3">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
        </div>
      </section>

      <section className="s">
        <div className="wrap evstrip">
          <div>
            <div className="sh"><div><div className="eyebrow">Upcoming</div><h2>Events</h2></div><Link href="/alumni/events">Alumni events →</Link></div>
            {upcoming.length === 0 ? <div className="empty">No upcoming events yet.</div> : (
              <div className="evs">{upcoming.map((e) => (
                <Link key={e.id} href={`/items/${e.id}`} className="ev"><DateBadge date={e.event_date} /><span><b>{e.title}</b><br /><small className="meta">{e.group_name ?? e.category}</small></span></Link>))}</div>)}
          </div>
          <div>
            <div className="sh"><div><div className="eyebrow">Shortcuts</div><h2>Quick links</h2></div></div>
            <div className="ql">
              <Link href="/library"><i className="fa-solid fa-book-open" /> Library</Link><Link href="/scholarships"><i className="fa-solid fa-award" /> Scholarships</Link>
              <Link href="/achievements"><i className="fa-solid fa-trophy" /> Achievements</Link><Link href="/downloads"><i className="fa-solid fa-download" /> Downloads</Link>
              <Link href="/student-groups"><i className="fa-solid fa-people-group" /> Student groups</Link><Link href="/contact"><i className="fa-solid fa-envelope" /> Contact</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap">
          <h2>Enroll at {s.school_name}</h2>
          <p style={{ maxWidth: 640, margin: '0 auto 22px', color: 'var(--g1)' }}>{s.enrollment_note}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn gold" href="/admissions">Admission details</Link>
            <Link className="btn ghost" href="/contact">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
