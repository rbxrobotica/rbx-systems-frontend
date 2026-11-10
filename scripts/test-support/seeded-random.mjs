/**
 * Deterministic pseudo-random source (mulberry32) for property-style tests.
 * A failing run is reproduced by rerunning with the seed it reports.
 */
export function seededRandom(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** Integer in [0, bound). */
    int: (bound) => Math.floor(next() * bound),
    /** True with the given probability. */
    chance: (probability) => next() < probability,
    pick: (items) => items[Math.floor(next() * items.length)]
  };
}
