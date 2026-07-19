/**
 * UTM attribution capture for RBX public sites.
 *
 * Implements slice S1/S2 of rbx-growth:
 *   marketing/2026-h2-growth/analytics/briefing-btc-measurement-slice.md
 * Validation rules come from marketing/2026-h2-growth/analytics/utm-taxonomy.yaml
 * (canonical). Values that fail validation are dropped silently, key by key.
 *
 *   - First-touch: localStorage `rbx_utm_first` — written once, immutable.
 *   - Last-touch:  sessionStorage `rbx_utm_last` — overwritten whenever a new
 *     session arrives carrying valid UTMs.
 *
 * UTMs never contain PII (taxonomy rule); storage is best-effort and may be
 * unavailable (private mode) — every read/write is guarded.
 */
import { browser } from '$app/environment';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const FIRST_TOUCH_KEY = 'rbx_utm_first';
const LAST_TOUCH_KEY = 'rbx_utm_last';
const MAX_VALUE_LENGTH = 120;

const UTM_SOURCES = new Set([
  'linkedin',
  'referral',
  'outbound',
  'organic',
  'direct',
  'briefing',
  'robson',
  'newsletter',
  'partner'
]);

const UTM_MEDIUMS = new Set([
  'social_organic',
  'social_paid',
  'email',
  'referral',
  'outbound',
  'none',
  'newsletter'
]);

// utm-taxonomy.yaml validation regexes.
const CAMPAIGN_RE = /^2026h2_(b2b|robson|briefing)_[a-z_]+_[0-9]{3}$/;
const CONTENT_RE = /^(b2b|robson|briefing)_[a-z_]+_[a-z_]+_[0-9]{3}$/;
// <audience>_<segment>, lowercase snake.
const TERM_RE = /^[a-z0-9]+(_[a-z0-9]+)+$/;

function isValid(key: keyof UtmParams, value: string): boolean {
  if (value.length === 0 || value.length > MAX_VALUE_LENGTH) return false;
  switch (key) {
    case 'utm_source':
      return UTM_SOURCES.has(value);
    case 'utm_medium':
      return UTM_MEDIUMS.has(value);
    case 'utm_campaign':
      return CAMPAIGN_RE.test(value);
    case 'utm_content':
      return CONTENT_RE.test(value);
    case 'utm_term':
      return TERM_RE.test(value);
  }
}

/** Parse and validate a query string, dropping invalid keys silently. */
export function parseUtm(search: string): UtmParams | null {
  const params = new URLSearchParams(search);
  const utm: UtmParams = {};
  const keys: (keyof UtmParams)[] = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term'
  ];
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null && isValid(key, value)) {
      utm[key] = value;
    }
  }
  // A touch needs at least a source or a campaign to be worth persisting.
  if (!utm.utm_source && !utm.utm_campaign) return null;
  return utm;
}

function read(storage: Storage, key: string): UtmParams | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as UtmParams;
  } catch {
    return null;
  }
}

function write(storage: Storage, key: string, value: UtmParams): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota) — attribution is best-effort.
  }
}

/**
 * Capture UTMs from the current query string. Call on every client-side
 * navigation: first-touch is preserved, last-touch is overwritten per session.
 */
export function captureUtm(search: string): void {
  if (!browser) return;
  const utm = parseUtm(search);
  if (!utm) return;
  if (!read(localStorage, FIRST_TOUCH_KEY)) {
    write(localStorage, FIRST_TOUCH_KEY, utm);
  }
  write(sessionStorage, LAST_TOUCH_KEY, utm);
}

export function getFirstTouchUtm(): UtmParams | null {
  if (!browser) return null;
  return read(localStorage, FIRST_TOUCH_KEY);
}

export function getLastTouchUtm(): UtmParams | null {
  if (!browser) return null;
  return read(sessionStorage, LAST_TOUCH_KEY);
}

function sameUtm(a: UtmParams, b: UtmParams): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Attribution payload for lead/checkout POSTs: first-touch UTMs win; the
 * last-touch goes along as `last_touch_utm` (JSON string) when it differs.
 * Empty when nothing was captured — fields are optional server-side.
 */
export function getAttributionPayload(): Record<string, string> {
  const first = getFirstTouchUtm();
  if (!first) return {};
  const payload: Record<string, string> = {};
  for (const [key, value] of Object.entries(first)) {
    if (value) payload[key] = value;
  }
  const last = getLastTouchUtm();
  if (last && !sameUtm(first, last)) {
    payload.last_touch_utm = JSON.stringify(last);
  }
  return payload;
}
