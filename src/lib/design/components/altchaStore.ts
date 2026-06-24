import { writable, derived, get } from 'svelte/store';

export type AltchaState = 'idle' | 'loading' | 'verified' | 'error';

interface Challenge {
  algorithm: string;
  challenge: string;
  salt: string;
  maxNumber: number;
  signature: string;
}

function createAltchaStore(challengeurl: string) {
  const state = writable<AltchaState>('idle');
  const errorText = writable<string | null>(null);
  const payload = writable<string | null>(null);

  async function sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function solveChallenge(
    challenge: string,
    salt: string,
    maxNumber: number
  ): Promise<number | null> {
    for (let i = 0; i <= maxNumber; i++) {
      const hash = await sha256(salt + i);
      if (hash === challenge) {
        return i;
      }
    }
    return null;
  }

  async function verify() {
    const current = get(state);
    if (current === 'verified' || current === 'loading') return;

    state.set('loading');
    errorText.set(null);
    payload.set(null);

    try {
      const res = await fetch(challengeurl, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load challenge');
      const data: Challenge = await res.json();

      const number = await solveChallenge(data.challenge, data.salt, data.maxNumber);
      if (number === null) throw new Error('Could not solve challenge');

      const payloadObj = {
        algorithm: data.algorithm,
        challenge: data.challenge,
        number,
        salt: data.salt,
        signature: data.signature
      };

      payload.set(JSON.stringify(payloadObj));
      state.set('verified');
    } catch (err) {
      state.set('error');
      errorText.set(err instanceof Error ? err.message : 'Verification failed');
      payload.set(null);
    }
  }

  function reset() {
    state.set('idle');
    errorText.set(null);
    payload.set(null);
  }

  return {
    altchaState: { subscribe: state.subscribe },
    errorText: { subscribe: errorText.subscribe },
    payload: { subscribe: payload.subscribe },
    verify,
    reset,
    getValue: () => get(payload)
  };
}

export type AltchaStore = ReturnType<typeof createAltchaStore>;
export { createAltchaStore };
