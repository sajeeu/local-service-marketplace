import { NextResponse } from 'next/server';

const COOKIE_NAME = 'lsm_authenticated';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { authenticated?: boolean } | null;

  if (!body?.authenticated) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: '1',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
