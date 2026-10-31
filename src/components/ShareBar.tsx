'use client';

import { useState } from 'react';

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [done, setDone] = useState(false);
  const enc = encodeURIComponent;
  const copy = async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { window.prompt('Copy this link', url); } };
  return (
    <div className="share">
      <span className="meta">Share:</span>
      <a className="btn out sm" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-facebook" /> Facebook</a>
      <a className="btn out sm" href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-x-twitter" /> Post</a>
      <button type="button" className="btn out sm" onClick={copy}><i className={`fa-solid fa-${done ? 'check' : 'link'}`} /> {done ? 'Copied' : 'Copy link'}</button>
      <button type="button" className="btn out sm" onClick={() => window.print()}><i className="fa-solid fa-print" /> Print</button>
    </div>
  );
}
