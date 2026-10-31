import type { Metadata } from 'next';
import AlumniDirectory from '@/components/AlumniDirectory';
import AlumniNav, { JoinButtons } from '@/components/AlumniNav';
import PageHero from '@/components/PageHero';
import { getUser } from '@/lib/auth';
import { getSettings, listAlumni } from '@/lib/queries';
import { describe } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Alumni Directory', description: describe(s, 'Find and connect with alumni by name, batch, occupation or place'), alternates: { canonical: '/alumni/directory' } };
}

export default async function Directory() {
  const [alumni, user] = await Promise.all([listAlumni(), getUser()]);
  return (
    <>
      <PageHero title="Alumni Directory" sub="Connect. Collaborate. Create opportunities." crumbs={[['Alumni', '/alumni'], ['Directory']]} />
      <AlumniNav active="/alumni/directory" />
      <section className="s"><div className="wrap">
        <p className="blurb">Search by name, batch, strand, occupation or place. Alumni appear here after the school approves their registration and only if they choose to be listed.</p>
        {alumni.length === 0 ? <div className="empty">No alumni profiles yet. Be the first to join!</div>
          : <AlumniDirectory rows={alumni.map((a) => ({ id: a.id, name: a.name, grad_year: a.grad_year, program: a.program, occupation: a.occupation, employer: a.employer, location: a.location, photo: a.photo, featured: a.featured }))} />}
        <JoinButtons isAlumni={user?.role === 'alumni'} />
      </div></section>
    </>
  );
}
