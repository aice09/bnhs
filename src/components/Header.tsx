'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from './Logo';
import type { NavGroup } from '@/lib/nav';

export default function Header({ name, short, logo, groups, user }: { name: string; short: string; logo: string; groups: NavGroup[]; user?: { name: string; staff: boolean } | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const active = (g: NavGroup) => (g.href ? (g.href === '/' ? path === '/' : path.startsWith(g.href)) : false) || g.items.some((i) => path.startsWith(i.href) && i.href !== '/');
  return (
    <header className="site">
      <div className="wrap">
        <Link href="/" className="brand" aria-label={name} onClick={close}>
          <Logo src={logo} name={name} size={50} />
          <span><b>{short}</b><small>{name}</small></span>
        </Link>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
        <nav className={'main' + (open ? ' open' : '')} aria-label="Main">
          {groups.map((g) => (
            <div key={g.label} className={'dd' + (g.items.length > 1 ? ' has' : '')}>
              {g.href ? <Link href={g.href} className={active(g) ? 'on' : ''} onClick={close}>{g.label}{g.items.length > 1 && <i className="fa-solid fa-chevron-down caret" />}</Link>
                : <span className={'lbl' + (active(g) ? ' on' : '')} tabIndex={0}>{g.label}<i className="fa-solid fa-chevron-down caret" /></span>}
              {g.items.length > 1 || !g.href ? (
                <div className="menu">{g.items.map((i) => <Link key={i.href} href={i.href} onClick={close}>{i.label}</Link>)}</div>
              ) : null}
            </div>
          ))}
          <Link href={user ? (user.staff ? '/admin' : '/portal') : '/portal/login'} onClick={close}><i className="fa-solid fa-user" /> {user ? 'My portal' : 'Sign in'}</Link>
          <Link href="/admissions" className="cta" onClick={close}>Enroll</Link>
        </nav>
      </div>
    </header>
  );
}
