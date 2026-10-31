import { GROUP_TYPES } from './perms';
import { SECTIONS } from './sections';

export type Field = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'markdown' | 'select' | 'checkbox' | 'datetime' | 'date' | 'number' | 'image' | 'url' | 'heading' | 'ref';
  // select options: plain text, or 'value|Label'
  options?: string[];
  optionsFrom?: 'groups';
  required?: boolean;
  help?: string;
};

export type Resource = {
  table: string;
  label: string;
  singular: string;
  icon: string;
  fields: Field[];
  columns: { key: string; title: string }[];
  order: string;
  slugFrom?: string;
  canCreate?: boolean;
  canDelete?: boolean;
  touch?: boolean;
  section?: string;
  group?: string;
  perm: string;
  listSql?: string;
};

export const RESOURCES: Record<string, Resource> = {
  posts: {
    perm: 'posts', listSql: 'SELECT p.*, g.name AS group_name FROM posts p LEFT JOIN groups g ON g.id = p.group_id ORDER BY p.published_at DESC',
    table: 'posts', label: 'News & Announcements', singular: 'Post', icon: 'newspaper', slugFrom: 'title',
    order: 'published_at DESC', touch: true,
    columns: [{ key: 'title', title: 'Title' }, { key: 'group_name', title: 'From' }, { key: 'category', title: 'Category' }, { key: 'published_at', title: 'Date' }, { key: 'placement', title: 'Placement' }, { key: 'status', title: 'Status' }, { key: 'views', title: 'Views' }],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['News', 'Announcement', 'Events', 'Junior High School', 'Senior High School', 'Achievements', 'Research', 'Athletics', 'Alumni', 'Impact'], required: true },
      { name: 'group_id', label: 'Posted by (label)', type: 'ref', optionsFrom: 'groups', help: 'Leave on "School" for official news, or pick a group (student group, research center, publication…) to label the story with it.' },
      { name: 'tags', label: 'Tags', type: 'text', help: 'Comma separated, e.g. research, impact, athletics, alumni. Tags like these feed the topic pages.' },
      { name: 'excerpt', label: 'Short summary', type: 'textarea', help: 'Shown in lists and search results (about 150 characters).' },
      { name: 'content', label: 'Content', type: 'markdown' },
      { name: 'image', label: 'Cover image', type: 'image' },
      { name: 'published_at', label: 'Publish date', type: 'datetime' },
      { name: 'placement', label: 'Placement (admin only)', type: 'select', options: ['Normal', 'Highlight', 'Main'], help: 'Main = the big headline story on the home page (only one). Highlight = shown in the Highlights area. Normal = regular news list. Group-written stories can be highlighted here too.' },
      { name: 'status', label: 'Status', type: 'select', options: ['published|Published', 'pending|Pending review', 'draft|Draft', 'rejected|Rejected'], help: 'Stories submitted by groups arrive as "Pending review". Set to Published to approve them.' },
      { name: 'review_note', label: 'Note to the author (optional)', type: 'text', help: 'Shown to the author in their portal, e.g. why a story was rejected.' },
    ],
  },
  pages: {
    perm: 'pages', table: 'pages', label: 'Pages (History, About, Philosophy…)', singular: 'Page', icon: 'file-lines', canCreate: false, canDelete: false, touch: true,
    order: 'title',
    columns: [{ key: 'title', title: 'Page' }, { key: 'slug', title: 'Slug' }, { key: 'menu', title: 'Menu' }, { key: 'enabled', title: 'Enabled' }, { key: 'updated_at', title: 'Updated' }],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'subtitle', label: 'Subtitle (shown under the title)', type: 'text' },
      { name: 'image', label: 'Banner image (optional)', type: 'image', help: 'A wide photo shown behind the page title.' },
      { name: 'content', label: 'Content', type: 'markdown' },
      { name: 'enabled', label: 'Enabled (shown on the website and menu)', type: 'checkbox' },
    ],
  },
  programs: {
    perm: 'programs', table: 'programs', label: 'Academic Programs', singular: 'Program', icon: 'graduation-cap', order: 'sort, name',
    columns: [{ key: 'name', title: 'Program' }, { key: 'level', title: 'Level' }, { key: 'track', title: 'Track / Grades' }, { key: 'sort', title: 'Order' }],
    fields: [
      { name: 'name', label: 'Program name', type: 'text', required: true },
      { name: 'level', label: 'Level', type: 'select', options: ['Junior High School', 'Senior High School'], required: true },
      { name: 'track', label: 'Track / Grades', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'icon', label: 'Font Awesome icon name', type: 'text', help: 'e.g. book-open, bolt, scissors, flask, computer' },
      { name: 'sort', label: 'Display order', type: 'number' },
    ],
  },
  staff: {
    perm: 'staff', table: 'staff', label: 'Faculty & Staff', singular: 'Staff member', icon: 'users', order: 'sort, name',
    columns: [{ key: 'name', title: 'Name' }, { key: 'position', title: 'Position' }, { key: 'department', title: 'Department / Subject' }, { key: 'category', title: 'Category' }],
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true },
      { name: 'position', label: 'Position', type: 'text' },
      { name: 'department', label: 'Department / Subject', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['School Head', 'Junior High School', 'Senior High School', 'Non-teaching', 'Pioneer Staff (2004)'] },
      { name: 'sort', label: 'Display order', type: 'number' },
    ],
  },
  downloads: {
    perm: 'downloads', table: 'downloads', label: 'Downloads & Links', singular: 'Download', icon: 'download', order: 'created_at DESC',
    columns: [{ key: 'title', title: 'Title' }, { key: 'category', title: 'Category' }, { key: 'url', title: 'URL' }, { key: 'created_at', title: 'Added' }],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['General', 'Forms', 'Memoranda', 'Links'] },
      { name: 'url', label: 'File (upload) or link', type: 'image', required: true, help: 'Upload a file or paste a full web address.' },
    ],
  },
  messages: {
    perm: 'messages', table: 'messages', label: 'Messages', singular: 'Message', icon: 'envelope', canCreate: false, order: 'created_at DESC',
    columns: [{ key: 'name', title: 'From' }, { key: 'email', title: 'Email' }, { key: 'subject', title: 'Subject' }, { key: 'created_at', title: 'Received' }, { key: 'read', title: 'Read' }],
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'subject', label: 'Subject', type: 'text' },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'read', label: 'Mark as read', type: 'checkbox' },
    ],
  },
};

export const SETTING_FIELDS: Field[] = [
  { name: 'h_identity', label: 'School identity', type: 'heading' },
  { name: 'logo_url', label: 'School logo', type: 'image', help: 'Square PNG works best. Also available under Appearance.' },
  { name: 'school_name', label: 'School name', type: 'text' },
  { name: 'short_name', label: 'Short name (e.g. BNNHS)', type: 'text' },
  { name: 'alt_names', label: 'Other names people search for (comma separated)', type: 'text' },
  { name: 'tagline', label: 'Tagline', type: 'text' },
  { name: 'school_id', label: 'DepEd School ID', type: 'text' },
  { name: 'established', label: 'Year established', type: 'text' },
  { name: 'h_contact', label: 'Contact & location', type: 'heading' },
  { name: 'address', label: 'Full address (footer & contact page)', type: 'text' },
  { name: 'street', label: 'Street / Barangay (for search engines)', type: 'text' },
  { name: 'city', label: 'City / Municipality', type: 'text' },
  { name: 'province', label: 'Province', type: 'text' },
  { name: 'region', label: 'Region', type: 'text' },
  { name: 'postal_code', label: 'Postal code', type: 'text' },
  { name: 'country_code', label: 'Country code (e.g. PH)', type: 'text' },
  { name: 'latitude', label: 'Latitude', type: 'text' },
  { name: 'longitude', label: 'Longitude', type: 'text' },
  { name: 'email', label: 'Public email', type: 'text' },
  { name: 'phone', label: 'Public phone', type: 'text' },
  { name: 'facebook_url', label: 'Facebook page URL', type: 'url' },
  { name: 'map_embed', label: 'Google Maps embed URL', type: 'url' },
  { name: 'h_home', label: 'Home page', type: 'heading' },
  { name: 'home_hero', label: 'Home page top banner', type: 'select', options: ['carousel|Carousel (school intro + highlighted news with photos)', 'static|Static (single banner with logo)'], help: 'Carousel slides come from posts marked Main or Highlight that have a cover image.' },
  { name: 'hero_title', label: 'Home hero title', type: 'text' },
  { name: 'hero_subtitle', label: 'Home hero text', type: 'textarea' },
  { name: 'home_eyebrow', label: 'Small text above the hero title', type: 'text' },
  { name: 'enrollment_note', label: 'Enrollment notice (home page)', type: 'textarea' },
  { name: 'community_name', label: 'Community name ("Serving the ___ community")', type: 'text' },
  { name: 'levels_text', label: 'Levels offered (sentence fragment)', type: 'text' },
  { name: 'learners_from', label: 'Learners come from (list of places)', type: 'text' },
  { name: 'land_area', label: 'Land area', type: 'text' },
  { name: 'feeder_barangays', label: 'Number of feeder barangays', type: 'text' },
  { name: 'h_seo', label: 'Search engines (SEO)', type: 'heading' },
  { name: 'area_served', label: 'Areas served (comma separated)', type: 'text' },
  { name: 'locale', label: 'Locale (e.g. en_PH)', type: 'text' },
  { name: 'seo_keywords', label: 'Keywords (comma separated)', type: 'textarea', help: 'Include your school name, town and province so people searching for schools in your area find you.' },
];

for (const sec of SECTIONS.filter((x) => x.blocks.length)) {
  RESOURCES[sec.key] = {
    perm: 'sections', table: 'items', section: sec.key, group: sec.optional ? 'optional' : 'sections',
    label: sec.label, singular: sec.singular, icon: sec.icon, order: 'block, sort, id',
    columns: [{ key: 'title', title: 'Title' }, { key: 'block', title: 'Block' }, { key: 'meta', title: 'Meta' }, { key: 'enabled', title: 'Visible' }, { key: 'sort', title: 'Order' }],
    fields: [
      { name: 'block', label: 'Where it appears', type: 'select', options: sec.blocks.map((b) => `${b.key}|${b.title}`), help: sec.blocks.map((b) => `${b.title}: ${b.hint}`).join('  •  ') },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'meta', label: 'Meta (figure, author, date…)', type: 'text' },
      { name: 'category', label: 'Category / type', type: 'text' },
      { name: 'extra', label: 'Extra (call number, result, location…)', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'event_date', label: 'Date (used for sorting, year filter and charts)', type: 'date' },
      { name: 'tags', label: 'Tags (comma separated)', type: 'text' },
      { name: 'group_id', label: 'Belongs to group (optional)', type: 'ref', optionsFrom: 'groups', help: 'Choose a research center, team or club so it also appears on that group\'s page.' },
      { name: 'featured', label: 'Featured (big banner on the page)', type: 'checkbox' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'url', label: 'Link (optional)', type: 'url' },
      { name: 'icon', label: 'Font Awesome icon name', type: 'text', help: 'e.g. users, flask, trophy, book. Used when there is no image.' },
      { name: 'sort', label: 'Display order', type: 'number' },
      { name: 'enabled', label: 'Visible', type: 'checkbox' },
    ],
  };
}

RESOURCES.groups = {
  perm: 'groups', table: 'groups', label: 'Groups & Organizations', singular: 'Group', icon: 'people-group', group: 'access', slugFrom: 'name', order: 'sort, name',
  columns: [{ key: 'name', title: 'Group' }, { key: 'type', title: 'Type' }, { key: 'dept', title: 'Office' }, { key: 'status', title: 'Status' }, { key: 'listed', title: 'Public' }, { key: 'auto_publish', title: 'Auto-publish' }],
  fields: [
    { name: 'name', label: 'Group name', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'select', options: GROUP_TYPES, help: 'Sports Team groups appear on the Athletics page, Research Center groups on the Research page, the rest on Student Groups.' },
    { name: 'parent_id', label: 'Belongs to office', type: 'ref', optionsFrom: 'groups', help: 'The office (Athletics Office, Research & Innovation Office…) whose manager oversees this group. Offices themselves stay empty.' },
    { name: 'dept', label: 'Office key', type: 'select', options: ['|None', 'research|Research & Innovation', 'athletics|Athletics', 'student-groups|Student Groups', 'sgo|Student Government', 'publication|Campus Publication', 'alumni|Alumni', 'library|Library', 'admission|Admission'], help: 'Marks offices and their teams. The publication office approves all news; admission handles applications.' },
    { name: 'status', label: 'Status', type: 'select', options: ['approved|Approved', 'pending|Pending approval', 'rejected|Rejected'] },
    { name: 'summary', label: 'Short summary', type: 'textarea' },
    { name: 'description', label: 'About the group (public page)', type: 'markdown' },
    { name: 'private_content', label: 'Members-only page', type: 'markdown', help: 'Only signed-in members of this group can read this (schedules, forms, internal notes).' },
    { name: 'image', label: 'Photo / logo', type: 'image' },
    { name: 'icon', label: 'Font Awesome icon name', type: 'text' },
    { name: 'info', label: 'Center / group info (location, hours, head, how to join – Markdown)', type: 'markdown' },
    { name: 'adviser', label: 'Adviser / head', type: 'text' },
    { name: 'contact', label: 'Contact (email or page)', type: 'text' },
    { name: 'listed', label: 'Show on the public website', type: 'checkbox' },
    { name: 'auto_publish', label: 'Auto-publish: skip the approval chain (trusted groups only)', type: 'checkbox' },
    { name: 'sort', label: 'Display order', type: 'number' },
  ],
};

// WHERE clause + params that scope a query to a resource (items tables are split by section).
export function scope(r: Resource, firstParam = 1): { sql: string; params: unknown[] } {
  return r.section ? { sql: `section=$${firstParam}`, params: [r.section] } : { sql: 'true', params: [] };
}
