import type { Metadata } from 'next';
import Link from 'next/link';
import { describe } from '@/lib/site';
import PageHero from '@/components/PageHero';
import { renderMarkdown } from '@/lib/content';
import ApplyForm from './ApplyForm';
import { getPage, getSettings } from '@/lib/queries';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Admissions & Enrollment', description: describe(s, 'Enrollment requirements and admission details'), alternates: { canonical: '/admissions' } };
}

export default async function Admissions() {
  const page = await getPage('admissions');
  return (
    <>
      <PageHero title={page?.title || 'Admissions'} sub={page?.subtitle} crumbs={[['Admissions']]} />
      <section className="s"><div className="wrap two">
        <article>
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page?.content || '') }} />
          <div className="panelc" id="apply" style={{ marginTop: 28 }}><h2 style={{ marginTop: 0 }}><i className="fa-solid fa-clipboard-check" /> Apply or request a transfer</h2>
            <p className="help">Your request goes to the Admission Office, which approves enrollment and transfers.</p><ApplyForm /></div>
        </article>
        <aside><div className="side"><h3>Need help?</h3><p>Send us a question and the school will get back to you.</p><Link className="btn" href="/contact">Contact the school</Link></div></aside>
      </div></section>
    </>
  );
}
