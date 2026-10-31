import type { Metadata } from 'next';
import DataTable from '@/components/DataTable';
import { describe } from '@/lib/site';
import PageHero from '@/components/PageHero';
import { listDownloads, getSettings } from '@/lib/queries';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Downloads & Useful Links', description: describe(s, 'Forms, memoranda and useful links'), alternates: { canonical: '/downloads' } };
}

export default async function Downloads() {
  const rows = await listDownloads();
  return (
    <>
      <PageHero title="Downloads & Links" crumbs={[['Downloads']]} />
      <section className="s"><div className="wrap">
        <DataTable columns={[{ key: 'title', title: 'Title' }, { key: 'description', title: 'Description' }, { key: 'category', title: 'Category' }, { key: 'url', title: 'Link' }]} rows={rows} />
      </div></section>
    </>
  );
}
