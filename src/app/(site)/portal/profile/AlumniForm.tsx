'use client';

import { useActionState } from 'react';
import ImageField from '@/components/ImageField';
import { saveAlumniProfile } from '../actions';

export default function AlumniForm({ p }: { p: any }) {
  const [state, action, pending] = useActionState(saveAlumniProfile, {} as { error?: string; ok?: boolean; n?: number });
  return (
    <form action={action}>
      {state.error && <div className="alert err">{state.error}</div>}
      {state.ok && <div className="alert ok">Profile saved.</div>}
      <div className="fld"><label>Batch (year graduated)</label><input name="grad_year" type="number" defaultValue={p?.grad_year ?? ''} /></div>
      <div className="fld"><label>Track / program</label><input name="program" defaultValue={p?.program} /></div>
      <div className="fld"><label>Occupation</label><input name="occupation" defaultValue={p?.occupation} /></div>
      <div className="fld"><label>Employer / school</label><input name="employer" defaultValue={p?.employer} /></div>
      <div className="fld"><label>Location</label><input name="location" defaultValue={p?.location} /></div>
      <div className="fld"><label>About me</label><textarea name="bio" rows={4} defaultValue={p?.bio} maxLength={1500} /></div>
      <div className="fld"><label>Photo</label><ImageField name="photo" initial={p?.photo ?? ''} /></div>
      <div className="fld"><label>LinkedIn (https://…)</label><input name="linkedin" defaultValue={p?.linkedin} /></div>
      <div className="fld"><label>Contact email</label><input name="contact_email" type="email" defaultValue={p?.contact_email} /></div>
      <label style={{ fontWeight: 400 }}><input type="checkbox" name="show_contact" defaultChecked={p?.show_contact} style={{ width: 'auto' }} /> Show my contact email on my public profile</label><br />
      <label style={{ fontWeight: 400 }}><input type="checkbox" name="listed" defaultChecked={p?.listed ?? true} style={{ width: 'auto' }} /> List me in the public alumni directory</label>
      <div style={{ marginTop: 14 }}><button className="btn" disabled={pending}>Save profile</button></div>
    </form>
  );
}
