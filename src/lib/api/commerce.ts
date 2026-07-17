/**
 * Resolve the public rbx-commerce API base URL from the current browser host.
 * Returns the production origin for the matching domain, or localhost for dev.
 */
export function getCommerceBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const host = window.location.host;

  if (host.includes('rbxsystems.ch')) {
    return 'https://commerce.rbxsystems.ch';
  }

  if (host.includes('rbx.ia.br')) {
    return 'https://commerce.rbx.ia.br';
  }

  // Development fallback — can be overridden via VITE_COMMERCE_BASE_URL.
  return import.meta.env?.VITE_COMMERCE_BASE_URL ?? 'http://localhost:8081';
}
