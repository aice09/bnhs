'use client';

import { useActionState } from 'react';
import { login } from '../actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} key={state?.n}>
      {state?.error && <div className="alert err">{state.error}</div>}
      <div className="fld"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={state?.email} required autoComplete="username" /></div>
      <div className="fld"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
