import crypto from 'crypto';
import { cookies } from 'next/headers';

type SessionPayload = {
  teamId: string;
  teamName: string;
  role: 'commissioner' | 'team';
  iat: number;
  exp: number;
};

const ACCESS_COOKIE = 'dl_access';
const REFRESH_COOKIE = 'dl_refresh';

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('Missing AUTH_SECRET');
  return secret;
}

function base64url(input: Buffer | string) {
  const buff = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buff.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>, ttlSeconds: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const body: SessionPayload = { ...payload, iat, exp };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const hmac = crypto.createHmac('sha256', getSecret()).update(unsigned).digest();
  const sig = base64url(hmac);
  return `${unsigned}.${sig}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  try {
    if (!token) return null;
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const unsigned = `${h}.${p}`;
    const expected = base64url(crypto.createHmac('sha256', getSecret()).update(unsigned).digest());
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAccessCookie(token: string, maxAgeSeconds: number) {
  cookies().set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function setRefreshCookie(token: string, maxAgeSeconds: number) {
  cookies().set(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function clearAuthCookies() {
  const secure = process.env.NODE_ENV === 'production';
  cookies().set(ACCESS_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
  cookies().set(REFRESH_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
}

export function readAccess(): SessionPayload | null {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  return verifySession(token);
}

export function readRefresh(): SessionPayload | null {
  const token = cookies().get(REFRESH_COOKIE)?.value;
  return verifySession(token);
}

export function isCommissioner(teamId: string): boolean {
  return teamId === 'T014';
}


