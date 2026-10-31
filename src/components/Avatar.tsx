import { avatarUrl } from '@/lib/avatar';

// Shows the person's photo, otherwise the avatar style the administrator enabled.
export default function Avatar({ seed, name = '', photo = '', size = 40, className = '' }: { seed: string | number; name?: string; photo?: string; size?: number; className?: string }) {
  return <img className={'avatar ' + className} src={photo || avatarUrl(seed, name)} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
}
