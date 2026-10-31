import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getSettings } from '@/lib/queries';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const KINDS: Record<string, { title: string; icon: string; text: string }> = {
  student: { title: 'Student login', icon: 'user-graduate', text: 'Access your student groups, organizations and publication workspace.' },
  alumni: { title: 'Alumni login', icon: 'people-roof', text: 'Manage your alumni profile and stay connected with the school.' },
  research: { title: 'Research center login', icon: 'microscope', text: 'For research center members: manage your projects and write research news.' },
  athletics: { title: 'Athletics login', icon: 'medal', text: 'For student athletes, team leaders, coaches (including outside coaches) and sports managers.' },
  partner: { title: 'Partner login', icon: 'handshake', text: 'For partner organizations and the partnerships team: review applications and manage partnerships.' },
};

export default async function Login({ searchParams }: { searchParams: Promise<{ as?: string; next?: string }> }) {
  const sp = await searchParams;
  if (await getUser()) redirect(sp.next?.startsWith('/portal') ? sp.next : '/portal');
  const k = KINDS[sp.as || ''] ?? { title: 'Sign in', icon: 'right-to-bracket', text: 'Students, alumni and research center members sign in here.' };
  const s = await getSettings();
  return (
    <div className="authbox">
      <h1 style={{ marginTop: 0 }}><i className={`fa-solid fa-${k.icon}`} /> {k.title}</h1>
      <p className="help" style={{ marginTop: -6 }}>{s.school_name}. {k.text}</p>
      <LoginForm next={sp.next?.startsWith('/portal') ? sp.next : undefined} />
      <p className="help" style={{ marginTop: 16 }}>
        New here? <Link href={`/portal/register${sp.as === 'alumni' ? '?as=alumni' : ''}`}>Create an account</Link>. Research center members and group officers are added by the school administrator.<br />
        Staff? <Link href="/admin/login">Admin login</Link>.
      </p>
    </div>
  );
}
