import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

const OPEN = ['/admin/login', '/portal/login', '/portal/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN.includes(pathname)) return NextResponse.next();
  const admin = pathname.startsWith('/admin');
  const login = new URL(admin ? '/admin/login' : '/portal/login', req.url);
  try {
    const token = req.cookies.get('school_session')?.value;
    if (!token) throw new Error('no token');
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-insecure-secret'));
    if (admin && payload.role !== 'admin' && payload.role !== 'staff') return NextResponse.redirect(new URL('/portal', req.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(login);
  }
}

export const config = { matcher: ['/admin/:path*', '/portal/:path*'] };
