'use client';
import { useState } from 'react';
import { SDGS, sdgIcon } from '@/lib/sdg';

// Pick the goals an article or project supports; submitted as a comma list in a hidden field.
export default function SdgPicker({ name = 'sdg', initial = '' }: { name?: string; initial?: string }) {
  const [sel, setSel] = useState<number[]>(initial.split(',').map(Number).filter(Boolean));
  const toggle = (n: number) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  return (
    <div className="sdg-pick">
      <input type="hidden" name={name} value={sel.slice().sort((a, b) => a - b).join(',')} />
      {SDGS.map((g) => (
        <button type="button" key={g.n} className={sel.includes(g.n) ? 'on' : ''} onClick={() => toggle(g.n)}
          aria-pressed={sel.includes(g.n)} title={`SDG ${g.n}: ${g.title}`}>
          <img src={sdgIcon(g.n)} alt={`SDG ${g.n}`} width={56} height={56} />
        </button>))}
    </div>
  );
}
