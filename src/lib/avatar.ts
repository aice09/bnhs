// Avatar styles an administrator can enable for everyone (safe for client and server).
export const AVATAR_STYLES: [string, string, string][] = [
  ['none', 'Initials (default)', 'Colored circle with the person\'s initials.'],
  ['notion', 'Notion style', 'Hand-drawn, Notion-like faces (DiceBear Notionists, in the spirit of notion-avatar.app).'],
  ['boring', 'Boring Avatars', 'Friendly abstract faces from boringavatars.com.'],
  ['multiavatar', 'Multiavatar', 'Unique colorful characters from multiavatar.com.'],
];
export const avatarUrl = (seed: string | number, name = '', style = '') =>
  `/api/avatar?seed=${encodeURIComponent(String(seed))}&name=${encodeURIComponent(name)}${style ? `&style=${style}` : ''}`;
