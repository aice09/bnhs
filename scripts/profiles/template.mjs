// Generic starter content for a new school. Everything here is editable later in the CMS.
// Configure the identity with environment variables (see .env.example), then run `npm run db:setup`.
const env = (k, d = '') => process.env[k] || d;
const NAME = env('SCHOOL_NAME', 'Your School Name');
const SHORT = env('SCHOOL_SHORT_NAME', 'YSN');
const CITY = env('SCHOOL_CITY', 'Your City');
const PROVINCE = env('SCHOOL_PROVINCE', 'Your Province');
const REGION = env('SCHOOL_REGION', '');
const COUNTRY = env('SCHOOL_COUNTRY_CODE', 'PH');

export const SETTINGS = {
  school_name: NAME,
  short_name: SHORT,
  tagline: env('SCHOOL_TAGLINE', 'Quality education for every learner'),
  school_id: env('SCHOOL_ID'),
  address: env('SCHOOL_ADDRESS', `${CITY}, ${PROVINCE}`),
  email: env('SCHOOL_EMAIL'),
  phone: env('SCHOOL_PHONE'),
  facebook_url: env('SCHOOL_FACEBOOK'),
  established: env('SCHOOL_ESTABLISHED', new Date().getFullYear().toString()),
  land_area: '',
  feeder_barangays: '',
  logo_url: '/logo.png',
  hero_title: NAME,
  hero_subtitle: `Welcome to the official website of ${NAME} in ${CITY}, ${PROVINCE}.`,
  enrollment_note: 'Enrollment schedules and requirements are announced in the News section. For questions, send us a message.',
  map_embed: '',
  city: CITY,
  province: PROVINCE,
  region: REGION,
  country_code: COUNTRY,
  locale: env('SCHOOL_LOCALE', 'en_PH'),
  postal_code: env('SCHOOL_POSTAL_CODE'),
  street: env('SCHOOL_STREET'),
  latitude: env('SCHOOL_LATITUDE'),
  longitude: env('SCHOOL_LONGITUDE'),
  alt_names: '',
  area_served: `${CITY}`,
  home_eyebrow: [CITY, PROVINCE, REGION].filter(Boolean).join(' · '),
  community_name: CITY,
  learners_from: `${CITY} and nearby communities`,
  levels_text: env('SCHOOL_LEVELS', 'Junior High School and Senior High School'),
  seo_keywords: [NAME, SHORT, `${CITY} schools`, `high school in ${CITY}`, `${PROVINCE} high school`, `${CITY} ${PROVINCE}`].join(', '),
  theme_dark: '#071b3f', theme_primary: '#0c2f6b', theme_accent: '#1d5fc0', theme_light: '#e8f0fb', theme_gold: '#f5b301',
};

const todo = (what) => `${what} Edit this page in the CMS (Admin → Pages).`;

export const HISTORY = `## Our story\n\n${NAME} was established in ${SETTINGS.established}. Tell the story of how the school began, the people who built it and the milestones along the way.\n\n## Milestones\n\n- ${SETTINGS.established} – The school opens its doors.\n\n_${todo('Replace this text with your own history.')}_`;

export const PAGES = {
  'about-us': { title: 'About Us', menu: 'about', sort: 1, enabled: true, subtitle: `Get to know ${NAME}`, content: todo(`${NAME} is a school in ${CITY}, ${PROVINCE}. Describe who you are and who you serve.`) },
  history: { title: 'Our History', menu: 'about', sort: 2, enabled: true, subtitle: 'How our school began', content: HISTORY },
  'mission-vision': { title: 'Mission, Vision & Core Values', menu: 'about', sort: 3, enabled: true, subtitle: 'What guides our school', content: `## Vision\n\n${todo('Write the school vision.')}\n\n## Mission\n\n${todo('Write the school mission.')}\n\n## Core values\n\n- Value one\n- Value two` },
  philosophy: { title: 'Philosophy', menu: 'about', sort: 4, enabled: true, subtitle: 'Our guiding beliefs', content: todo('Describe the school philosophy.') },
  'school-profile': { title: 'School Profile', menu: 'about', sort: 5, enabled: true, subtitle: 'Location, community and campus', content: todo('Describe the campus and community.') },
  'message-of-the-principal': { title: 'Message of the School Head', menu: 'about', sort: 6, enabled: true, subtitle: 'A welcome to learners, parents and the community', content: todo('Add the welcome message.') },
  admissions: { title: 'Admissions & Enrollment', menu: '', sort: 0, enabled: true, subtitle: 'How to enroll', content: `## Basic requirements\n\n- Report card\n- Birth certificate (PSA)\n- Good moral certificate\n\n${todo('Confirm the requirements and enrollment schedule with the school office.')}` },
  facts: { title: 'Facts at a Glance', menu: 'about', sort: 7, enabled: true, subtitle: `Key facts about ${NAME}`, content: todo('Add key facts such as enrollment, faculty and programs.') },
  achievements: { title: 'Achievements', menu: 'student-life', sort: 4, enabled: true, subtitle: 'Recognizing excellence', content: todo('Describe the achievements of learners, teachers and groups. Add entries under Admin → Achievements.') },
  impact: { title: 'Our Impact', menu: 'about', sort: 8, enabled: true, subtitle: 'Education that serves our community', content: todo('Show how the school serves learners and the community. Tag news posts with "impact" to feature them here.') },
  library: { title: 'Library', menu: 'academics', sort: 1, enabled: true, subtitle: 'Books, references and learning resources', content: todo('Describe library services and hours. Add books to the catalogue.') },
  research: { title: 'Research Center', menu: 'academics', sort: 2, enabled: true, subtitle: 'Learning by inquiry', content: todo('Describe research activities.') },
  innovation: { title: 'Innovation', menu: 'academics', sort: 3, enabled: true, subtitle: 'Ideas that solve real problems', content: todo('Describe innovation projects.') },
  athletics: { title: 'Athletics', menu: 'student-life', sort: 1, enabled: true, subtitle: 'Building character, discipline and teamwork', content: todo('Describe the sports program.') },
  'student-groups': { title: 'Student Groups', menu: 'student-life', sort: 2, enabled: true, subtitle: 'Organizations that build leadership and service', content: todo('Student organizations are managed under Admin → Groups.') },
  alumni: { title: 'Alumni', menu: 'student-life', sort: 3, enabled: true, subtitle: `Once a ${SHORT} learner, always part of the family`, content: todo('Welcome alumni back.') },
  sdg: { title: 'Sustainable Development Goals', menu: 'about', sort: 9, enabled: false, subtitle: 'Our commitment to the UN 2030 agenda', content: todo('Explain how the school contributes to the SDGs, then enable this page.') },
  scholarships: { title: 'Scholarships', menu: 'admissions', sort: 1, enabled: false, subtitle: 'Support for deserving learners', content: todo('List scholarship programs and requirements, then enable this page.') },
  partnerships: { title: 'Partnerships', menu: '', sort: 1, enabled: false, subtitle: 'Working together for our learners', content: todo('List partners and how to collaborate, then enable this page.') },
};

export const ITEMS = {
  facts: [
    ['Year established', SETTINGS.established, `${NAME} opened its doors.`, 'calendar', 'key-facts'],
  ],
};

export const PROGRAMS = [
  ['Junior High School', 'Junior High School', 'Grades 7–10', 'Basic education following the national curriculum.', 'book-open', 1],
];
export const STAFF = [];
export const DOWNLOADS = [];
export const POSTS = [
  [`Welcome to the ${NAME} website`, 'Announcement', 'Our school now has an official website.', `Welcome to the official website of **${NAME}**. Here you will find our history, programs, announcements and how to reach us.`, false, new Date().toISOString().slice(0, 10)],
];
export const GROUPS = [];

export async function afterSeed(q, fresh) {
  if (!fresh) return;
  await q("UPDATE posts SET placement='Main' WHERE id=(SELECT min(id) FROM posts)");
}
