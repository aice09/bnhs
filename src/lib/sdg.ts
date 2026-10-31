// The 17 UN Sustainable Development Goals. Icons are the official UN SDG icons in /public/sdg.
export const SDGS: { n: number; title: string; text: string }[] = [
  { n: 1, title: 'No Poverty', text: 'End poverty in all its forms everywhere.' },
  { n: 2, title: 'Zero Hunger', text: 'End hunger, achieve food security and improved nutrition, and promote sustainable agriculture.' },
  { n: 3, title: 'Good Health and Well-being', text: 'Ensure healthy lives and promote well-being for all at all ages.' },
  { n: 4, title: 'Quality Education', text: 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.' },
  { n: 5, title: 'Gender Equality', text: 'Achieve gender equality and empower all women and girls.' },
  { n: 6, title: 'Clean Water and Sanitation', text: 'Ensure availability and sustainable management of water and sanitation for all.' },
  { n: 7, title: 'Affordable and Clean Energy', text: 'Ensure access to affordable, reliable, sustainable and modern energy for all.' },
  { n: 8, title: 'Decent Work and Economic Growth', text: 'Promote sustained, inclusive economic growth, full employment and decent work for all.' },
  { n: 9, title: 'Industry, Innovation and Infrastructure', text: 'Build resilient infrastructure, promote inclusive industrialization and foster innovation.' },
  { n: 10, title: 'Reduced Inequalities', text: 'Reduce inequality within and among countries.' },
  { n: 11, title: 'Sustainable Cities and Communities', text: 'Make cities and human settlements inclusive, safe, resilient and sustainable.' },
  { n: 12, title: 'Responsible Consumption and Production', text: 'Ensure sustainable consumption and production patterns.' },
  { n: 13, title: 'Climate Action', text: 'Take urgent action to combat climate change and its impacts.' },
  { n: 14, title: 'Life Below Water', text: 'Conserve and sustainably use the oceans, seas and marine resources.' },
  { n: 15, title: 'Life on Land', text: 'Protect, restore and promote sustainable use of land ecosystems, forests and biodiversity.' },
  { n: 16, title: 'Peace, Justice and Strong Institutions', text: 'Promote peaceful and inclusive societies, access to justice and effective institutions.' },
  { n: 17, title: 'Partnerships for the Goals', text: 'Strengthen the means of implementation and revitalize the global partnership.' },
];
export const sdgUrl = (n: number) => `https://sdgs.un.org/goals/goal${n}`;
export const sdgIcon = (n: number) => `/sdg/goal-${n}.jpg`;
export const SDG_ABOUT_URL = 'https://sdgs.un.org/goals';
export const focusGoals = (v: string) => [...new Set((v || '').split(/[,\s]+/).map(Number).filter((n) => n >= 1 && n <= 17))];

// "4, 13 ,99" -> "4,13": only valid goals, unique, sorted.
export function normSdg(input: unknown): string {
  const n = String(input ?? '').split(/[,\s]+/).map(Number).filter((x) => Number.isInteger(x) && x >= 1 && x <= 17);
  return [...new Set(n)].sort((a, b) => a - b).join(',');
}
