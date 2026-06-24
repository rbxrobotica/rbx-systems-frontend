/**
 * Resolve the public rbx-comms API base URL from the current browser host.
 * Returns the production origin for the matching domain, or localhost for dev.
 */
export function getCommsBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const host = window.location.host;

  if (host.includes('rbxsystems.ch')) {
    return 'https://api.comms.rbxsystems.ch';
  }

  if (host.includes('rbx.ia.br')) {
    return 'https://api.comms.rbx.ia.br';
  }

  // Development fallback — can be overridden via VITE_COMMS_BASE_URL.
  return import.meta.env?.VITE_COMMS_BASE_URL ?? 'http://localhost:8080';
}
