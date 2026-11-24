/**
 * Validate only explicitly supplied build inputs. No Git discovery, current
 * clock, process environment, filesystem or network fallback belongs here.
 *
 * @param {{ revision?: unknown, builtAt?: unknown }} [metadata]
 * @returns {{ revision: string | null, builtAt: string | null }}
 */
export function buildRelease(metadata = {}) {
  return {
    revision:
      typeof metadata.revision === 'string' &&
      metadata.revision.length === 40 &&
      /^[a-f0-9]{40}$/.test(metadata.revision)
        ? metadata.revision
        : null,
    builtAt: utcBuildTime(metadata.builtAt)
  };
}

/** @param {unknown} value @returns {string | null} */
function utcBuildTime(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(?:Z|\+00:00)$/.exec(value);
  if (!match || match[0] !== value) return null;

  // Date.parse accepts some impossible dates by rolling into the next month.
  // Compare the UTC round-trip so such values cannot become build evidence.
  const milliseconds = (match[2] ?? '').padEnd(3, '0').slice(0, 3);
  const expected = `${match[1]}.${milliseconds}Z`;
  const date = new Date(expected);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== expected) return null;
  return `${match[1]}${match[2] ? `.${match[2]}` : ''}Z`;
}
