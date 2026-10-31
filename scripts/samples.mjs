// Optional demo content so every page can be previewed with photos (free Unsplash images stored in public/seed).
//   node scripts/samples.mjs            add the samples (safe to run again)
//   node scripts/samples.mjs --remove   delete everything the samples created
// Everything is tagged "sample" – replace it with the school's real content in the CMS.
import './load-env.mjs';
import pg from 'pg';

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const q = (s, p) => db.query(s, p);
const img = (n) => `/seed/${n}.jpg`;

const GROUPS = [
  { slug: 'bnhs-research-center', name: 'BNHS Research & Innovation Center', type: 'Research Center', icon: 'microscope', image: img('lab'),
    summary: 'Learner and teacher research, innovation projects and community extension.',
    description: 'The center supports science investigatory projects, teacher action research and innovation work that responds to the needs of the Bolo Norte community.',
    info: '**Head:** Research coordinator\n\n**Location:** Main building\n\n**Hours:** Monday–Friday, 8:00 AM–4:00 PM\n\n**Join:** Talk to your science or research teacher.', adviser: 'Research Coordinator' },
  { slug: 'bnhs-athletics-club', name: 'BNHS Athletics Club', type: 'Sports Team', icon: 'medal', image: img('track'),
    summary: 'Our school athletes in track and field, basketball, volleyball and more.',
    description: 'The athletics club trains learner-athletes for the school intramurals and for district and division meets, and promotes fitness and sportsmanship.',
    info: '**Coach:** MAPEH teachers\n\n**Training:** After classes at the school grounds\n\n**Join:** Try-outs are announced at the start of the school year.', adviser: 'MAPEH Department' },
];

// [section, block, group slug|null, title, meta, category, extra, description, image, icon, date, tags, featured]
const ITEMS = [
  ['alumni', 'stories', null, 'From Bolo Norte to the classroom', 'Batch 2012 · Public school teacher', 'Education', '', 'A BNHS graduate who now teaches in Camarines Sur shares how her own teachers inspired her. (Sample story)', img('students-smiling'), 'chalkboard-user', '2026-05-12', 'alumni,sample', true],
  ['alumni', 'stories', null, 'Building a small business in Sipocot', 'Batch 2015 · Entrepreneur', 'Business', '', 'A graduate started a local food business and hires fellow alumni. (Sample story)', img('friends'), 'store', '2026-03-02', 'alumni,sample'],
  ['alumni', 'stories', null, 'Serving the community as a nurse', 'Batch 2016 · Nurse', 'Health', '', 'From the science lab at BNHS to the hospital ward, a graduate reflects on her journey. (Sample story)', img('lab'), 'user-nurse', '2025-11-20', 'alumni,sample'],
  ['alumni', 'events', null, 'Grand Alumni Homecoming', 'Annual', 'Reunion', 'School grounds, Bolo Norte', 'Reconnect with classmates and teachers. (Sample event)', img('assembly'), 'people-roof', '2027-01-15', 'alumni,sample'],
  ['alumni', 'events', null, 'Career Talk for Grade 12', 'Annual', 'Career talk', 'School gymnasium', 'Alumni share career advice with Senior High School learners. (Sample event)', img('seminar'), 'microphone', '2026-12-05', 'alumni,sample'],
  ['alumni', 'events', null, 'Alumni Virtual Meetup', 'Online', 'Webinar', 'Online', 'Catch up and learn about alumni projects. (Sample event)', img('students-laptops'), 'video', '2026-11-20', 'alumni,sample'],
  ['alumni', 'events', null, 'Alumni Brigada Eskwela', 'Past', 'Community', 'School grounds, Bolo Norte', 'Alumni helped prepare classrooms before the school year. (Sample event)', img('volunteer'), 'broom', '2026-06-01', 'alumni,sample'],
  ['alumni', 'opportunities', null, 'Mentor a Grade 12 learner', 'BNHS Guidance Office', 'Mentorship', 'Bolo Norte / online', 'Share your career experience with learners. (Sample)', '', 'user-group', null, 'alumni,sample'],
  ['research', 'projects', 'bnhs-research-center', 'Low-cost water filter from local materials', '2026 · Ongoing', 'Science', '', 'Learners test a simple filter that uses sand, charcoal and gravel to clean rainwater for school use.', img('lab'), 'flask', '2026-08-10', 'research,science,sample'],
  ['research', 'projects', 'bnhs-research-center', 'Reading comprehension in Grade 7: an action research', '2025 · Completed', 'Education', '', 'Teachers studied how short daily reading sessions improve comprehension.', img('open-book'), 'book-open', '2025-11-20', 'research,education,sample'],
  ['research', 'extension', 'bnhs-research-center', 'Barangay school garden', '2026', 'Community', '', 'Learners and teachers help neighbouring families start vegetable gardens.', img('volunteer'), 'seedling', '2026-06-14', 'extension,community,sample'],
  ['research', 'extension', 'bnhs-research-center', 'Reading buddies for elementary pupils', '2025', 'Education', '', 'Senior High School learners read with pupils from nearby elementary schools.', img('school-supplies'), 'children', '2025-09-02', 'extension,education,sample'],
  ['research', 'facilities', 'bnhs-research-center', 'Science laboratory', 'Main building', '', '', 'Space for experiments, demonstrations and investigatory projects.', img('lab'), 'flask', null, 'sample'],
  ['research', 'facilities', 'bnhs-research-center', 'Computer and innovation room', 'Main building', '', '', 'Computers and tools for research, coding and technical drawing.', img('coding'), 'laptop-code', null, 'sample'],
  ['research', 'publications', 'bnhs-research-center', 'Action research digest, Vol. 1', '2025', 'Journal', 'BNHS teachers', 'A collection of classroom action research reports.', '', 'file-lines', '2025-12-01', 'research,sample'],
  ['athletics', 'schedule', 'bnhs-athletics-club', 'School Intramurals', 'Every year', 'Multi-sport', 'School grounds', 'Inter-section games in track and field, volleyball, basketball and more.', '', 'trophy', '2026-12-04', 'athletics,sample'],
  ['athletics', 'schedule', 'bnhs-athletics-club', 'District Sports Meet', 'Every year', 'Multi-sport', 'Sipocot', 'Our athletes compete against schools in the district.', '', 'flag-checkered', '2027-01-20', 'athletics,sample'],
  ['athletics', 'teams', 'bnhs-athletics-club', 'Track and field', 'Boys & girls', '', '', 'Running, jumping and throwing events.', img('track'), 'person-running', null, 'sample'],
  ['athletics', 'teams', 'bnhs-athletics-club', 'Basketball', 'Boys & girls', '', '', 'Inter-section and district competition.', img('basketball'), 'basketball', null, 'sample'],
  ['athletics', 'teams', 'bnhs-athletics-club', 'Football', 'Boys & girls', '', '', 'Training and friendly matches.', img('football'), 'futbol', null, 'sample'],
  ['athletics', 'teams', 'bnhs-athletics-club', 'Fitness & conditioning', 'All learners', '', '', 'Warm-ups and exercises that keep learners healthy.', img('fitness'), 'dumbbell', null, 'sample'],
  ['athletics', 'facilities', 'bnhs-athletics-club', 'School grounds', 'Campus', '', '', 'Open space for physical education, practices and school games.', img('track'), 'people-roof', null, 'sample'],
  ['student-groups', 'activities', 'student-government-organization', 'Leadership orientation', 'June', '', '', 'New officers and class leaders learn how to serve their classmates.', img('seminar'), 'bullhorn', '2026-06-20', 'student-life,sample'],
  ['student-groups', 'activities', 'science-club', 'Science fair preparation', 'August', '', '', 'Club members design and test their investigatory projects.', img('lab'), 'flask', '2026-08-05', 'student-life,science,sample'],
  ['student-groups', 'activities', 'math-club', 'Math week quiz bee', 'September', '', '', 'Friendly contests in mental math and problem solving.', img('students-study'), 'square-root-variable', '2026-09-12', 'student-life,sample'],
  ['achievements', 'highlights', null, 'Awards and recognitions', '25+', '', '', 'Sample figure – edit in the CMS.', '', 'trophy', null, 'sample'],
  ['achievements', 'highlights', null, 'Learner achievements', '60+', '', '', 'Sample figure – edit in the CMS.', '', 'graduation-cap', null, 'sample'],
  ['achievements', 'highlights', null, 'Research outputs', '10+', '', '', 'Sample figure – edit in the CMS.', '', 'flask', null, 'sample'],
  ['achievements', 'highlights', null, 'Community projects', '8+', '', '', 'Sample figure – edit in the CMS.', '', 'handshake', null, 'sample'],
  ['achievements', 'achievements', 'bnhs-athletics-club', 'Athletes bring home medals from the district meet', 'Student achievement', 'Students', 'District', 'Our learner-athletes placed in several track and field events.', img('track'), 'medal', '2026-10-06', 'athletics,students,district,sample'],
  ['achievements', 'achievements', 'bnhs-research-center', 'Learners present a water filter project', 'Research', 'Research', 'Division', 'A team of Grade 10 learners presented their low-cost filter at the division science fair.', img('lab'), 'flask', '2026-09-20', 'research,science,division,sample'],
  ['achievements', 'achievements', null, 'Teacher recognized for outstanding service', 'Faculty recognition', 'Faculty', 'Division', 'A BNHS teacher received a division-level recognition for dedicated service.', img('classroom'), 'chalkboard-user', '2026-09-05', 'faculty,division,sample'],
  ['achievements', 'achievements', null, 'New classroom and learning space opened', 'Institutional milestone', 'Institutional', '', 'Additional learning space helps the school serve more learners.', img('classroom-empty'), 'building', '2026-08-15', 'institutional,development,sample'],
  ['achievements', 'achievements', 'student-government-organization', 'SGO leads a community clean-up drive', 'Community', 'Community', '', 'Student leaders and volunteers cleaned the school surroundings and nearby roads.', img('volunteer'), 'hands-holding-circle', '2026-07-22', 'community,students,sample'],
  ['achievements', 'achievements', 'science-club', 'Science Club wins a regional quiz round', 'Student achievement', 'Awards', 'Regional', 'Club members advanced in the regional science quiz.', img('students-laptops'), 'award', '2026-06-18', 'students,science,regional,sample'],
  ['achievements', 'achievements', null, 'Library receives donated books', 'Institutional milestone', 'Community', '', 'Partners and alumni donated books to the school library.', img('library-shelves'), 'book', '2025-11-10', 'institutional,library,sample'],
  ['achievements', 'achievements', null, 'Grade 12 TVL learners complete work immersion', 'Student achievement', 'Students', '', 'TVL learners practised EIM and tailoring skills in real work settings.', img('repair'), 'screwdriver-wrench', '2025-06-04', 'students,tvl,sample'],
  ['achievements', 'achievements', null, 'School joins national reading month', 'Institutional milestone', 'Institutional', 'National', 'Learners took part in reading activities and book fairs.', img('open-book'), 'book-open-reader', '2024-11-25', 'institutional,sample'],
  ['achievements', 'achievements', null, 'Learners complete first coding workshop', 'Student achievement', 'Students', '', 'A short workshop introduced basic computer programming.', img('coding'), 'laptop-code', '2023-10-12', 'students,innovation,sample'],
  ['achievements', 'achievements', null, 'Students praised in a division quiz', 'Awards', 'Awards', 'Division', 'BNHS learners earned recognition in a division contest.', img('students-smiling'), 'award', '2022-09-15', 'students,division,sample'],
  ['achievements', 'achievements', null, 'Alumni gather for a school reunion', 'Community', 'Community', '', 'Alumni visited the campus and shared advice with learners.', img('friends'), 'people-roof', '2021-12-18', 'community,alumni,sample'],
  ['achievements', 'spotlight', null, 'Research & innovation', '', '', '', '', img('lab'), 'flask', null, 'sample', false, '/research'],
  ['achievements', 'spotlight', null, 'Athletics', '', '', '', '', img('track'), 'medal', null, 'sample', false, '/athletics'],
  ['achievements', 'spotlight', null, 'Student development', '', '', '', '', img('students-smiling'), 'users', null, 'sample', false, '/student-groups'],
  ['achievements', 'spotlight', null, 'Community engagement', '', '', '', '', img('volunteer'), 'handshake', null, 'sample', false, '/impact'],
  ['library', 'catalogue', null, 'Noli Me Tangere', 'José Rizal', 'Filipino', 'FIL 899 R59', '', '', '', null, 'sample'],
  ['library', 'catalogue', null, 'El Filibusterismo', 'José Rizal', 'Filipino', 'FIL 899 R59', '', '', '', null, 'sample'],
  ['library', 'catalogue', null, 'Science Links 7', 'Textbook', 'Science', 'SCI 500 S3', '', '', '', null, 'sample'],
  ['library', 'catalogue', null, 'Mathematics Grade 8 Learner\u2019s Material', 'DepEd', 'Mathematics', 'MAT 510 M3', '', '', '', null, 'sample'],
  ['library', 'catalogue', null, 'Electrical Installation and Maintenance NCII', 'TESDA / DepEd', 'TVL', 'TVL 621 E4', '', '', '', null, 'sample'],
  ['library', 'catalogue', null, 'Philippine Atlas', 'Reference', 'Reference', 'REF 912 P5', '', '', '', null, 'sample'],
  ['library', 'services', null, 'Reading corner', 'Library hours', '', '', 'A quiet place to read between classes.', img('library-reading'), 'book-open-reader', null, 'sample'],
  ['library', 'services', null, 'Book lending', 'Services', '', '', 'Borrow books with your school ID.', img('library-aisle'), 'book', null, 'sample'],
];

const POSTS = [
  ['Learners showcase science projects', 'Events', 'Science Club members presented their investigatory projects to classmates and teachers.', 'The Science Club held a small fair where learners explained their experiments and answered questions from teachers and classmates.', img('lab'), 'bnhs-research-center', 'research,innovation,science,sample', '2026-10-20'],
  ['Athletes train for the district meet', 'Athletics', 'Track and field athletes prepare for the upcoming district sports meet.', 'Learner-athletes train after classes with their coaches, focusing on sprints, relays and jumps.', img('track'), 'bnhs-athletics-club', 'athletics,sports,sample', '2026-10-18'],
  ['SGO leads a clean-up drive', 'News', 'Student leaders and volunteers clean the school and its surroundings.', 'The Student Government Organization led a clean-up drive that kept the campus tidy and promoted environmental care.', img('volunteer'), 'student-government-organization', 'student-life,community,impact,sample', '2026-10-12'],
  ['Library welcomes new reading materials', 'News', 'New books and references are now available to learners.', 'Learners can borrow the new titles with their school ID.', img('library-shelves'), null, 'library,sample', '2026-10-08'],
  ['Alumni invited to share career advice', 'Alumni', 'Graduates are invited to talk to Grade 12 learners about work and further studies.', 'Alumni who would like to take part can register in the alumni portal or send the school a message.', img('seminar'), null, 'alumni,sample', '2026-09-28'],
];

const PAGE_IMAGES = { library: 'library-shelves', research: 'lab', innovation: 'circuits', athletics: 'track', 'student-groups': 'students-smiling', alumni: 'friends', facts: 'classroom', impact: 'volunteer', achievements: 'students-smiling' };

if (process.argv.includes('--remove')) {
  await q("DELETE FROM items WHERE tags LIKE '%sample%'");
  await q("DELETE FROM posts WHERE tags LIKE '%sample%'");
  await q('DELETE FROM groups WHERE slug = ANY($1)', [GROUPS.map((g) => g.slug)]);
  await q("UPDATE groups SET image='' WHERE image LIKE '/seed/%'");
  await q("UPDATE pages SET image='' WHERE image LIKE '/seed/%'");
  await q("DELETE FROM users WHERE email LIKE '%@sample.invalid'");
  await q("DELETE FROM settings WHERE key='samples'");
  console.log('Sample content removed.');
} else {
  for (const g of GROUPS)
    await q(`INSERT INTO groups(slug,name,type,summary,description,info,image,icon,adviser) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (slug) DO NOTHING`, [g.slug, g.name, g.type, g.summary, g.description, g.info, g.image, g.icon, g.adviser]);
  const extra = ['student-government-organization', 'science-club', 'math-club', 'filipino-club', 'araling-panlipunan-club', 'step-organization'];
  const imgs = ['assembly', 'lab', 'students-study', 'open-book', 'friends', 'students-laptops'];
  for (let i = 0; i < extra.length; i++) await q("UPDATE groups SET image=$2 WHERE slug=$1 AND image=''", [extra[i], img(imgs[i])]);
  for (const [slug, im] of Object.entries(PAGE_IMAGES)) await q("UPDATE pages SET image=$2 WHERE slug=$1 AND image=''", [slug, img(im)]);

  const gid = Object.fromEntries((await q('SELECT slug,id FROM groups')).rows.map((r) => [r.slug, r.id]));
  await q("DELETE FROM items WHERE tags LIKE '%sample%'");
  await q("DELETE FROM users WHERE email LIKE '%@sample.invalid'");
  const ALUMNI = [
    ['Maria Santos', 2016, 'STEM', 'Public school teacher', 'DepEd Camarines Sur', 'Sipocot, Camarines Sur', 'friends', true, 'Proud BNHS graduate teaching in her home province. (Sample profile)'],
    ['Carlo Reyes', 2018, 'ABM', 'Entrepreneur', 'Local food business', 'Naga City', 'students-laptops', true, 'Started a small business and hires fellow alumni. (Sample profile)'],
    ['Liza Dela Cruz', 2016, 'HUMSS', 'Registered nurse', 'Provincial hospital', 'Pili, Camarines Sur', 'students-smiling', false, 'Serving the community in health care. (Sample profile)'],
    ['Juan Miguel Tan', 2020, 'TVL-ICT', 'IT support specialist', 'BPO company', 'Quezon City', 'coding', false, 'Works in IT and mentors learners in computer skills. (Sample profile)'],
  ];
  for (const [name, yr, prog, occ, emp, loc, ph, feat, bio] of ALUMNI) {
    const email = name.toLowerCase().replace(/[^a-z]+/g, '.') + '@sample.invalid';
    const u = await q("INSERT INTO users(email,name,password_hash,role,status) VALUES($1,$2,'!disabled','alumni','active') RETURNING id", [email, name]);
    await q(`INSERT INTO alumni_profiles(user_id,grad_year,program,occupation,employer,location,bio,photo,featured,listed) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
      [u.rows[0].id, yr, prog, occ, emp, loc, bio, img(ph), feat]);
  }
  let n = 0;
  for (const [section, block, group, title, meta, category, extra2, description, image, icon, date, tags, featured, url] of ITEMS) {
    await q(`INSERT INTO items(section,block,group_id,title,meta,category,extra,description,image,icon,event_date,tags,featured,url,sort)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [section, block, group ? gid[group] ?? null : null, title, meta, category, extra2, description, image, icon, date, tags, featured ?? false, url ?? '', n++]);
  }
  // The newest achievement becomes the big banner.
  await q("UPDATE items SET featured=true WHERE id=(SELECT id FROM items WHERE section='achievements' AND block='achievements' AND tags LIKE '%sample%' ORDER BY event_date DESC LIMIT 1)");

  await q("DELETE FROM posts WHERE tags LIKE '%sample%'");
  for (const [title, category, excerpt, content, image, group, tags, date] of POSTS) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await q(`INSERT INTO posts(slug,title,category,excerpt,content,image,group_id,tags,published,status,published_at)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,true,'published',$9) ON CONFLICT (slug) DO NOTHING`,
      [slug, title, category, excerpt, content, image, group ? gid[group] ?? null : null, tags, date]);
  }
  await q("INSERT INTO settings(key,value) VALUES('samples','1') ON CONFLICT DO NOTHING");
  console.log('Sample content added. Remove it with: node scripts/samples.mjs --remove');
}
await db.end();
