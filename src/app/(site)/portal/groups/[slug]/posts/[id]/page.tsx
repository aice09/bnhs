import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ImageField from '@/components/ImageField';
import { requireUser } from '@/lib/auth';
import { one } from '@/lib/db';
import { accessFor } from '@/lib/groups';
import { saveGroupPost } from '../../../../actions';

export const metadata = { title: 'Write news', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const CATS = ['News', 'Announcement', 'Events', 'Achievements', 'Research', 'Athletics', 'Alumni', 'Impact'];

export default async function PostEditor({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug, id } = await params;
  const user = await requireUser();
  const g = await one<{ id: number; name: string; auto_publish: boolean }>('SELECT id, name, auto_publish FROM groups WHERE slug=$1', [slug]);
  if (!g || (id !== 'new' && !/^\d+$/.test(id))) notFound();
  const acc = await accessFor(user, slug);
  if (!acc || !acc.perms.has('post')) redirect(`/portal/groups/${slug}?denied=1`);
  const canPublish = acc.perms.has('publish');
  const p: any = id === 'new' ? { category: 'News', tags: '' } : await one('SELECT * FROM posts WHERE id=$1 AND group_id=$2', [Number(id), g.id]);
  if (!p) notFound();
  if (id !== 'new' && p.author_id !== user.id && !canPublish) redirect(`/portal/groups/${slug}?denied=1`);
  const err = (await searchParams).error;
  return (
    <div className="portal" style={{ maxWidth: 780 }}>
      <p><Link href={`/portal/groups/${slug}`}>← {g.name}</Link></p>
      <h1>{id === 'new' ? 'Write news' : 'Edit news'}</h1>
      {err && <div className="alert err">{err}</div>}
      {p.review_note && <div className="alert">Reviewer note: {p.review_note}</div>}
      <form className="panel" action={saveGroupPost.bind(null, slug, id)}>
        <div className="fld"><label>Title</label><input name="title" defaultValue={p.title} required maxLength={200} /></div>
        <div className="fld"><label>Category</label><select name="category" defaultValue={p.category}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="fld"><label>Tags (comma separated)</label><input name="tags" defaultValue={p.tags} placeholder="research, grade-12" /></div>
        <div className="fld"><label>Short summary</label><textarea name="excerpt" rows={2} defaultValue={p.excerpt} maxLength={300} /></div>
        <div className="fld"><label>Story (Markdown)</label><textarea name="content" rows={14} defaultValue={p.content} required style={{ fontFamily: 'monospace' }} /></div>
        <div className="fld"><label>Cover image</label><ImageField name="image" initial={p.image ?? ''} /></div>
        <p className="help">This story will be labelled <b>{g.name}</b> in the school news. {g.auto_publish || acc.admin ? 'Publishing is immediate.' : canPublish ? 'It goes to the publication manager for approval, then publishes.' : 'It goes to the group manager, then the publication manager, before it is published.'} Highlighting on the home page is decided by the school.</p>
        <div className="row">
          <button className="btn" name="submit" value="publish">{g.auto_publish || acc.admin ? 'Publish' : 'Submit for approval'}</button>
          <button className="btn out" name="submit" value="draft">Save as draft</button>
        </div>
      </form>
    </div>
  );
}
