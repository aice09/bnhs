'use server';

import { headers } from 'next/headers';
import { rateLimit } from '@/lib/cache';
import { query } from '@/lib/db';

export type ContactState = { ok?: boolean; error?: string; values?: Record<string, string>; n?: number };

export async function sendMessage(_: ContactState, fd: FormData): Promise<ContactState> {
  if (fd.get('website')) return { ok: true }; // honeypot
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!(await rateLimit('contact:' + ip, 5, 3600))) return { error: 'Too many messages. Please try again later.' };
  const name = String(fd.get('name') || '').trim().slice(0, 120);
  const email = String(fd.get('email') || '').trim().slice(0, 160);
  const subject = String(fd.get('subject') || '').trim().slice(0, 160);
  const message = String(fd.get('message') || '').trim().slice(0, 4000);
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Please provide your name, a valid email and a message.', values: { name, email, subject, message }, n: Date.now() };
  await query('INSERT INTO messages(name,email,subject,message) VALUES($1,$2,$3,$4)', [name, email, subject, message]);
  return { ok: true };
}
