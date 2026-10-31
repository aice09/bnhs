import type { Metadata } from 'next';
import DataTable from '@/components/DataTable';
import { describe } from '@/lib/site';
import PageHero from '@/components/PageHero';
import { listStaff, getSettings } from '@/lib/queries';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Faculty & Staff Directory', description: describe(s, 'Faculty and staff directory'), alternates: { canonical: '/faculty' } };
}

const columns = [
  { key: 'name', title: 'Name' }, { key: 'position', title: 'Position' },
  { key: 'department', title: 'Department / Subject' }, { key: 'category', title: 'Category' },
];

export default async function Faculty() {
  const staff = await listStaff();
  return (
    <>
      <PageHero title="Faculty & Staff" sub="Search and filter the school directory." crumbs={[['Faculty']]} />
      <section className="s"><div className="wrap"><DataTable columns={columns} rows={staff} /></div></section>
    </>
  );
}
