import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { MODULES, SUITES } from '../src/lib/platform-registry.mjs';

for (const f of ['.env.local', '.env']) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const PROFILE = process.env.SCHOOL_PROFILE || 'template';
const profile = await import(`./profiles/${PROFILE}.mjs`);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const q = (t, p) => pool.query(t, p);


const fresh = (await q("SELECT 1 FROM settings WHERE key='school_name'").catch(() => ({ rows: [] }))).rows.length === 0;

await q(`
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY, email text UNIQUE NOT NULL, name text NOT NULL, password_hash text NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS pages (
  id serial PRIMARY KEY, slug text UNIQUE NOT NULL, title text NOT NULL, content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS posts (
  id serial PRIMARY KEY, slug text UNIQUE NOT NULL, title text NOT NULL, category text NOT NULL DEFAULT 'News',
  excerpt text NOT NULL DEFAULT '', content text NOT NULL DEFAULT '', image text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false, published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(), views int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS posts_pub_idx ON posts (published, published_at DESC);
CREATE TABLE IF NOT EXISTS staff (
  id serial PRIMARY KEY, name text NOT NULL, position text NOT NULL DEFAULT '', department text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Teaching', sort int NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS programs (
  id serial PRIMARY KEY, name text NOT NULL, level text NOT NULL DEFAULT 'Junior High School',
  track text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', icon text NOT NULL DEFAULT 'book',
  sort int NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS downloads (
  id serial PRIMARY KEY, title text NOT NULL, description text NOT NULL DEFAULT '', url text NOT NULL,
  category text NOT NULL DEFAULT 'General', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY, name text NOT NULL, email text NOT NULL, subject text NOT NULL DEFAULT '',
  message text NOT NULL, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
`);

// Schema upgrades (idempotent)
const hasCol = async (t, c) => (await q('SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2', [t, c])).rowCount > 0;
const needPostStatus = !(await hasCol('posts', 'status'));
await q(`
ALTER TABLE pages ADD COLUMN IF NOT EXISTS subtitle text NOT NULL DEFAULT '';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS menu text NOT NULL DEFAULT '';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS sort int NOT NULL DEFAULT 0;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS image text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'Normal';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sdg text NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS sdg text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id int;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id int;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_note text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY, section text NOT NULL, title text NOT NULL, meta text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '', image text NOT NULL DEFAULT '', url text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '', sort int NOT NULL DEFAULT 0, enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE items ADD COLUMN IF NOT EXISTS block text NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS extra text NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE items ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS tags text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS items_section_idx ON items (section, sort);
UPDATE posts SET placement='Highlight' WHERE featured AND placement='Normal';

ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions text[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamptz;

CREATE TABLE IF NOT EXISTS groups (
  id serial PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL, type text NOT NULL DEFAULT 'Student Organization',
  summary text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', private_content text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '', icon text NOT NULL DEFAULT 'people-group', adviser text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '', listed boolean NOT NULL DEFAULT true, auto_publish boolean NOT NULL DEFAULT false,
  sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE groups ADD COLUMN IF NOT EXISTS info text NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS group_id int REFERENCES groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS items_group_idx ON items (group_id);
CREATE TABLE IF NOT EXISTS group_members (
  group_id int NOT NULL REFERENCES groups(id) ON DELETE CASCADE, user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', permissions text[] NOT NULL DEFAULT '{}', title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (group_id, user_id));
CREATE TABLE IF NOT EXISTS group_items (
  id serial PRIMARY KEY, group_id int NOT NULL REFERENCES groups(id) ON DELETE CASCADE, kind text NOT NULL DEFAULT 'Event',
  title text NOT NULL, meta text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', url text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '', members_only boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS group_items_idx ON group_items (group_id, created_at DESC);
CREATE TABLE IF NOT EXISTS alumni_profiles (
  user_id int PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, grad_year int, program text NOT NULL DEFAULT '',
  occupation text NOT NULL DEFAULT '', employer text NOT NULL DEFAULT '', location text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '', photo text NOT NULL DEFAULT '', linkedin text NOT NULL DEFAULT '', contact_email text NOT NULL DEFAULT '',
  show_contact boolean NOT NULL DEFAULT false, listed boolean NOT NULL DEFAULT true, featured boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now());
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_group_fk FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS posts_group_idx ON posts (group_id);
`);

// Phase 5: offices (departments), approvals, membership history, papers, admissions.
await q(`
ALTER TABLE groups ADD COLUMN IF NOT EXISTS parent_id int REFERENCES groups(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS dept text NOT NULL DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_office boolean NOT NULL DEFAULT false;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS requested_by int REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS left_at timestamptz;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS leave_requested boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS group_member_log (
  id serial PRIMARY KEY, group_id int NOT NULL REFERENCES groups(id) ON DELETE CASCADE, user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL, actor_id int REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS group_member_log_user ON group_member_log(user_id, created_at DESC);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS item_people (
  item_id int NOT NULL REFERENCES items(id) ON DELETE CASCADE, user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, user_id));
CREATE TABLE IF NOT EXISTS papers (
  id serial PRIMARY KEY, user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE, title text NOT NULL,
  venue text NOT NULL DEFAULT '', year int, url text NOT NULL DEFAULT '', abstract text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS applications (
  id serial PRIMARY KEY, kind text NOT NULL DEFAULT 'Enrollment', name text NOT NULL, email text NOT NULL, phone text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT '', prev_school text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
`);
await q(`CREATE TABLE IF NOT EXISTS partner_requests (
  id serial PRIMARY KEY, org text NOT NULL, org_type text NOT NULL DEFAULT '', contact text NOT NULL, position text NOT NULL DEFAULT '',
  email text NOT NULL, phone text NOT NULL DEFAULT '', interests text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now())`);
await q(`CREATE TABLE IF NOT EXISTS platform_modules (
  key text PRIMARY KEY, no int NOT NULL, suite text NOT NULL, name text NOT NULL, summary text NOT NULL DEFAULT '', phase int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'planned', enabled boolean NOT NULL DEFAULT false, public_url text NOT NULL DEFAULT '', admin_url text NOT NULL DEFAULT '',
  portal_url text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`);
await q(`CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY, actor_id int REFERENCES users(id) ON DELETE SET NULL, actor text NOT NULL DEFAULT '', action text NOT NULL,
  entity text NOT NULL DEFAULT '', detail text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now())`);
await q('CREATE INDEX IF NOT EXISTS audit_log_created ON audit_log(created_at DESC)');
// Registry rows are inserted once; the administrator's edits (status, links, enabled) are never overwritten.
for (const [suite] of SUITES)
  for (const [no, key, name, summary, phase, status, pub, adm, portal] of MODULES[suite] ?? [])
    await q(`INSERT INTO platform_modules(key,no,suite,name,summary,phase,status,enabled,public_url,admin_url,portal_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (key) DO NOTHING`,
      [key, no, suite, name, summary, phase, status, status !== 'planned', pub, adm, portal]);
const OFFICES = [
  ['research-office', 'Research & Innovation Office', 'research', 'flask', ['Research Center'], false],
  ['athletics-office', 'Athletics Office', 'athletics', 'medal', ['Sports Team'], false],
  ['student-government', 'Student Government Body', 'sgo', 'landmark', [], true],
  ['campus-publication', 'Campus Publication', 'publication', 'newspaper', ['Publication'], true],
  ['alumni-association', 'Alumni Association', 'alumni', 'user-graduate', [], true],
  ['student-groups-office', 'Student Groups Office', 'student-groups', 'people-group', ['Project', 'Activity', 'SGO', 'Subject Club', 'Publication Team', 'Student Organization', 'Academic Club', 'Arts & Culture', 'Community Service', 'Other'], false],
  ['library-office', 'Library', 'library', 'book-open', [], true],
  ['admission-office', 'Admission Office', 'admission', 'clipboard-check', [], false],
  ['sdg-office', 'SDG Office', 'sdg', 'earth-asia', [], false],
  ['partnership-office', 'Partnerships Office', 'partnership', 'handshake', [], false],
];
for (const [slug, name, dept, icon, childTypes, listed] of OFFICES) {
  await q(`INSERT INTO groups(slug,name,type,icon,dept,is_office,listed,summary) VALUES($1,$2,'Office',$3,$4,true,$5,$6) ON CONFLICT (slug) DO NOTHING`,
    [slug, name, icon, dept, listed, name + ' office']);
  if (childTypes.length)
    await q(`UPDATE groups SET parent_id=(SELECT id FROM groups WHERE slug=$1), dept=$2 WHERE parent_id IS NULL AND NOT is_office AND type = ANY($3)`, [slug, dept, childTypes]);
}
if (!(await q("SELECT 1 FROM settings WHERE key='seeded:sports'")).rows.length) {
  const SPORTS = [['basketball', 'Basketball', 'basketball'], ['volleyball', 'Volleyball', 'volleyball'], ['badminton', 'Badminton', 'table-tennis-paddle-ball'], ['table-tennis', 'Table Tennis', 'table-tennis-paddle-ball'],
    ['track-and-field', 'Track and Field', 'person-running'], ['chess', 'Chess', 'chess'], ['arnis', 'Arnis', 'hand-fist'], ['sepak-takraw', 'Sepak Takraw', 'futbol']];
  for (const [slug, name, icon] of SPORTS)
    await q(`INSERT INTO groups(slug,name,type,icon,dept,parent_id,summary,listed) VALUES($1,$2,'Sports Team',$3,'athletics',(SELECT id FROM groups WHERE slug='athletics-office'),$4,true) ON CONFLICT (slug) DO NOTHING`,
      ['sport-' + slug, name, icon, `${name} team of the school. Apply to join; the coach, team leader or manager approves your request.`]);
  await q("UPDATE groups SET type='Subject Club' WHERE slug IN ('science-club','math-club','filipino-club','araling-panlipunan-club') AND type='Student Organization'");
  await q("UPDATE groups SET type='SGO' WHERE slug='student-government-organization' AND type='Student Organization'");
  await q("INSERT INTO settings(key,value) VALUES('seeded:sports','1')");
}
for (const [k, v] of Object.entries({"sdg_home": "yes", "sdg_focus": "", "hero_image": "/seed/ph-hs-2.jpg", "hero_quote": "Learning. Character. Community. For every learner of Bolo Norte.", "hero_video_on": "yes", "hero_video_label": "Watch our story", "hero_video_url": "", "hero_video_mode": "modal"}))
  await q('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT DO NOTHING', [k, v]);
await q(`INSERT INTO settings(key,value) VALUES('avatar_style','none'),('home_hero','carousel') ON CONFLICT DO NOTHING`);
if (needPostStatus) await q("UPDATE posts SET status = CASE WHEN published THEN 'published' ELSE 'draft' END");

// Never overwrite content that editors already changed: seed only into empty tables / missing keys.
for (const [k, v] of Object.entries(profile.SETTINGS))
  await q('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT DO NOTHING', [k, v]);

for (const [slug, p] of Object.entries(profile.PAGES))
  await q(`INSERT INTO pages(slug,title,subtitle,content,menu,sort,enabled) VALUES($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (slug) DO UPDATE SET menu=EXCLUDED.menu, sort=EXCLUDED.sort,
           subtitle = CASE WHEN pages.subtitle='' THEN EXCLUDED.subtitle ELSE pages.subtitle END`,
    [slug, p.title, p.subtitle, p.content, p.menu, p.sort, p.enabled]);

// Older installs stored the key facts without a block name.
await q("UPDATE items SET block='key-facts' WHERE section='facts' AND block=''");
// Each (section, block) is seeded once, so items deleted in the CMS never come back.
for (const [section, rows] of Object.entries(profile.ITEMS)) {
  for (const block of new Set(rows.map((r) => r[4] || ''))) {
    const key = `seeded:${section}:${block}`;
    if ((await q('SELECT 1 FROM settings WHERE key=$1', [key])).rowCount) continue;
    const exists = (await q('SELECT 1 FROM items WHERE section=$1 AND block=$2 LIMIT 1', [section, block])).rowCount;
    if (!exists) {
      let i = 1;
      for (const [title, meta, description, icon, blk = '', url = '', category = ''] of rows.filter((r) => (r[4] || '') === block))
        await q('INSERT INTO items(section,title,meta,description,icon,block,url,category,sort) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [section, title, meta, description, icon, blk, url, category, i++]);
    }
    await q("INSERT INTO settings(key,value) VALUES($1,'1') ON CONFLICT DO NOTHING", [key]);
  }
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

if ((await q('SELECT 1 FROM groups LIMIT 1')).rowCount === 0) {
  // Older installs listed student groups as plain items; turn them into real groups.
  const old = (await q("SELECT title, description, icon FROM items WHERE section='student-groups' ORDER BY sort, id")).rows;
  const rows = old.length ? old.map((o) => [o.title, 'Student Organization', o.description, o.icon]) : profile.GROUPS;
  let i = 1;
  for (const [name, type, summary, icon] of rows)
    await q('INSERT INTO groups(slug,name,type,summary,icon,sort) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING', [slugify(name), name, type, summary, icon || 'people-group', i++]);
  await q("DELETE FROM items WHERE section='student-groups'");
}

if ((await q('SELECT 1 FROM programs LIMIT 1')).rowCount === 0)
  for (const p of profile.PROGRAMS)
    await q('INSERT INTO programs(name,level,track,description,icon,sort) VALUES($1,$2,$3,$4,$5,$6)', p);

if ((await q('SELECT 1 FROM staff LIMIT 1')).rowCount === 0) {
  let i = 1;
  for (const r of profile.STAFF) await q('INSERT INTO staff(name,position,department,category,sort) VALUES($1,$2,$3,$4,$5)', [...r, i++]);
}

if ((await q('SELECT 1 FROM downloads LIMIT 1')).rowCount === 0)
  for (const d of profile.DOWNLOADS) await q('INSERT INTO downloads(title,description,url,category) VALUES($1,$2,$3,$4)', d);

if ((await q('SELECT 1 FROM posts LIMIT 1')).rowCount === 0)
  for (const [t, c, e, body, f, d] of profile.POSTS)
    await q('INSERT INTO posts(slug,title,category,excerpt,content,placement,published_at) VALUES($1,$2,$3,$4,$5,$6,$7)', [slugify(t), t, c, e, body, f ? 'Highlight' : 'Normal', d]);

await profile.afterSeed?.(q, fresh);

const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD;
if (email && pw) {
  const hash = await bcrypt.hash(pw, 12);
  await q(`INSERT INTO users(email,name,password_hash,role) VALUES($1,'Administrator',$2,'admin')
           ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='admin', status='active'`,
    [email.toLowerCase(), hash]);
}
// A school with its own profile is already configured; the generic template asks for the school details on first admin login.
if (PROFILE !== 'template') await q("INSERT INTO settings(key,value) VALUES('setup_done','1') ON CONFLICT DO NOTHING");
console.log(`Database ready (profile: ${PROFILE}).`);
if (PROFILE === 'template') console.log('Next: sign in at /admin – the setup wizard asks for the school ID, acronym and full name.');
await pool.end();
