export default function Logo({ src, name, size = 48 }: { src?: string; name: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src || '/logo.png'} alt={`${name} logo`} width={size} height={size} className="logo-img" />;
}
