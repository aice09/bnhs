import type { Metadata } from 'next';
import Link from 'next/link';
import { describe } from '@/lib/site';
import PageHero from '@/components/PageHero';
import { listPrograms, getSettings } from '@/lib/queries';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Academic Programs', description: describe(s, 'Academic programs and tracks'), alternates: { canonical: '/academics' } };
}

export default async function Academics() {
  const programs = await listPrograms();
  const levels = ['Junior High School', 'Senior High School'];
  return (
    <>
      <PageHero title="Academic Programs" sub="Junior High School and Senior High School under one campus." crumbs={[['Academics']]} />
      <section className="s"><div className="wrap">
        {levels.map((lv) => (
          <div key={lv} style={{ marginBottom: 40 }}>
            <h2>{lv}</h2>
            <div className="grid g2">
              {programs.filter((p) => p.level === lv).map((p) => (
                <div className="card" key={p.id}><div className="body">
                  <span className="pico"><i className={`fa-solid fa-${p.icon}`} /></span>
                  <h3>{p.name}</h3><div className="meta">{p.track}</div><p>{p.description}</p>
                </div></div>
              ))}
            </div>
          </div>
        ))}
        <div className="side"><h3>Work immersion</h3>
          <p style={{ margin: 0 }}>Grade 12 Senior High School learners take part in a school-based work immersion that applies classroom skills in a real work setting. <Link href="/news">See related news</Link>.</p></div>
        <Link className="btn" href="/admissions">How to enroll</Link>
      </div></section>
    </>
  );
}
