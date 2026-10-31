'use client';

import { useActionState } from 'react';
import { submitPartnerRequest } from '../../portal/actions';

type S = { error?: string; ok?: boolean; n?: number; v?: Record<string, string> };

export default function PartnerForm({ types, interests, preset = [] }: { types: string[]; interests: string[]; preset?: string[] }) {
  const [state, action, pending] = useActionState<S, FormData>(submitPartnerRequest as (s: S, f: FormData) => Promise<S>, {});
  if (state.ok) return <div className="alert"><i className="fa-solid fa-circle-check" /> Thank you! Your partnership request was received. The Partnerships Office will contact you by email.</div>;
  return (
    <form action={action} key={state.n}>
      {state.error && <div className="alert err">{state.error}</div>}
      <div className="row">
        <div className="fld" style={{ flex: 2, minWidth: 220 }}><label htmlFor="org">Organization / name</label><input id="org" name="org" defaultValue={state.v?.org} required maxLength={160} /></div>
        <div className="fld" style={{ flex: 1, minWidth: 180 }}><label htmlFor="org_type">Type</label>
          <select id="org_type" name="org_type">{types.map((t) => <option key={t}>{t}</option>)}</select></div>
      </div>
      <div className="row">
        <div className="fld" style={{ flex: 1, minWidth: 180 }}><label htmlFor="contact">Contact person</label><input id="contact" name="contact" defaultValue={state.v?.contact} required maxLength={120} /></div>
        <div className="fld" style={{ flex: 1, minWidth: 160 }}><label htmlFor="position">Position</label><input id="position" name="position" maxLength={120} /></div>
      </div>
      <div className="row">
        <div className="fld" style={{ flex: 1, minWidth: 200 }}><label htmlFor="pemail">Email</label><input id="pemail" name="email" type="email" defaultValue={state.v?.email} required /></div>
        <div className="fld" style={{ flex: 1, minWidth: 160 }}><label htmlFor="pphone">Phone</label><input id="pphone" name="phone" defaultValue={state.v?.phone} maxLength={40} /></div>
      </div>
      <fieldset className="fld" style={{ border: 0, padding: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 6 }}>How would you like to help?</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
          {interests.map((i) => <label key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" name="interests" value={i} defaultChecked={preset.includes(i)} style={{ width: 'auto' }} /> {i}</label>)}
        </div>
      </fieldset>
      <div className="fld"><label htmlFor="pmsg">Tell us more</label><textarea id="pmsg" name="message" rows={4} maxLength={2000} placeholder="What would you like to offer, and for which grade levels or programs?" /></div>
      <button className="btn" disabled={pending}><i className="fa-solid fa-handshake" /> {pending ? 'Sending…' : 'Send partnership request'}</button>
    </form>
  );
}
