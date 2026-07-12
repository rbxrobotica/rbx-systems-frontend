/**
 * Analytics provider abstraction for RBX public sites.
 *
 * Current provider: Plausible (privacy-friendly, script-based).
 * Configured via runtime environment variables:
 *   - PLAUSIBLE_DOMAIN      (e.g. rbx.ia.br or rbxsystems.ch)
 *   - PLAUSIBLE_SCRIPT_SRC  (e.g. https://plausible.io/js/script.js)
 *
 * If no domain is configured, the provider is a no-op and emits nothing.
 */
import { browser } from '$app/environment';

export type EventName =
  | 'pageview'
  | 'cta_click'
  | 'form_start'
  | 'form_submit'
  | 'form_success'
  | 'form_error'
  | 'whatsapp_click'
  | 'chat_open';

export interface EventProps {
  [key: string]: string | number | boolean;
}

export interface AnalyticsConfig {
  domain: string;
  scriptSrc: string;
  apiHost?: string;
}

export function getAnalyticsConfig(): AnalyticsConfig | null {
  const domain = import.meta.env?.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  const scriptSrc = import.meta.env?.VITE_PLAUSIBLE_SCRIPT_SRC as string | undefined;
  const apiHost = import.meta.env?.VITE_PLAUSIBLE_API_HOST as string | undefined;
  if (!domain || !scriptSrc) return null;
  return { domain, scriptSrc, apiHost };
}

export function trackPageview(url?: string): void {
  if (!browser) return;
  const config = getAnalyticsConfig();
  if (!config) return;

  const plausible = (window as unknown as Record<string, unknown>).plausible as
    | ((name: string, options?: { u?: string }) => void)
    | undefined;

  if (typeof plausible === 'function') {
    plausible('pageview', { u: url ?? window.location.href });
  }
}

export function trackEvent(name: EventName, props?: EventProps): void {
  if (!browser) return;
  const config = getAnalyticsConfig();
  if (!config) return;

  const plausible = (window as unknown as Record<string, unknown>).plausible as
    | ((name: string, options?: { props?: EventProps }) => void)
    | undefined;

  if (typeof plausible === 'function') {
    plausible(name, { props });
  }
}
