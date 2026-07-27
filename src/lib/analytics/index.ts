/**
 * Analytics provider abstraction for RBX public sites.
 *
 * Current provider: Plausible (privacy-friendly, script-based).
 * Configured via environment variables (per-domain pods):
 *   - VITE_PLAUSIBLE_DOMAIN      (e.g. rbx.ia.br or rbxsystems.ch)
 *   - VITE_PLAUSIBLE_SCRIPT_SRC  per-site script, e.g.
 *                                https://plausible.rbxsystems.ch/js/pa-<id>.js
 *   - VITE_PLAUSIBLE_API_HOST    (optional, self-hosted event endpoint)
 *
 * The script is per site: it embeds the domain and the event endpoint, and it
 * sends nothing until `plausible.init()` runs. The `data-domain` attribute the
 * older snippet used is not a bootstrap on this version.
 *
 * In production these are runtime pod envs surfaced through layout data
 * (see +layout.server.ts); VITE_* build-time values only apply in local dev.
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

// Runtime config provided by the server layout (pod env). Build-time
// VITE_* vars win when present (local dev); otherwise fall back to this.
let runtimeConfig: AnalyticsConfig | null = null;

/** Called by Analytics.svelte with the config resolved server-side. */
export function setRuntimeConfig(config: AnalyticsConfig): void {
  runtimeConfig = config;
}

export function getAnalyticsConfig(): AnalyticsConfig | null {
  const domain = import.meta.env?.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  const scriptSrc = import.meta.env?.VITE_PLAUSIBLE_SCRIPT_SRC as string | undefined;
  const apiHost = import.meta.env?.VITE_PLAUSIBLE_API_HOST as string | undefined;
  if (!domain || !scriptSrc) return runtimeConfig;
  return { domain, scriptSrc, apiHost };
}

interface PlausibleGlobal {
  (name: string, options?: { u?: string; props?: EventProps }): void;
  q?: IArguments[];
  init?: (options?: Record<string, unknown>) => void;
  o?: Record<string, unknown>;
}

/**
 * Install the queue stub and start the tracker.
 *
 * Verbatim behaviour of Plausible's install snippet: calls made before the
 * async script lands are pushed onto `plausible.q` and replayed once it loads,
 * and `init()` marks the tracker as started. Without this call the script loads
 * and does nothing, which is exactly how this site silently recorded zero
 * pageviews while looking correctly instrumented.
 *
 * Idempotent: a second call reuses the stub the first one installed.
 */
export function bootstrapPlausible(): void {
  if (!browser) return;
  const w = window as unknown as { plausible?: PlausibleGlobal };

  if (!w.plausible) {
    const stub = function (this: unknown, ...args: unknown[]) {
      (stub.q = stub.q || []).push(args as unknown as IArguments);
    } as unknown as PlausibleGlobal;
    w.plausible = stub;
  }
  const p = w.plausible;
  if (!p.init) {
    p.init = (options?: Record<string, unknown>) => {
      p.o = options ?? {};
    };
  }
  p.init();
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
