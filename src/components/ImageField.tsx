'use client';

import { useState } from 'react';

export default function ImageField({ name, initial, required }: { name: string; initial: string; required?: boolean }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setErr('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setUrl(data.url); else setErr(data.error || 'Upload failed');
  }

  return (
    <div>
      <input type="text" name={name} value={url} onChange={(e) => setUrl(e.target.value)} required={required} placeholder="/uploads/... or https://..." />
      <div className="row" style={{ marginTop: 8 }}>
        <input type="file" onChange={(e) => upload(e.target.files?.[0])} />
        {busy && <span className="help">Uploading…</span>}
      </div>
      {err && <div className="help" style={{ color: '#b3261e' }}>{err}</div>}
      {/\.(jpe?g|png|webp|gif)$/i.test(url) && <img src={url} alt="" style={{ maxHeight: 120, marginTop: 8, borderRadius: 8 }} />}
    </div>
  );
}
