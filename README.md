# Bolo Norte National High School – Website + CMS

Next.js 15 (App Router) · PostgreSQL · Redis · DataTables.js · Font Awesome

## Run locally
```bash
cp .env.example .env.local        # set DATABASE_URL, REDIS_URL, AUTH_SECRET, SITE_URL, ADMIN_*
npm install
npm run db:setup                  # creates tables, seeds school content, creates/updates the admin user
npm run dev                       # or: npm run build && npm start
```
Admin panel: `/admin` (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then change it under *Password*).

## What the CMS manages
News & announcements, pages (history, mission/vision, school profile, admissions – Markdown), academic programs,
faculty & staff, downloads/links, contact messages, and site settings (address, phone, email, Facebook, home text).
Image/file uploads are stored in `UPLOAD_DIR` and served from `/uploads/*`.

## Notes
- Redis caches public queries and is flushed on every CMS save; the site still works if Redis is down.
- Set `SITE_URL` to the real domain in production: it drives canonical URLs, the sitemap, robots.txt and JSON-LD.
- SEO: per-page titles/descriptions, Open Graph image, `HighSchool` JSON-LD with address/geo, `NewsArticle` JSON-LD,
  `/sitemap.xml`, `/robots.txt`. After launch, add the domain to Google Search Console, submit the sitemap, and
  claim the Google Business Profile for local "schools in Sipocot" results.
- Seed content comes from the school's old WordPress site and related references; email/phone are blank until the
  school fills them in under *Site Settings*. Pioneer staff are listed because they are documented in the history.

## Phase 2 additions
- Logo (`public/logo.png`; change via CMS → Settings → Logo), short name **BNNHS**, navy/gold theme.
- CMS pages: About Us, History, Mission & Vision, Philosophy, Core Values, etc. (Pages → edit). Each page has an Enabled switch.
- News placement: Normal / Highlight / Main (only one Main; shown as Top story on home and news).
- Section pages with item lists: Facts, Library, Research, Innovation, Athletics, Student Groups, Alumni, Scholarships, Partnerships.
- Scholarships and Partnerships are **disabled by default**: enable them from their admin list page (banner toggle).
- If the server is killed on a low-memory host, start with `NODE_OPTIONS=--max-old-space-size=256 npx next start -p 3100 -H 0.0.0.0`.

## Reusable template (Phase 3)

- **Node 26.13.0 LTS** (`.nvmrc`). Run: `npm run build && npm start`.
- **Another school:** set `SCHOOL_PROFILE=template` plus `SCHOOL_*` vars (see `.env.example`), run `node scripts/setup-db.mjs`, then edit everything in `/admin`.
- **Appearance:** `/admin/appearance` – palette presets, Color Hunt URL/hex import, logo upload.
- **Storage:** local `UPLOAD_DIR`, or S3 when `S3_BUCKET` (and optionally `S3_ENDPOINT`) is set.
- **Backups:** `/admin/backups`, `npm run db:backup`, `npm run db:restore -- <file>`, scheduled with `BACKUP_EVERY_HOURS`.
- **Portals:** `/portal/login` (student, alumni, research center). Admins create groups under `/admin/groups` and assign members with per-member permissions; group news goes to the central news feed with group label and tags, pending admin approval and optional highlight.
- Admin staff permissions are set per user in `/admin/users`.

## Phase 4

- **Build with containerd (no Docker):** start BuildKit (`buildkitd --oci-worker=false --containerd-worker=true --containerd-worker-namespace=bnhs`), put `buildctl` on PATH, then `CONTAINERD_NAMESPACE=bnhs sh scripts/build-image.sh` and `sudo nerdctl --namespace bnhs compose up -d`. Lower `BUILD_HEAP` on small hosts.
- **Setup wizard:** on first admin login (template profile) `/admin/setup` asks for school ID, acronym, full name, location and logo.
- **Sample content:** `npm run db:samples` adds demo news, groups, facilities, projects, athletics and achievements with free photos (tagged `sample`); `npm run db:samples:remove` deletes them. Facebook could not be scraped, so samples are generic.
- **Centralized entries:** items added by a group (research center, team, student group) in `/portal/groups/<slug>` show on the group page and on the school-wide page (research, athletics, student-groups, achievements, news) with a group label.
- **Achievements:** CMS-editable (image, date, category, featured, spotlight) with filter board, by-year chart and featured banner.
