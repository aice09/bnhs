import Link from 'next/link';

export default function PageHero({ title, sub, crumbs = [], image }: { title: string; sub?: string; crumbs?: [string, string?][]; image?: string }) {
  return (
    <div className={'page-hero' + (image ? ' has-img' : '')} style={image ? { backgroundImage: `linear-gradient(color-mix(in srgb, var(--g9) 80%, transparent), color-mix(in srgb, var(--g9) 80%, transparent)), url(${image})` } : undefined}>
      <div className="wrap">
        <div className="crumbs">
          <Link href="/">Home</Link>
          {crumbs.map(([t, h]) => (<span key={t}> / {h ? <Link href={h}>{t}</Link> : t}</span>))}
        </div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}
