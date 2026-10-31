'use client';

import { useActionState } from 'react';
import { changePassword } from '../../actions';

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as { error?: string; ok?: boolean });
  return (
    <form action={action}>
      {state.error && <div className="alert err">{state.error}</div>}
      {state.ok && <div className="alert">Password updated.</div>}
      <div className="fld"><label htmlFor="pw">New password (min. 10 characters)</label><input id="pw" name="password" type="password" minLength={10} required autoComplete="new-password" /></div>
      <button className="btn" disabled={pending}>Update password</button>
    </form>
  );
}
