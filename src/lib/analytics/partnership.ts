import { browser } from '$app/environment';
import { trackEvent, type EventProps } from './index';
import { getFirstTouchUtm, getLastTouchUtm } from './utm';

export type PartnershipEvent =
  | 'offer_view'
  | 'cta_click'
  | 'form_start'
  | 'form_submit'
  | 'form_success'
  | 'form_error'
  | 'evidence_view'
  | 'evidence_code_open';

export interface PartnershipEventProps {
  locale: 'pt-BR' | 'en';
  surface: 'products' | 'partnership';
  entry: 'hero' | 'footer' | 'offer' | 'form' | 'gallery' | 'chat';
  destination?: 'partnership' | 'qualification' | 'portfolio' | 'product' | 'source' | 'capture';
  product?:
    | 'robson'
    | 'strategos'
    | 'verentir'
    | 'thalamus'
    | 'robson-code'
    | 'satwake'
    | 'kulinaryos';
  error?: 'validation' | 'challenge' | 'network' | 'http' | 'timeout' | 'unavailable';
}

// Advance alongside the public commercial terms, not on each page edit.
export const PARTNERSHIP_OFFER_VERSION = '2026-10-05';

const events = new Set<PartnershipEvent>([
  'offer_view',
  'cta_click',
  'form_start',
  'form_submit',
  'form_success',
  'form_error',
  'evidence_view',
  'evidence_code_open'
]);
const allowedValues: Record<keyof PartnershipEventProps, readonly string[]> = {
  locale: ['pt-BR', 'en'],
  surface: ['products', 'partnership'],
  entry: ['hero', 'footer', 'offer', 'form', 'gallery', 'chat'],
  destination: ['partnership', 'qualification', 'portfolio', 'product', 'source', 'capture'],
  product: ['robson', 'strategos', 'verentir', 'thalamus', 'robson-code', 'satwake', 'kulinaryos'],
  error: ['validation', 'challenge', 'network', 'http', 'timeout', 'unavailable']
};

/** Only a fixed vocabulary reaches analytics, even if a caller spreads form data. */
export function trackPartnershipEvent(event: PartnershipEvent, props: PartnershipEventProps): void {
  if (!browser || !events.has(event) || !props) return;
  const hostname = window.location.hostname;
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    /^127\./.test(hostname) ||
    hostname === '[::1]' ||
    hostname === '::1'
  )
    return;
  try {
    if (window.localStorage.getItem('plausible_ignore') === 'true') return;
  } catch {
    // Plausible works without storage; no tracking identifiers are created here.
  }

  const safe: EventProps = {
    offer: 'engineering-partnership',
    offer_version: PARTNERSHIP_OFFER_VERSION
  };
  for (const key of Object.keys(allowedValues) as (keyof PartnershipEventProps)[]) {
    const value = props[key];
    if (typeof value === 'string' && allowedValues[key].includes(value)) safe[key] = value;
  }
  if (!safe.locale || !safe.surface || !safe.entry) return;
  const path =
    safe.surface === 'products'
      ? safe.locale === 'pt-BR'
        ? '/produtos'
        : '/products'
      : safe.locale === 'pt-BR'
        ? '/parceria'
        : '/partnership';

  try {
    trackEvent(event, safe, {
      url: `${window.location.origin}${path}`,
      interactive: event !== 'offer_view' && event !== 'evidence_view'
    });
  } catch {
    // Telemetry must never interrupt navigation or a commercial submission.
  }
}

const attributionValues: Record<string, readonly string[]> = {
  utm_source: [
    'linkedin',
    'instagram',
    'facebook',
    'google',
    'referral',
    'outbound',
    'organic',
    'direct',
    'briefing',
    'robson',
    'newsletter',
    'partner'
  ],
  utm_medium: [
    'social_organic',
    'social_paid',
    'email',
    'referral',
    'outbound',
    'none',
    'newsletter'
  ],
  // Shared campaign labels, never an individual's name or a per-lead identifier.
  utm_campaign: ['2026h2_b2b_networking_001', '2026h2_b2b_partnership_001'],
  utm_content: ['b2b_portfolio_partnership_001', 'b2b_institutional_partnership_001']
};

/**
 * Optional context for the submitted commercial request, separate from analytics.
 * Revalidate persisted UTMs because local/session storage is not a trusted source.
 * No storage writes, free-text terms, arbitrary campaign names or raw URLs.
 */
export function getPartnershipAttribution(): Record<string, string> {
  if (!browser) return {};
  const result: Record<string, string> = {};
  try {
    const touches = { first_touch: getFirstTouchUtm(), last_touch: getLastTouchUtm() };
    for (const [touch, values] of Object.entries(touches)) {
      if (!values || typeof values !== 'object') continue;
      for (const [key, allowed] of Object.entries(attributionValues)) {
        const value = (values as Record<string, unknown>)[key];
        if (typeof value === 'string' && allowed.includes(value)) result[`${touch}_${key}`] = value;
      }
    }
  } catch {
    // Missing/blocked storage must not make the qualification form unusable.
  }
  return result;
}
