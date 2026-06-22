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
  title: string;
  date: string;
  author: string;
  authorRole?: string;
  tags: string[];
  excerpt: string;
  cover?: string;
}

export interface Post extends PostMeta {
  content: string;
  html: string;
}
