'use client';

import { useState } from 'react';
import ImageField from '@/components/ImageField';
import { AVATAR_STYLES, avatarUrl } from '@/lib/avatar';
import { PALETTES, themeFromColors, themeCss, type Theme } from '@/lib/theme';

const ROLES: [keyof Theme, string, string][] = [
  ['dark', 'Darkest (header, footer)', ''],
  ['primary', 'Primary (buttons, headings)', ''],
  ['accent', 'Accent (links, highlights)', ''],
  ['light', 'Light background', ''],
  ['gold', 'Highlight (badges, call-outs)', ''],
];

export default function ThemeEditor({ initial, logo, avatar, action }: { initial: Theme; logo: string; avatar: string; action: (fd: FormData) => void }) {
  const [t, setT] = useState<Theme>(initial);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');

  function importColors() {
    const next = themeFromColors(paste);
    if (!next) { setMsg('Paste a colorhunt.co palette link or 3–5 hex codes (e.g. #1B3C53 #234C6A #456882 #E3E3E3).'); return; }
    setT(next); setMsg('Palette applied to the preview. Press Save to publish it.');
  }

  return (
    <form action={action}>
      <style>{themeCss(t).replace(':root', '.tprev')}</style>
      <div className="panel">
        <h2 className="fhead">1. Choose a ready-made palette</h2>
        <div className="palettes">
          {PALETTES.map((p) => (
            <button type="button" key={p.name} className="pal" onClick={() => { setT(p.theme); setMsg(''); }}>
              <span>{Object.values(p.theme).map((c) => <i key={c} style={{ background: c }} />)}</span>{p.name}
            </button>
          ))}
        </div>
        <h2 className="fhead">2. Or use a Color Hunt palette</h2>
        <div className="help">Open <a href="https://colorhunt.co/" target="_blank" rel="noopener noreferrer">colorhunt.co</a>, open a palette, then paste its web address (or its hex codes) here.</div>
        <div className="row" style={{ marginTop: 8 }}>
          <input type="text" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="https://colorhunt.co/palette/1b3c53234c6a456882e3e3e3" style={{ flex: 1, minWidth: 240 }} />
          <button type="button" className="btn out" onClick={importColors}>Apply</button>
        </div>
        {msg && <div className="help">{msg}</div>}
        <h2 className="fhead">3. Fine-tune</h2>
        <div className="colors">
          {ROLES.map(([k, label]) => (
            <label key={k} className="fld">{label}
              <span className="row"><input type="color" name={k} value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} style={{ width: 56, padding: 2 }} /><code>{t[k]}</code></span>
            </label>
          ))}
        </div>
        <div className="tprev">
          <div className="tp-head">Preview header</div>
          <div className="tp-body"><b>Sample heading</b><p>Body text on a light background with an <a href="#" onClick={(e) => e.preventDefault()}>accent link</a>.</p>
            <span className="tp-btn">Primary button</span> <span className="tp-gold">Highlight</span></div>
        </div>
        <h2 className="fhead">4. School logo</h2>
        <ImageField name="logo_url" initial={logo} />
        <div className="help">Upload a new logo (square PNG/SVG works best). It appears in the header, footer, browser tab and social previews.</div>
        <h2 className="fhead">5. Avatars for everyone</h2>
        <div className="help">Pick one style. Students, faculty, alumni and members without a photo get a unique avatar in this style (directory, profiles, groups).</div>
        <div className="avopts">
          {AVATAR_STYLES.map(([k, label, desc]) => (
            <label key={k} className="avopt">
              <input type="radio" name="avatar_style" value={k} defaultChecked={avatar === k} />
              <span className="avprev">{['Maria Santos', 'Juan Dela Cruz', 'Ana Reyes', 'Leo Ramos'].map((n) => <img key={n} src={avatarUrl(n, n, k)} alt="" width={44} height={44} />)}</span>
              <b>{label}</b><small>{desc}</small>
            </label>))}
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn"><i className="fa-solid fa-floppy-disk" /> Save appearance</button>
          <button type="button" className="btn out" onClick={() => setT(PALETTES[0].theme)}>Reset to default</button>
        </div>
      </div>
    </form>
  );
}
