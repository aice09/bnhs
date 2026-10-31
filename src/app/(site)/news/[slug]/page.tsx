import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { fmtDate, renderMarkdown } from '@/lib/content';
import { splitTags } from '@/lib/content';
import ShareBar from '@/components/ShareBar';
import { adjacentPosts, bumpViews, getPost, getSettings, relatedPosts } from '@/lib/queries';
import { siteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: { type: 'article', title: post.title, description: post.excerpt, publishedTime: post.published_at, images: post.image ? [post.image] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  bumpViews(post.id).catch(() => {});
  const site = siteUrl();
  const tags = splitTags(post.tags).filter((t) => t !== 'sample');
  const st = await getSettings();
  const [related, { prev, next }] = await Promise.all([relatedPosts(post), adjacentPosts(post)]);
  const words = post.content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  // Hashtags in the text become links to the matching news filter.
  const body = post.content.replace(/(^|[\s(])#([A-Za-z][\w-]*)/g, (_m, pre, t) => `${pre}[#${t}](/news?tag=${t.toLowerCase()})`);
  const ld = {
    '@context': 'https://schema.org', '@type': 'NewsArticle', headline: post.title, description: post.excerpt,
    datePublished: post.published_at, image: post.image ? [site + post.image] : undefined,
    mainEntityOfPage: `${site}/news/${post.slug}`,
    publisher: { '@type': 'Organization', name: post.group_name ? `${post.group_name} – ${st.school_name}` : st.school_name },
  };
  return (
    <>
      <PageHero title={post.title} sub={`${fmtDate(post.published_at, { dateStyle: 'long' })} · ${minutes} min read`} crumbs={[['News', '/news'], [post.category, `/news?category=${encodeURIComponent(post.category)}`], [post.title]]} />
      <section className="s"><div className="wrap">
        <div className="postlayout">
          <div>
            <div className="meta" style={{ marginBottom: 20 }}>
              <Link className="tag" href={`/news?category=${encodeURIComponent(post.category)}`}>{post.category}</Link>
              {post.group_name && <Link href={`/news?source=${post.group_slug ?? ''}`} className="tag gold"><i className="fa-solid fa-users" /> {post.group_name}</Link>}
              <time dateTime={post.published_at}><i className="fa-regular fa-calendar" /> {fmtDate(post.published_at, { dateStyle: 'long' })}</time>
              <span><i className="fa-regular fa-clock" /> {minutes} min read</span>
              <span><i className="fa-regular fa-eye" /> {post.views} views</span>
            </div>
            {post.image && <img src={post.image} alt={post.title} style={{ width: '100%', borderRadius: 10, marginBottom: 20 }} />}
            <article className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
            {tags.length > 0 && <div className="tagrow big"><i className="fa-solid fa-tags" /> {tags.map((t) => <Link key={t} href={`/news?tag=${t}`}>#{t}</Link>)}</div>}
            <ShareBar url={`${site}/news/${post.slug}`} title={post.title} />
            {(prev || next) && (
              <nav className="prevnext" aria-label="More stories">
                {prev ? <Link href={`/news/${prev.slug}`}><small><i className="fa-solid fa-arrow-left" /> Older</small><b>{prev.title}</b></Link> : <span />}
                {next ? <Link href={`/news/${next.slug}`} style={{ textAlign: 'right' }}><small>Newer <i className="fa-solid fa-arrow-right" /></small><b>{next.title}</b></Link> : <span />}
              </nav>)}
            <p><Link className="btn out" href="/news">← Back to news</Link></p>
          </div>
          <aside>
            {post.group_name && post.group_slug && (
              <div className="side"><h3>Posted by</h3><p style={{ margin: '0 0 10px' }}><i className="fa-solid fa-users" /> {post.group_name}</p>
                <Link className="btn sm" href={`/groups/${post.group_slug}`}>Visit group page</Link></div>)}
            {related.length > 0 && <div className="side"><h3>Related stories</h3>
              <ol className="pop">{related.map((r) => <li key={r.id}><span><Link href={`/news/${r.slug}`}>{r.title}</Link><br /><small className="meta">{fmtDate(r.published_at)}</small></span></li>)}</ol></div>}
          </aside>
        </div>
      </div></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
