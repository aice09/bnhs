'use client';

import { useActionState } from 'react';
import { sendMessage, type ContactState } from './actions';

export default function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, {});
  if (state.ok) return <div className="alert"><i className="fa-solid fa-circle-check" /> Thank you! Your message has been sent.</div>;
  return (
    <form action={action} key={state.n}>
      {state.error && <div className="alert err">{state.error}</div>}
      <div className="fld"><label htmlFor="name">Your name</label><input id="name" name="name" type="text" defaultValue={state.values?.name} required maxLength={120} /></div>
      <div className="fld"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={state.values?.email} required /></div>
      <div className="fld"><label htmlFor="subject">Subject</label><input id="subject" name="subject" type="text" defaultValue={state.values?.subject} maxLength={160} /></div>
      <div className="fld"><label htmlFor="message">Message</label><textarea id="message" name="message" defaultValue={state.values?.message} rows={5} required maxLength={4000} /></div>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden />
      <button className="btn" disabled={pending}><i className="fa-solid fa-paper-plane" /> {pending ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
