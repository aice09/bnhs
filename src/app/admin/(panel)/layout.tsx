import Avatar from '@/components/Avatar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logout } from '../actions';
import { requireAdmin } from '@/lib/auth';
import { hasPerm } from '@/lib/perms';
import { RESOURCES } from '@/lib/resources';
import { getSettings } from '@/lib/queries';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const TOOLS: [string, string, string, string][] = [
  ['platform', 'Digital Platform', 'diagram-project', '/admin/platform'],
  ['users', 'Users & Alumni', 'user-shield', '/admin/users'],
  ['appearance', 'Appearance', 'palette', '/admin/appearance'],
  ['settings', 'Site Settings', 'gear', '/admin/settings'],
  ['backups', 'Backups & Storage', 'database', '/admin/backups'],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const s = await getSettings();
  if (user.role === 'admin' && !s.setup_done) redirect('/admin/setup');
  return (
    <div className="adm">
      <aside>
        <div className="ttl"><i className="fa-solid fa-school" /> {s.short_name || 'School'} CMS</div>
        <Link href="/admin"><i className="fa-solid fa-gauge" /> Dashboard</Link>
        {[['', 'Content'], ['sections', 'Page sections'], ['optional', 'Optional pages'], ['access', 'Groups']].map(([g, title]) => {
          const list = Object.entries(RESOURCES).filter(([, r]) => (r.group ?? '') === g && hasPerm(user, r.perm));
          return list.length > 0 && (
            <div key={g}>
              <div className="grp">{title}</div>
              {list.map(([k, r]) => <Link key={k} href={`/admin/${k}`}><i className={`fa-solid fa-${r.icon}`} /> {r.label}</Link>)}
            </div>
          );
        })}
        <div className="row" style={{ padding: '10px 14px', gap: 10, color: '#fff' }}><Avatar seed={user.id} name={user.name} size={36} /><span><b>{user.name}</b><br /><small>{user.role}</small></span></div>
        <div className="grp">Administration</div>
        {TOOLS.filter(([p]) => hasPerm(user, p)).map(([p, label, icon, href]) => <Link key={p} href={href}><i className={`fa-solid fa-${icon}`} /> {label}</Link>)}
        <Link href="/admin/account"><i className="fa-solid fa-key" /> Password</Link>
        <Link href="/portal"><i className="fa-solid fa-id-card" /> My portal</Link>
        <Link href="/" target="_blank"><i className="fa-solid fa-arrow-up-right-from-square" /> View site</Link>
        <form action={logout}><button><i className="fa-solid fa-right-from-bracket" /> Sign out ({user.name})</button></form>
      </aside>
      <main>{children}</main>
    </div>
  );
}
