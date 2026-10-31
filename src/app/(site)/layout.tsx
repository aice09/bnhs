import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { buildNav } from '@/lib/nav';
import { getUser } from '@/lib/auth';
import { isStaff } from '@/lib/perms';
import { enabledPages, getSettings } from '@/lib/queries';
import { describe, siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, pages] = await Promise.all([getSettings(), enabledPages()]);
  const groups = buildNav(pages);
  const site = siteUrl();
  const user = await getUser();
  const names = (s.alt_names || '').split(',').map((x) => x.trim()).filter(Boolean);
  const ld = {
    '@context': 'https://schema.org',
    '@type': ['School', 'EducationalOrganization'],
    '@id': site + '/#school',
    name: s.school_name,
    alternateName: [s.short_name, ...names].filter(Boolean),
    logo: site + (s.logo_url || '/logo.png'),
    image: site + (s.logo_url || '/logo.png'),
    url: site,
    foundingDate: s.established || undefined,
    identifier: s.school_id || undefined,
    description: describe(s, s.levels_text ? s.levels_text[0].toUpperCase() + s.levels_text.slice(1) : 'School'),
    sameAs: s.facebook_url ? [s.facebook_url] : [],
    telephone: s.phone || undefined,
    email: s.email || undefined,
    address: {
      '@type': 'PostalAddress', streetAddress: s.street || undefined, addressLocality: s.city || undefined,
      addressRegion: s.province || undefined, postalCode: s.postal_code || undefined, addressCountry: s.country_code || undefined,
    },
    geo: s.latitude && s.longitude ? { '@type': 'GeoCoordinates', latitude: Number(s.latitude), longitude: Number(s.longitude) } : undefined,
    areaServed: (s.area_served || '').split(',').map((x) => x.trim()).filter(Boolean),
  };
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="topbar">
        <div className="wrap">
          <span><i className="fa-solid fa-location-dot" /> {[s.city, s.province].filter(Boolean).join(', ')}</span>
          <span>
            <a href="/admissions">Admissions</a>
            {s.facebook_url && <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fa-brands fa-facebook" /> Facebook</a>}
          </span>
        </div>
      </div>
      <Header name={s.school_name} short={s.short_name} logo={s.logo_url} groups={groups} user={user ? { name: user.name, staff: isStaff(user) } : null} />
      <main id="main">{children}</main>
      <Footer s={s} groups={groups} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
