import LoginForm from './LoginForm';
import { getSettings } from '@/lib/queries';

export const metadata = { title: 'Admin Login', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Login() {
  const s = await getSettings();
  return (
    <div className="login"><div className="panel" style={{ background: '#fff', padding: 28, borderRadius: 12 }}>
      <h1 style={{ marginTop: 0 }}><i className="fa-solid fa-school" /> {s.short_name || 'School'} CMS</h1>
      <LoginForm />
    </div></div>
  );
}
