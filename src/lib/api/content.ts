/**
 * Client-safe content utilities. Server-only concerns (Object Storage access,
 * caching, frontmatter parsing) live in `$lib/server/content` — see ADR-0002.
 */
import type { Locale } from '$types/content';

export function formatDate(iso: string, locale: Locale): string {
  const outputLocale = locale === 'en' ? 'en-US' : 'pt-BR';
  // Date-only ISO strings parse as UTC midnight; without an explicit UTC
  // render, any timezone west of UTC (e.g. pt-BR clients) shows the previous
  // calendar day.
  return new Date(iso).toLocaleDateString(outputLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}
