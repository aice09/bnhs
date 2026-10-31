import type { Metadata } from 'next';
import AlumniNav from '@/components/AlumniNav';
import StoryCards from '@/components/StoryCards';
import PageHero from '@/components/PageHero';
import PostCard from '@/components/PostCard';
import { getSettings, listItems, postsAbout } from '@/lib/queries';
import { describe } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Alumni Stories', description: describe(s, 'Real people. Real impact. Stories of our graduates'), alternates: { canonical: '/alumni/stories' } };
}

export default async function Stories() {
  const [items, news] = await Promise.all([listItems('alumni'), postsAbout(['alumni'], [], 12)]);
  const stories = items.filter((i) => i.block === 'stories').sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <>
      <PageHero title="Alumni Stories" sub="Real people. Real impact." crumbs={[['Alumni', '/alumni'], ['Stories']]} />
      <AlumniNav active="/alumni/stories" />
      <section className="s"><div className="wrap">
        {stories.length === 0 && news.length === 0 && <div className="empty">No stories yet. Check back soon.</div>}
        {stories.length > 0 && <StoryCards items={stories} />}
        {news.length > 0 && <div className="block"><h2>Alumni news</h2><div className="grid g3">{news.map((p) => <PostCard key={p.id} p={p} />)}</div></div>}
      </div></section>
    </>
  );
}
