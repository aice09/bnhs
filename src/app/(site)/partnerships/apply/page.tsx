import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { getPage } from '@/lib/queries';
import { PARTNER_INTERESTS, PARTNER_TYPES } from '@/lib/partners';
import PartnerForm from './PartnerForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Become a partner', alternates: { canonical: '/partnerships/apply' } };

export default async function PartnerApply({ searchParams }: { searchParams: Promise<{ interest?: string }> }) {
  const page = await getPage('partnerships');
  if (!page) notFound();
  const i = (await searchParams).interest ?? '';
  return (
    <>
      <PageHero title="Become a partner" sub="Tell us how you would like to help our learners" crumbs={[['Partnerships', '/partnerships'], ['Apply']]} />
      <section className="s"><div className="wrap" style={{ maxWidth: 780 }}>
        <PartnerForm types={PARTNER_TYPES} interests={PARTNER_INTERESTS} preset={PARTNER_INTERESTS.filter((x) => x === i)} />
        <p className="help" style={{ marginTop: 16 }}><Link href="/partnerships">← Back to partnerships</Link></p>
      </div></section>
    </>
  );
}
