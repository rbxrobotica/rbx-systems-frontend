// Save the buyer's random checkout key before POST so a network retry can
// recover the original provider link without relying on an email guess.
const STORAGE_KEY = 'rbx_briefing_checkout_attempt_v1';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type Attempt = { scope: string; id: string };
let memoryAttempt: Attempt | null = null;

export async function checkoutAttemptID(details: {
  email: string;
  name: string;
  doc: string;
  phone: string;
  company: string;
  planID: string;
  method: string;
  seats: number;
}): Promise<string> {
  const scopeBytes = new TextEncoder().encode(
    JSON.stringify([
      details.email.toLowerCase(),
      details.name,
      details.doc,
      details.phone,
      details.company,
      details.planID,
      details.method,
      details.seats
    ])
  );
  const digest = await crypto.subtle.digest('SHA-256', scopeBytes);
  const scope = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  let stored: Attempt | null = memoryAttempt;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as Attempt;
  } catch {
    // Keep the attempt in memory if session storage is blocked.
  }
  if (stored?.scope === scope && UUID_V4.test(stored.id)) {
    memoryAttempt = stored;
    return stored.id;
  }
  const next = { scope, id: crypto.randomUUID() };
  memoryAttempt = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Same-page retries still reuse the in-memory key.
  }
  return next.id;
}

export function clearCheckoutAttempt(): void {
  memoryAttempt = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Session storage may be unavailable.
  }
}
