import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'lsm_authenticated';
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

const PROVIDER_WORKSPACE_PREFIXES = [
  '/provider/profile',
  '/provider/availability',
  '/provider/services',
  '/provider/onboarding',
] as const;

function isProviderWorkspaceRoute(pathname: string): boolean {
  return PROVIDER_WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === '1';
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
  const isAccountRoute = pathname === '/account' || pathname.startsWith('/account/');
  const isOrganizationRoute = pathname === '/organization' || pathname.startsWith('/organization/');
  const isProviderWorkspace = isProviderWorkspaceRoute(pathname);

  if ((isAccountRoute || isOrganizationRoute || isProviderWorkspace) && !isAuthenticated) {
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
  matcher: [
    '/account/:path*',
    '/organization/:path*',
    '/provider/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
