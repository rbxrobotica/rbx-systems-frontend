export type Locale = 'pt-BR' | 'en';

export interface PageContent {
  title: string;
  description: string;
  eyebrow?: string;
  lead?: string;
  body?: string;
  html: string;
  meta?: Record<string, unknown>;
}

export interface PostMeta {
  slug: string;
  /**
   * Public URL slug for the active locale (`slugAlias` frontmatter).
   * Falls back to the canonical storage slug. Storage keys (S3 objects,
   * covers) always use the canonical slug.
   */
  publicSlug: string;
  title: string;
  date: string;
  author: string;
  authorRole?: string;
  tags: string[];
  excerpt: string;
  cover?: string;
}

export interface PostAlternate {
  locale: Locale;
  publicSlug: string;
}

export interface Post extends PostMeta {
  content: string;
  html: string;
}
