import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PartnerGrid from '@/components/PartnerGrid';
import { renderMarkdown } from '@/lib/content';
import { getPage, getSettings, listItems } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [page, st] = await Promise.all([getPage('partnerships'), getSettings()]);
  if (!page) return {};
  return { title: page.title, description: `${page.subtitle}. Partner with ${st.school_name}.`, alternates: { canonical: '/partnerships' } };
}

export default async function Partnerships() {
  const page = await getPage('partnerships');
  if (!page) notFound();
  const items = await listItems('partnerships');
  const benefits = items.filter((i) => i.block === 'benefits');
  const partners = items.filter((i) => i.block === 'partners');
  const interestByBenefit: Record<string, string> = {
    'College scholarships': 'College scholarship',
    'Educational assistance': 'Educational assistance',
    'Training and workshops': 'Training or workshop',
    'School visits and immersion': 'School visit / immersion',
    Certifications: 'Certification',
    'Community projects': 'Community project',
  };
  return (
    <>
      <section className="partner-hero" style={page.image ? { backgroundImage: `linear-gradient(90deg,rgba(5,35,29,.92),rgba(5,35,29,.5)),url("${page.image}")` } : undefined}>
        <div className="wrap">
          <div className="partner-crumb"><Link href="/">Home</Link> / {page.title}</div>
          <div className="partner-hero-copy">
            <span className="eyebrow">BNNHS · COMMUNITY · OPPORTUNITY</span>
            <h1>{page.title}</h1>
            <p>{page.subtitle}</p>
            <div className="partner-hero-intro prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content.split('\n\n## Become a partner')[0]) }} />
            <Link className="btn gold" href="/partnerships/apply">Partner with us <i className="fa-solid fa-arrow-right" /></Link>
            <Link className="btn partner-guide" href="/partnerships/apply"><i className="fa-regular fa-file-lines" /> Explore opportunities</Link>
          </div>
        </div>
      </section>
      <div className="partner-stats"><div className="wrap">
        <div><i className="fa-solid fa-handshake" /><b>{partners.length}</b><span>Partner organizations</span></div>
        <div><i className="fa-solid fa-lightbulb" /><b>{benefits.length}</b><span>Ways to collaborate</span></div>
        <div><i className="fa-solid fa-graduation-cap" /><b>7–12</b><span>Junior &amp; Senior High learners</span></div>
      </div></div>
      <section className="s"><div className="wrap">
        {partners.length > 0 && <div className="partner-listing" id="partners">
          <div className="partner-listing-intro"><span className="eyebrow">PARTNER EXAMPLES</span><h2>Building lasting partnerships</h2>
            <p>These are examples of organizations the school can collaborate with. They are not a claim of an active partnership.</p>
            <Link className="btn" href="/partnerships/apply">Our partnership opportunities <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <PartnerGrid partners={partners} />
        </div>}
        {benefits.length > 0 && <div className="block partner-areas" id="benefits"><span className="eyebrow">PARTNERSHIP AREAS</span><h2>Areas of collaboration</h2><p className="blurb">We welcome partnerships that match your organization’s strengths with our learners’ needs.</p>
          <div className="grid g3">{benefits.map((b) => (
            <Link className="card" key={b.id} href={`/partnerships/apply?interest=${encodeURIComponent(interestByBenefit[b.title] ?? 'Other')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="body"><span className="pico"><i className={`fa-solid fa-${b.icon || 'handshake'}`} /></span><h3>{b.title}</h3>{b.description && <p>{b.description}</p>}
                <span className="more">Explore this opportunity <i className="fa-solid fa-arrow-right" /></span></div></Link>))}</div></div>}
        <div className="partner-feature">
          <div className="partner-feature-photo" style={page.image ? { backgroundImage: `url("${page.image}")` } : undefined}>
            <span className="eyebrow">WORKING TOGETHER</span><h2>Better opportunities start with partnership.</h2>
          </div>
          <div className="partner-feature-cta"><span className="eyebrow">BECOME A PARTNER</span><h2>Let’s create impact together.</h2>
            <p>Offer a scholarship, share expertise, host a school visit or help learners gain practical skills.</p>
            <ul>{benefits.slice(0, 4).map((b) => <li key={b.id}><i className="fa-solid fa-circle-check" /> {b.title}</li>)}</ul>
            <Link className="btn" href="/partnerships/apply">Get in touch <i className="fa-solid fa-arrow-right" /></Link>
          </div>
        </div>
      </div></section>
    </>
  );
}
