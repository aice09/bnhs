// Content sections: each has a public page (pages table) plus blocks of items (items table) managed in the CMS.
export type BlockLayout = 'cards' | 'stats' | 'list' | 'catalogue' | 'links' | 'schedule' | 'achievements';
// groups: true lets groups (research centers, teams, clubs) add their own entries; they show on the group page and on the school-wide page.
export type Block = { key: string; title: string; layout: BlockLayout; blurb?: string; hint: string; groups?: boolean };
export type Section = {
  key: string; label: string; icon: string; singular: string; menu: string;
  blocks: Block[];
  groupTypes?: string[];      // lists groups of these types on the page
  excludeGroupTypes?: string[]; // lists all other groups
  newsTags?: string[];        // shows news carrying these tags (or written by the listed group types)
  optional?: boolean;         // can be switched on/off in the CMS and is off by default
  cta?: { label: string; href: string; icon: string };
};

export const SECTIONS: Section[] = [
  { key: 'facts', label: 'Facts', icon: 'chart-simple', singular: 'Fact', menu: 'about', blocks: [
    { key: 'key-facts', title: 'Key facts', layout: 'stats', hint: 'Title = what it measures, Meta = the figure (e.g. 2004), Description = short note.' },
    { key: 'more-facts', title: 'More facts and data', layout: 'links', hint: 'Title = link name, Description = short note, Link = page address (e.g. /academics).' },
  ] },
  { key: 'impact', label: 'Impact', icon: 'seedling', singular: 'Impact item', menu: 'about', newsTags: ['impact'], blocks: [
    { key: 'highlights', title: 'Impact highlights', layout: 'stats', hint: 'Title = what it measures, Meta = the figure, Description = short note.' },
    { key: 'programs', title: 'Community programs', layout: 'cards', hint: 'Title = program name, Meta = status / year, Description = what it does.' },
  ], cta: { label: 'Partner with us', href: '/contact', icon: 'handshake' } },
  { key: 'library', label: 'Library', icon: 'book-open-reader', singular: 'Library entry', menu: 'academics', blocks: [
    { key: 'catalogue', title: 'Library catalogue', layout: 'catalogue', groups: true, hint: 'Title = book title, Meta = author, Category = subject / type, Extra = call number or availability.' },
    { key: 'services', title: 'Library services', layout: 'cards', groups: true, hint: 'Title = service, Meta = hours / type, Description = details.' },
    { key: 'e-resources', title: 'E-resources', layout: 'links', groups: true, hint: 'Title = resource name, Description = what it offers, Link = internal library system (e.g. /library/opac or an intranet address) or an external web address.' },
  ] },
  { key: 'research', label: 'Research Center', icon: 'microscope', singular: 'Research entry', menu: 'academics', groupTypes: ['Research Center'], newsTags: ['research'], blocks: [
    { key: 'projects', title: 'Research projects', layout: 'cards', groups: true, hint: 'Title = project, Meta = year / status, Category = field, Description = summary, Link = paper or page.' },
    { key: 'extension', title: 'Extension projects', layout: 'cards', groups: true, hint: 'Title = project, Meta = year / partner community, Description = what was done.' },
    { key: 'facilities', title: 'Facilities & learning spaces', layout: 'cards', groups: true, hint: 'Title = facility or space, Meta = capacity / location, Description = what it offers, Image = photo.' },
    { key: 'publications', title: 'Publications', layout: 'list', groups: true, hint: 'Title = paper title, Meta = year, Category = type, Extra = authors, Link = file or web address.' },
  ], cta: { label: 'Research center login', href: '/portal/login?as=research', icon: 'right-to-bracket' } },
  { key: 'innovation', label: 'Innovation', icon: 'lightbulb', singular: 'Innovation entry', menu: 'academics', newsTags: ['innovation'], blocks: [
    { key: 'focus-areas', title: 'Focus areas', layout: 'cards', groups: true, hint: 'Title = area, Description = what we explore, Icon = Font Awesome name.' },
    { key: 'projects', title: 'Projects', layout: 'cards', groups: true, hint: 'Title = project, Meta = status / year, Description = summary.' },
  ], cta: { label: 'Share an idea', href: '/contact', icon: 'lightbulb' } },
  { key: 'athletics', label: 'Athletics', icon: 'medal', singular: 'Athletics entry', menu: 'student-life', groupTypes: ['Sports Team'], newsTags: ['athletics', 'sports'], blocks: [
    { key: 'teams', title: 'Teams & sports', layout: 'cards', hint: 'Title = team / sport, Meta = coach or level, Description = details.' },
    { key: 'schedule', title: 'Schedules & results', layout: 'schedule', groups: true, hint: 'Title = event / match, Meta = date, Category = sport, Extra = venue or result.' },
    { key: 'facilities', title: 'Facilities', layout: 'cards', groups: true, hint: 'Title = facility, Description = details, Image = photo.' },
  ] },
  { key: 'student-groups', label: 'Student Groups', icon: 'people-group', singular: 'Student group', menu: 'student-life', excludeGroupTypes: ['Research Center', 'Sports Team', 'Office'], blocks: [
    { key: 'activities', title: 'Projects & activities', layout: 'cards', groups: true, hint: 'Title = activity, Meta = date, Description = details, Image = photo.' },
  ],
    cta: { label: 'Start a student group', href: '/contact', icon: 'plus' } },
  { key: 'achievements', label: 'Achievements', icon: 'trophy', singular: 'Achievement', menu: 'student-life', newsTags: ['achievement'], blocks: [
    { key: 'highlights', title: 'Achievement figures', layout: 'stats', hint: 'Title = what it counts, Meta = the figure (e.g. 50+).' },
    { key: 'achievements', title: 'Achievements', layout: 'achievements', groups: true, hint: 'Title = headline, Category = Awards / Research / Students / Faculty / Institutional / Community, Date = when, Tags = comma separated, Image = photo, Featured = show in the big banner.' },
    { key: 'spotlight', title: 'Spotlight areas', layout: 'cards', hint: 'Title = area, Image = photo, Link = page to open.' },
  ], cta: { label: 'Read our news', href: '/news', icon: 'newspaper' } },
  { key: 'alumni', label: 'Alumni', icon: 'user-graduate', singular: 'Alumni entry', menu: 'student-life', newsTags: ['alumni'], blocks: [
    { key: 'stories', title: 'Alumni stories', layout: 'cards', groups: true, hint: 'Title = headline, Meta = batch / role, Description = story, Image = photo.' },
    { key: 'events', title: 'Alumni events', layout: 'schedule', groups: true, hint: 'Title = event, Meta = date, Category = type, Extra = venue.' },
    { key: 'opportunities', title: 'Career opportunities', layout: 'list', groups: true, hint: 'Title = job / mentorship, Meta = company, Category = type, Extra = location, Link = how to apply.' },
  ] },
  { key: 'sdg', label: 'SDG', icon: 'earth-asia', singular: 'SDG project', menu: 'about', optional: true, newsTags: ['sdg', 'sustainability'], blocks: [
    { key: 'projects', title: 'SDG projects & activities', layout: 'cards', groups: true, hint: 'Title = project, Meta = year / partner, Category = goal (e.g. SDG 4), Description = what was done, Image = photo, Link = more info.' },
  ] },
  { key: 'scholarships', label: 'Scholarships', icon: 'hand-holding-dollar', singular: 'Scholarship', menu: 'admissions', optional: true, blocks: [
    { key: 'programs', title: 'Scholarship programs', layout: 'cards', hint: 'Title = program, Meta = provider, Description = who can apply.' },
  ], cta: { label: 'Ask about scholarships', href: '/contact', icon: 'circle-question' } },
  { key: 'partnerships', label: 'Partners', icon: 'handshake', singular: 'Partner', menu: '', optional: true, blocks: [
    { key: 'partners', title: 'Our partners', layout: 'cards', hint: 'Title = partner, Meta = type, Description = how we work together, Image = logo.' },
  ], cta: { label: 'Become a partner', href: '/contact', icon: 'handshake' } },
];

export const SECTION_KEYS = SECTIONS.map((s) => s.key);
export const sectionByKey = (k: string) => SECTIONS.find((s) => s.key === k);

export const ABOUT_SLUGS = ['about-us', 'history', 'mission-vision', 'philosophy', 'school-profile', 'message-of-the-principal'];

// Where a group of a given type can publish entries (its own page + the school-wide page).
const OFFICE_SECTIONS: Record<string, string[]> = {
  research: ['research', 'innovation'], athletics: ['athletics'], sgo: ['student-groups'], 'student-groups': ['student-groups'], alumni: ['alumni'], library: ['library'], sdg: ['sdg'],
};
export function groupBlocks(type: string, dept = '', isOffice = false): { section: string; block: Block; label: string }[] {
  const out: { section: string; block: Block; label: string }[] = [];
  for (const sec of SECTIONS) {
    const applies = isOffice ? (OFFICE_SECTIONS[dept] ?? []).includes(sec.key)
      : sec.groupTypes ? sec.groupTypes.includes(type) : sec.excludeGroupTypes ? !sec.excludeGroupTypes.includes(type) : sec.key === 'achievements';
    if (!applies && sec.key !== 'achievements') continue;
    for (const b of sec.blocks) if (b.groups) out.push({ section: sec.key, block: b, label: `${b.title}` });
  }
  return out;
}
