'use client';

import { useActionState } from 'react';
import { submitApplication } from '../portal/actions';

type S = { error?: string; ok?: boolean; n?: number; v?: Record<string, string> };

export default function ApplyForm() {
  const [state, action, pending] = useActionState<S, FormData>(submitApplication as (s: S, f: FormData) => Promise<S>, {});
  if (state.ok) return <div className="alert"><i className="fa-solid fa-circle-check" /> Application received. The Admission Office will contact you by email.</div>;
  return (
    <form action={action} key={state.n}>
      {state.error && <div className="alert err">{state.error}</div>}
      <div className="row">
        <div className="fld" style={{ flex: 1, minWidth: 180 }}><label htmlFor="kind">Application type</label>
          <select id="kind" name="kind"><option>Enrollment</option><option>Transfer</option><option>Senior High</option></select></div>
        <div className="fld" style={{ flex: 1, minWidth: 140 }}><label htmlFor="grade">Grade level</label>
          <select id="grade" name="grade">{[7, 8, 9, 10, 11, 12].map((g) => <option key={g}>{g}</option>)}</select></div>
      </div>
      <div className="fld"><label htmlFor="aname">Learner&apos;s full name</label><input id="aname" name="name" defaultValue={state.v?.name} required maxLength={120} /></div>
      <div className="row">
        <div className="fld" style={{ flex: 1, minWidth: 200 }}><label htmlFor="aemail">Parent / guardian email</label><input id="aemail" name="email" type="email" defaultValue={state.v?.email} required /></div>
        <div className="fld" style={{ flex: 1, minWidth: 160 }}><label htmlFor="aphone">Phone</label><input id="aphone" name="phone" defaultValue={state.v?.phone} maxLength={40} /></div>
      </div>
      <div className="fld"><label htmlFor="aprev">Previous school (for transferees)</label><input id="aprev" name="prev_school" maxLength={160} /></div>
      <div className="fld"><label htmlFor="amsg">Message</label><textarea id="amsg" name="message" rows={3} maxLength={1500} /></div>
      <button className="btn" disabled={pending}><i className="fa-solid fa-paper-plane" /> {pending ? 'Sending…' : 'Submit application'}</button>
    </form>
  );
}
