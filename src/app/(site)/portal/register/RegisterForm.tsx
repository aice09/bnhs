'use client';

import { useActionState } from 'react';
import { register } from '../actions';

export default function RegisterForm({ initialRole }: { initialRole: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  if (state?.ok) return <div className="alert ok"><i className="fa-solid fa-circle-check" /> Thank you! Your registration was received. You can sign in as soon as the school administrator approves your account.</div>;
  const v = state?.v;
  return (
    <form action={action} key={state?.n}>
      {state?.error && <div className="alert err">{state.error}</div>}
      <div className="fld"><label htmlFor="role">I am a</label>
        <select id="role" name="role" defaultValue={v?.role || initialRole}><option value="alumni">Alumnus / alumna</option><option value="student">Current student</option></select></div>
      <div className="fld"><label htmlFor="name">Full name</label><input id="name" name="name" defaultValue={v?.name} required /></div>
      <div className="fld"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={v?.email} required autoComplete="username" /></div>
      <div className="fld"><label htmlFor="grad_year">Year of graduation (alumni)</label><input id="grad_year" name="grad_year" type="number" min={1950} max={2100} defaultValue={v?.grad_year} /></div>
      <div className="fld"><label htmlFor="password">Password (10+ characters)</label><input id="password" name="password" type="password" minLength={10} required autoComplete="new-password" /></div>
      <div className="fld"><label htmlFor="note">Note for the school (optional)</label><input id="note" name="note" placeholder="e.g. grade/section, adviser, batch mates" /></div>
      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={pending}>{pending ? 'Sending…' : 'Register'}</button>
    </form>
  );
}
