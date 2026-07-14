import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'lsm_authenticated';
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === '1';
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
  const isAccountRoute = pathname === '/account' || pathname.startsWith('/account/');

  if (isAccountRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/login', '/register', '/forgot-password', '/reset-password'],
};
