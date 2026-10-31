import { cached } from './cache';
import { query, one } from './db';

export type Post = {
  id: number; slug: string; title: string; category: string; excerpt: string; content: string;
  image: string; placement: string; published_at: string; views: number;
  tags: string; sdg: string; group_id: number | null; group_name: string | null; group_slug: string | null; group_type: string | null;
};
export type Settings = Record<string, string>;

const TTL = 300;

export const getSettings = () =>
  cached<Settings>('c:settings', TTL, async () => {
    const rows = await query<{ key: string; value: string }>('SELECT key, value FROM settings');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }).catch((): Settings => ({}));

export type PageRow = { slug: string; title: string; subtitle: string; content: string; image: string; menu: string; sort: number; updated_at: string };

export const getPage = (slug: string) =>
  cached('c:page:' + slug, TTL, () => one<PageRow>(
    'SELECT slug, title, subtitle, content, image, menu, sort, updated_at FROM pages WHERE slug=$1 AND enabled', [slug]));

export const enabledPages = () =>
  cached('c:pages', TTL, () => query<Pick<PageRow, 'slug' | 'title' | 'menu' | 'sort'>>(
    'SELECT slug, title, menu, sort FROM pages WHERE enabled ORDER BY menu, sort, title'));

export type Item = {
  id: number; title: string; meta: string; description: string; image: string; url: string; icon: string;
  block: string; category: string; extra: string; section?: string; event_date: string | null; featured: boolean; tags: string; sdg: string;
  group_id: number | null; group_name: string | null; group_slug: string | null; group_type: string | null;
};
const ITEM_SQL = `SELECT i.id, i.section, i.title, i.meta, i.description, i.image, i.url, i.icon, i.block, i.category, i.extra,
  to_char(i.event_date,'YYYY-MM-DD') AS event_date, i.featured, i.tags, i.sdg, i.group_id, g.name AS group_name, g.slug AS group_slug, g.type AS group_type
  FROM items i LEFT JOIN groups g ON g.id = i.group_id WHERE i.enabled AND (i.group_id IS NULL OR ((g.listed OR g.is_office) AND g.status = 'approved'))`;

export const listItems = (section: string) =>
  cached('c:items:' + section, TTL, () => query<Item>(
    `${ITEM_SQL} AND i.section=$1 ORDER BY i.sort, i.event_date DESC NULLS LAST, i.id DESC`, [section]));

export const getItemById = (id: number) => one<Item>(`${ITEM_SQL} AND i.id=$1`, [id]);

export const getItem = (id: number, section: string, block: string) =>
  one<Item>(`${ITEM_SQL} AND i.id=$1 AND i.section=$2 AND i.block=$3`, [id, section, block]);

export const groupItemsBySection = (groupId: number) =>
  cached('c:gitems2:' + groupId, TTL, () => query<Item>(
    `${ITEM_SQL} AND i.group_id=$1 ORDER BY i.sort, i.event_date DESC NULLS LAST, i.id DESC`, [groupId]));

const POST_COLS = `p.id, p.slug, p.title, p.category, p.excerpt, p.content, p.image, p.placement, p.published_at, p.views, p.tags, p.sdg,
  p.group_id, g.name AS group_name, g.slug AS group_slug, g.type AS group_type`;
const FROM = 'posts p LEFT JOIN groups g ON g.id = p.group_id';
const LIVE = "p.published = true AND p.status = 'published' AND p.published_at <= now()";

export async function listPosts(opts: { category?: string; group?: string; tag?: string; q?: string; page?: number; limit?: number; sort?: string; month?: string } = {}) {
  const { category, group, tag, q, page = 1, limit = 9, sort = 'latest', month } = opts;
  const order = sort === 'oldest' ? 'p.published_at ASC' : sort === 'popular' ? 'p.views DESC, p.published_at DESC' : 'p.published_at DESC';
  return cached('c:posts:' + JSON.stringify([category, group, tag, q, page, limit, sort, month]), 120, async () => {
    const where = [LIVE];
    const params: unknown[] = [];
    if (category) { params.push(category); where.push(`p.category = $${params.length}`); }
    if (group === 'school') where.push('p.group_id IS NULL');
    else if (group) { params.push(group); where.push(`g.slug = $${params.length}`); }
    if (tag) { params.push(tag.toLowerCase()); where.push(`string_to_array(p.tags, ',') @> ARRAY[$${params.length}]`); }
    if (month && /^\d{4}-\d{2}$/.test(month)) { params.push(month); where.push(`to_char(p.published_at,'YYYY-MM') = $${params.length}`); }
    if (q) { params.push(`%${q}%`); where.push(`(p.title ILIKE $${params.length} OR p.excerpt ILIKE $${params.length})`); }
    const w = where.join(' AND ');
    const total = Number((await one<{ n: string }>(`SELECT count(*) n FROM ${FROM} WHERE ${w}`, params))!.n);
    const items = await query<Post>(
      `SELECT ${POST_COLS} FROM ${FROM} WHERE ${w} ORDER BY ${order} LIMIT ${limit} OFFSET ${(page - 1) * limit}`, params);
    return { items, total };
  });
}

export const latestPosts = (n = 3) => listPosts({ limit: n }).then((r) => r.items);

// News for a topic page: posts carrying one of the tags, or written by a group of the given types.
export const postsAbout = (tags: string[], groupTypes: string[] = [], n = 3) =>
  cached(`c:about:${tags}:${groupTypes}:${n}`, 120, () =>
    query<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE}
      AND (string_to_array(p.tags, ',') && $1::text[] OR g.type = ANY($2::text[]))
      ORDER BY p.published_at DESC LIMIT ${n}`, [tags, groupTypes]));

// Articles tagged with an SDG (optionally one goal), plus anything tagged #sdg.
export const postsSdg = (goal: number | null, n = 9) =>
  cached(`c:sdgposts:${goal ?? 'all'}:${n}`, 120, () =>
    query<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE}
      AND (${goal ? "$1 = ANY(string_to_array(p.sdg, ',')::int[])" : "(p.sdg <> '' OR string_to_array(p.tags, ',') && ARRAY['sdg','sustainability'])"})
      ORDER BY p.published_at DESC LIMIT ${n}`, goal ? [goal] : []));

export const getPost = (slug: string) =>
  cached('c:post:' + slug, 120, () => one<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE p.slug=$1 AND ${LIVE}`, [slug]));

// Main story: newest post marked "Main"; falls back to the newest highlight, then the newest post.
export const featuredPost = () =>
  cached('c:featured', 120, () =>
    one<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE}
      ORDER BY (p.placement='Main') DESC, (p.placement='Highlight') DESC, p.published_at DESC LIMIT 1`));

export const highlightPosts = (excludeId: number | null, n = 3) =>
  cached(`c:highlights:${excludeId}:${n}`, 120, () =>
    query<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE} AND p.placement='Highlight' AND p.id <> $1
      ORDER BY p.published_at DESC LIMIT ${n}`, [excludeId ?? 0]));

export const popularPosts = (n = 5) =>
  cached('c:popular', 120, () =>
    query<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE} ORDER BY p.views DESC, p.published_at DESC LIMIT ${n}`));

export const postCategories = () =>
  cached('c:cats', 120, () =>
    query<{ category: string; n: string }>(`SELECT p.category, count(*) n FROM ${FROM} WHERE ${LIVE} GROUP BY p.category ORDER BY p.category`));

// Who wrote the news: the school itself or a group (student group, research center, publication team…).
export const postSources = () =>
  cached('c:sources', 120, () =>
    query<{ slug: string; name: string; n: string }>(`SELECT g.slug, g.name, count(*) n FROM ${FROM} WHERE ${LIVE} AND g.id IS NOT NULL
      GROUP BY g.slug, g.name ORDER BY g.name`));

export const allPostSlugs = () =>
  query<{ slug: string; updated_at: string }>(`SELECT p.slug, p.updated_at FROM ${FROM} WHERE ${LIVE}`);

export const bumpViews = (id: number) => query('UPDATE posts SET views = views + 1 WHERE id=$1', [id]);

export const listStaff = () =>
  cached('c:staff', TTL, () => query<{ id: number; name: string; position: string; department: string; category: string }>(
    'SELECT id, name, position, department, category FROM staff ORDER BY sort, name'));

export const listPrograms = () =>
  cached('c:programs', TTL, () => query<{ id: number; name: string; level: string; track: string; description: string; icon: string }>(
    'SELECT id, name, level, track, description, icon FROM programs ORDER BY sort, name'));

export const listDownloads = () =>
  cached('c:downloads', TTL, () => query<{ id: number; title: string; description: string; url: string; category: string; created_at: string }>(
    'SELECT id, title, description, url, category, created_at FROM downloads ORDER BY created_at DESC'));

export type Group = {
  id: number; slug: string; name: string; type: string; summary: string; description: string; image: string; icon: string;
  adviser: string; contact: string; info: string; members: number;
};
const GROUP_COLS = `g.id, g.slug, g.name, g.type, g.summary, g.description, g.image, g.icon, g.adviser, g.contact, g.info,
  (SELECT count(*)::int FROM group_members m JOIN users u ON u.id = m.user_id AND u.status = 'active' AND m.status = 'active' WHERE m.group_id = g.id) AS members`;

export const listGroups = (types?: string[], exclude?: string[]) =>
  cached(`c:groups:${types}:${exclude}`, TTL, () =>
    query<Group>(`SELECT ${GROUP_COLS} FROM groups g WHERE g.listed AND g.status = 'approved'
      AND ($1::text[] IS NULL OR g.type = ANY($1)) AND ($2::text[] IS NULL OR NOT g.type = ANY($2)) ORDER BY g.sort, g.name`,
      [types ?? null, exclude ?? null]));

export const getGroup = (slug: string) =>
  cached('c:group:' + slug, TTL, () => one<Group>(`SELECT ${GROUP_COLS} FROM groups g WHERE g.slug=$1 AND g.listed AND g.status = 'approved'`, [slug]));

export type GroupItem = { id: number; kind: string; title: string; meta: string; description: string; url: string; image: string };
export const groupItems = (groupId: number) =>
  cached('c:gitems:' + groupId, TTL, () =>
    query<GroupItem>('SELECT id, kind, title, meta, description, url, image FROM group_items WHERE group_id=$1 AND NOT members_only ORDER BY created_at DESC', [groupId]));

export const groupPosts = (groupId: number, n = 6) =>
  cached(`c:gposts:${groupId}:${n}`, 120, () =>
    query<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE} AND p.group_id=$1 ORDER BY p.published_at DESC LIMIT ${n}`, [groupId]));

export type Alumnus = {
  id: number; name: string; grad_year: number | null; program: string; occupation: string; employer: string; location: string;
  bio: string; photo: string; linkedin: string; contact_email: string; show_contact: boolean; featured: boolean;
};
const ALUMNI_COLS = `u.id, u.name, a.grad_year, a.program, a.occupation, a.employer, a.location, a.bio, a.photo, a.linkedin,
  a.contact_email, a.show_contact, a.featured`;
const ALUMNI_FROM = "alumni_profiles a JOIN users u ON u.id = a.user_id WHERE u.status = 'active' AND u.role = 'alumni' AND a.listed";

export const listAlumni = () =>
  cached('c:alumni', 120, () => query<Alumnus>(`SELECT ${ALUMNI_COLS} FROM ${ALUMNI_FROM} ORDER BY a.featured DESC, a.grad_year DESC NULLS LAST, u.name`));

export const getAlumnus = (id: number) =>
  cached('c:alumnus:' + id, 120, () => one<Alumnus>(`SELECT ${ALUMNI_COLS} FROM ${ALUMNI_FROM} AND u.id=$1`, [id]));

export const tagCloud = (n = 20) =>
  cached('c:tagcloud:' + n, 300, () =>
    query<{ tag: string; n: string }>(`SELECT t AS tag, count(*) n FROM (SELECT unnest(string_to_array(p.tags, ',')) t FROM ${FROM} WHERE ${LIVE}) x
      WHERE t <> '' AND t <> 'sample' GROUP BY t ORDER BY count(*) DESC, t LIMIT ${n}`));

export const postMonths = () =>
  cached('c:postmonths', 300, () =>
    query<{ month: string; n: string }>(`SELECT to_char(p.published_at,'YYYY-MM') AS month, count(*) n FROM ${FROM} WHERE ${LIVE} GROUP BY 1 ORDER BY 1 DESC LIMIT 18`));

export const relatedPosts = (post: Post, n = 3) =>
  cached(`c:related:${post.id}:${n}`, 120, () =>
    query<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE} AND p.id <> $1
      ORDER BY (p.category = $2 OR string_to_array(p.tags, ',') && string_to_array($3, ',') OR (p.group_id IS NOT NULL AND p.group_id = $4)) DESC, p.published_at DESC
      LIMIT ${n}`, [post.id, post.category, post.tags || '-', post.group_id ?? 0]));

export const adjacentPosts = (post: Post) =>
  cached(`c:adjacent:${post.id}`, 120, async () => ({
    prev: await one<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE} AND p.published_at < $1 ORDER BY p.published_at DESC LIMIT 1`, [post.published_at]),
    next: await one<Post>(`SELECT ${POST_COLS} FROM ${FROM} WHERE ${LIVE} AND p.published_at > $1 ORDER BY p.published_at ASC LIMIT 1`, [post.published_at]),
  }));

// A person's group history (including groups they left), credited achievements and papers.
export type Person = {
  groups: { slug: string; name: string; type: string; role: string; title: string; status: string; joined: string; left: string | null; listed: boolean }[];
  achievements: { id: number; title: string; event_date: string | null; category: string }[];
  papers: { id: number; title: string; venue: string; year: number | null; url: string; abstract: string }[];
};
export async function personHistory(userId: number): Promise<Person> {
  const [groups, achievements, papers] = await Promise.all([
    query<Person['groups'][number]>(
      `SELECT g.slug, g.name, g.type, m.role, m.title, m.status, to_char(m.created_at,'YYYY-MM-DD') AS joined, to_char(m.left_at,'YYYY-MM-DD') AS left, g.listed AND g.status='approved' AS listed
       FROM group_members m JOIN groups g ON g.id = m.group_id WHERE m.user_id=$1 AND m.status IN ('active','left') AND NOT g.is_office ORDER BY (m.status='active') DESC, m.created_at DESC`, [userId]),
    query<Person['achievements'][number]>(
      `SELECT i.id, i.title, to_char(i.event_date,'YYYY-MM-DD') AS event_date, i.category FROM item_people ip JOIN items i ON i.id = ip.item_id
       WHERE ip.user_id=$1 AND i.enabled ORDER BY i.event_date DESC NULLS LAST`, [userId]),
    query<Person['papers'][number]>('SELECT id, title, venue, year, url, abstract FROM papers WHERE user_id=$1 ORDER BY year DESC NULLS LAST, id DESC', [userId]),
  ]);
  return { groups, achievements, papers };
}

export const upcomingItems = (n = 4) =>
  cached('c:upcoming:' + n, 300, () => query<Item>(
    `${ITEM_SQL} AND i.event_date >= current_date AND i.section NOT IN ('facts') ORDER BY i.event_date, i.id LIMIT ${Number(n)}`));
