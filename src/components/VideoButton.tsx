'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1]! : '';
}

// mode: modal = play inside a pop-up, youtube = open YouTube in a new tab, page = go to any page of the site.
export default function VideoButton({ label, url, mode, className = 'btn ghost' }: { label: string; url: string; mode: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = youtubeId(url);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  const inner = <><span className="playdot"><i className="fa-solid fa-play" /></span> {label}</>;
  if (mode === 'page' || !id) {
    return url.startsWith('/') ? <Link className={className} href={url}>{inner}</Link> : <a className={className} href={url} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  if (mode === 'youtube') return <a className={className} href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">{inner}</a>;
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{inner}</button>
      {open && (
        <div className="vmodal" role="dialog" aria-modal="true" aria-label={label} onClick={() => setOpen(false)}>
          <div className="vbox" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="vclose" onClick={() => setOpen(false)} aria-label="Close video"><i className="fa-solid fa-xmark" /></button>
            <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={label} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
        </div>)}
    </>
  );
}
