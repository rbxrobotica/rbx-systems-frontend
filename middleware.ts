import { NextRequest, NextResponse } from 'next/server';

type Locale = 'pt-BR' | 'en';

const DOMAIN_LOCALE_MAP: Record<string, Locale> = {
  'rbx.ia.br': 'pt-BR',
  'rbxsystems.ch': 'en',
};

const DEFAULT_LOCALE: Locale = 'pt-BR';

const VALID_LOCALES = new Set<Locale>(['pt-BR', 'en']);

function resolveLocale(request: NextRequest): Locale {
  // Cookie takes precedence — user explicit override
  const cookie = request.cookies.get('rbx-locale-override')?.value;
  if (cookie && VALID_LOCALES.has(cookie as Locale)) return cookie as Locale;

  // Fall back to domain-based detection
  // x-forwarded-host is set by Traefik before the Host header can be spoofed
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    '';
  const hostname = host.split(':')[0];
  return DOMAIN_LOCALE_MAP[hostname] ?? DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const locale = resolveLocale(request);
  const response = NextResponse.next();
  // Pass locale to Server Components via a custom header
  response.headers.set('x-rbx-locale', locale);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp).*)',
  ],
};
