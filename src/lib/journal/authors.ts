/**
 * Journal author directory.
 * Post frontmatter `author` is a free-form display name; author pages use a
 * stable slug from this declarative map. Unknown names have no author page.
 */
import type { Locale } from '$types/content';

export interface JournalAuthor {
  slug: string;
  name: string;
  role: Record<Locale, string>;
  /** 'organization' emits Organization schema instead of Person. */
  kind: 'person' | 'organization';
}

export const JOURNAL_AUTHORS: JournalAuthor[] = [
  {
    slug: 'leandro-damasio',
    name: 'Leandro Damasio',
    role: {
      'pt-BR': 'Fundador e CEO, RBX Systems',
      en: 'Founder & CEO, RBX Systems'
    },
    kind: 'person'
  },
  {
    slug: 'caue-alencar',
    name: 'Cauê Souza Azevedo Alencar',
    role: {
      'pt-BR': 'CFO, RBX Systems',
      en: 'CFO, RBX Systems'
    },
    kind: 'person'
  },
  {
    slug: 'rbx-systems',
    name: 'RBX Systems',
    role: {
      'pt-BR': 'Engineering Team',
      en: 'Engineering Team'
    },
    kind: 'organization'
  }
];

function normalizeAuthorName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Map a frontmatter author name to its author-page slug (null if unknown). */
export function authorSlugFor(name: string): string | null {
  const normalized = normalizeAuthorName(name);
  if (normalized.includes('leandro damasio')) return 'leandro-damasio';
  if (normalized.includes('caue')) return 'caue-alencar';
  if (normalized.includes('rbx')) return 'rbx-systems';
  return null;
}

export function journalAuthorBySlug(slug: string): JournalAuthor | null {
  return JOURNAL_AUTHORS.find((author) => author.slug === slug) ?? null;
}
