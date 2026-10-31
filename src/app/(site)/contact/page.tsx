import type { Metadata } from 'next';
import { describe, place } from '@/lib/site';
import PageHero from '@/components/PageHero';
import { getSettings } from '@/lib/queries';
import ContactForm from './ContactForm';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: `Contact Us${place(s) ? ' – ' + place(s) : ''}`, description: describe(s, `Address, map and contact form${s.address ? ' (' + s.address + ')' : ''}`), alternates: { canonical: '/contact' } };
}

export default async function Contact() {
  const s = await getSettings();
  return (
    <>
      <PageHero title="Contact Us" crumbs={[['Contact']]} />
      <section className="s"><div className="wrap grid g2">
        <div>
          <h2>Get in touch</h2>
          <address style={{ fontStyle: 'normal' }}>
            <p><i className="fa-solid fa-location-dot" /> <b>{s.school_name}</b><br />{s.address}</p>
            {s.phone && <p><i className="fa-solid fa-phone" /> {s.phone}</p>}
            {s.email && <p><i className="fa-solid fa-envelope" /> <a href={`mailto:${s.email}`}>{s.email}</a></p>}
            {s.facebook_url && <p><i className="fa-brands fa-facebook" /> <a href={s.facebook_url} target="_blank" rel="noopener noreferrer">Official Facebook page</a></p>}
          </address>
          {s.map_embed && <iframe title={`Map of ${s.school_name}`} src={s.map_embed} loading="lazy" style={{ border: 0, width: '100%', height: 300, borderRadius: 10 }} referrerPolicy="no-referrer-when-downgrade" />}
        </div>
        <div className="panel-box"><h2>Send a message</h2><ContactForm /></div>
      </div></section>
    </>
  );
}
