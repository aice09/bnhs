'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export type Slide = { key: string; kicker: string; title: string; text: string; image: string; href: string; cta: string };

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [paused, slides.length]);
  const go = (n: number) => setI((n + slides.length) % slides.length);
  return (
    <section className="hcar" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="Featured stories">
      {slides.map((s, n) => (
        <div key={s.key} className={'hslide' + (n === i ? ' on' : '')} aria-hidden={n !== i} style={s.image ? { backgroundImage: `url(${s.image})` } : undefined}>
          <div className="wrap hin">
            <div className="eyebrow">{s.kicker}</div>
            <h1>{s.title}</h1>
            <p>{s.text}</p>
            <div className="btns"><Link className="btn gold" href={s.href} tabIndex={n === i ? 0 : -1}>{s.cta} <i className="fa-solid fa-arrow-right" /></Link></div>
          </div>
        </div>))}
      {slides.length > 1 && (
        <div className="hctl">
          <button type="button" onClick={() => go(i - 1)} aria-label="Previous slide"><i className="fa-solid fa-chevron-left" /></button>
          {slides.map((s, n) => <button type="button" key={s.key} className={'hdot' + (n === i ? ' on' : '')} onClick={() => go(n)} aria-label={`Slide ${n + 1}`} />)}
          <button type="button" onClick={() => go(i + 1)} aria-label="Next slide"><i className="fa-solid fa-chevron-right" /></button>
        </div>)}
    </section>
  );
}
