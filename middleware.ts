import { NextRequest, NextResponse } from 'next/server';

const ROLE_PATHS: Record<string, string> = {
  super_admin:  '/admin',
  center_admin: '/dashboard',
  teacher:      '/tools',
};

const PUBLIC_PATHS = ['/login', '/signup', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const role      = request.cookies.get('kids_role')?.value;
  const status    = request.cookies.get('kids_status')?.value;
  const orgStatus = request.cookies.get('kids_org_status')?.value;

  // 인증된 사용자가 /login 접근
  if (pathname === '/login' && role) {
    if (status === 'pending')         return NextResponse.redirect(new URL('/pending', request.url));
    if (orgStatus === 'suspended')    return NextResponse.redirect(new URL('/suspended', request.url));
    if (ROLE_PATHS[role])             return NextResponse.redirect(new URL(ROLE_PATHS[role], request.url));
  }

  // 공개 경로
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // /pending
  if (pathname === '/pending') {
    if (!role) return NextResponse.redirect(new URL('/login', request.url));
    if (status !== 'pending') return NextResponse.redirect(new URL(ROLE_PATHS[role] ?? '/tools', request.url));
    return NextResponse.next();
  }

  // /suspended
  if (pathname === '/suspended') {
    if (!role) return NextResponse.redirect(new URL('/login', request.url));
    if (orgStatus !== 'suspended') return NextResponse.redirect(new URL(ROLE_PATHS[role] ?? '/tools', request.url));
    return NextResponse.next();
  }

  // 미인증
  if (!role) return NextResponse.redirect(new URL('/login', request.url));
  if (status === 'inactive') return NextResponse.redirect(new URL('/login', request.url));
  if (status === 'pending') return NextResponse.redirect(new URL('/pending', request.url));
  if (orgStatus === 'suspended') return NextResponse.redirect(new URL('/suspended', request.url));

  // super_admin은 모든 경로 허용
  if (role === 'super_admin') return NextResponse.next();

  const allowedPrefix = ROLE_PATHS[role];
  if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    const isProtected = Object.values(ROLE_PATHS).some((p) => pathname.startsWith(p));
    if (isProtected) return NextResponse.redirect(new URL(allowedPrefix, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/tools/:path*',
    '/pending',
    '/suspended',
  ],
};
