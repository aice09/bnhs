import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { getSettings } from '@/lib/queries';
import { describe } from '@/lib/site';
import { listModules, STATUS } from '@/lib/platform';
import { SUITES } from '@/lib/platform-registry.mjs';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Digital Services', description: describe(s, 'Online services for learners, parents, alumni and partners'), alternates: { canonical: '/digital-services' } };
}

export const dynamic = 'force-dynamic';

export default async function DigitalServices() {
  const s = await getSettings();
  const mods = (await listModules()).filter((m) => m.enabled && m.suite !== 'shared');
  return (
    <>
      <PageHero title="Digital Services" crumbs={[['Digital Services']]} />
      <section className="s"><div className="wrap">
        <p className="lead">{s.short_name || 'The school'} runs one connected digital platform: one account and one set of records for admissions, student life, research, partnerships and alumni.
          Services marked <b>Live</b> are ready to use; the others are being built.</p>
        {SUITES.filter(([k]) => k !== 'shared').map(([suite, title, icon]) => {
          const list = mods.filter((m) => m.suite === suite);
          if (list.length === 0) return null;
          return (
            <div key={suite} style={{ marginBottom: 28 }}>
              <h2><i className={`fa-solid fa-${icon}`} /> {title}</h2>
              <div className="grid g3">
                {list.map((m) => (
                  <div className="card" key={m.key}><div className="cb">
                    <span className={'badge' + STATUS[m.status].cls}>{STATUS[m.status].label}</span>
                    <h3>{m.name}</h3>
                    <p>{m.summary}</p>
                    {m.status !== 'planned' && (m.public_url || m.portal_url) && (
                      <p className="row">
                        {m.public_url && <Link className="btn sm" href={m.public_url}>Open <i className="fa-solid fa-arrow-right" /></Link>}
                        {m.portal_url && <Link className="btn sm out" href={`/portal/login?next=${encodeURIComponent(m.portal_url)}`}>Sign in</Link>}
                      </p>)}
                  </div></div>))}
              </div>
            </div>);
        })}
      </div></section>
    </>
  );
}
