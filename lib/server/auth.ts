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

function base64url(input: ArrayBuffer | string) {
  const buff = input instanceof ArrayBuffer ? new Uint8Array(input) : new TextEncoder().encode(input);
  return btoa(String.fromCharCode(...buff)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function hmacSha256(key: string, data: string): Promise<ArrayBuffer> {
  const keyBuffer = new TextEncoder().encode(key);
  const dataBuffer = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
}

export async function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>, ttlSeconds: number): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const body: SessionPayload = { ...payload, iat, exp };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const hmac = await hmacSha256(getSecret(), unsigned);
  const sig = base64url(hmac);
  return `${unsigned}.${sig}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  try {
    if (!token) return null;
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const unsigned = `${h}.${p}`;
    const expected = base64url(await hmacSha256(getSecret(), unsigned));
    if (!timingSafeEqual(s, expected)) return null;
    const payload: SessionPayload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function setAccessCookie(token: string, maxAgeSeconds: number) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function setRefreshCookie(token: string, maxAgeSeconds: number) {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function clearAuthCookies() {
  const secure = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 });
}

export async function readAccess(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  return verifySession(token);
}

export async function readRefresh(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(REFRESH_COOKIE)?.value;
  return verifySession(token);
}

export function isCommissioner(teamId: string): boolean {
  return teamId === 'T014';
}


