import Link from 'next/link';
import RegisterForm from './RegisterForm';

export const metadata = { title: 'Register', robots: { index: false, follow: false } };

export default async function Register({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const as = (await searchParams).as === 'student' ? 'student' : 'alumni';
  return (
    <div className="authbox">
      <h1 style={{ marginTop: 0 }}><i className="fa-solid fa-user-plus" /> Create an account</h1>
      <p className="help" style={{ marginTop: -6 }}>Accounts are reviewed by the school before they become active.</p>
      <RegisterForm initialRole={as} />
      <p className="help" style={{ marginTop: 16 }}>Already registered? <Link href="/portal/login">Sign in</Link>.</p>
    </div>
  );
}
