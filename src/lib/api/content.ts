import matter from 'gray-matter';
import { marked } from 'marked';
import { getObject, listKeys } from './s3';
import type { Locale, PageContent, Post, PostMeta } from '$types/content';

const SITE_PREFIX = 'site/';
const BLOG_PREFIX = 'blog/posts/';
const S3_COVER_PREFIX = 'https://eu2.contabostorage.com/rbx-content/blog/covers/';

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'pt-BR' ? 'en' : 'pt-BR';
}

export async function loadPage(path: string, locale: Locale): Promise<PageContent | null> {
  const candidates = [
    `${SITE_PREFIX}${locale}/${path}/index.md`,
    `${SITE_PREFIX}${getAlternateLocale(locale)}/${path}/index.md`
  ];

  for (const key of candidates) {
    try {
      const raw = await getObject(key);
      const { data, content } = matter(raw);
      return {
        title: data.title ?? '',
        description: data.description ?? '',
        eyebrow: data.eyebrow,
        lead: data.lead,
        body: data.body,
        html: marked.parse(content) as string,
        meta: data
      };
    } catch {
      continue;
    }
  }

  return null;
}

function parsePostKey(key: string): { slug: string; locale: Locale } | null {
  const filename = key.replace(BLOG_PREFIX, '');
  const match = filename.match(/^(.+?)(?:\.(pt-BR|en))?\.md$/);
  if (!match) return null;
  return { slug: match[1], locale: (match[2] as Locale) ?? 'pt-BR' };
}

function selectBestKey(keys: string[], slug: string, locale: Locale): string | null {
  const exact = keys.find((k) => k === `${BLOG_PREFIX}${slug}.${locale}.md`);
  if (exact) return exact;
  const legacy = keys.find((k) => k === `${BLOG_PREFIX}${slug}.md`);
  if (legacy) return legacy;
  const alternate = keys.find(
    (k) => k === `${BLOG_PREFIX}${slug}.${getAlternateLocale(locale)}.md`
  );
  return alternate ?? null;
}

function normalizeCover(cover: string | undefined, slug: string): string | undefined {
  if (cover) {
    if (cover.startsWith(S3_COVER_PREFIX)) {
      const filename = cover.slice(S3_COVER_PREFIX.length);
      return `/api/blog/cover/${filename}`;
    }
    return cover;
  }
  return `/api/blog/cover/${slug}.jpg`;
}

async function parsePost(key: string, slug: string): Promise<Post> {
  const raw = await getObject(key);
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? '',
    author: data.author ?? 'RBX Systems',
    authorRole: data.authorRole,
    tags: data.tags ?? [],
    excerpt: data.excerpt ?? '',
    cover: normalizeCover(data.cover, slug),
    content,
    html: marked.parse(content) as string
  };
}

export async function loadAllPosts(locale: Locale): Promise<PostMeta[]> {
  let keys: string[] = [];
  try {
    keys = await listKeys(BLOG_PREFIX);
  } catch {
    return [];
  }
  const grouped = new Map<string, string[]>();

  for (const key of keys) {
    const parsed = parsePostKey(key);
    if (!parsed) continue;
    const list = grouped.get(parsed.slug) ?? [];
    list.push(key);
    grouped.set(parsed.slug, list);
  }

  const posts: Post[] = [];
  for (const [slug, groupKeys] of grouped) {
    const key = selectBestKey(groupKeys, slug, locale);
    if (!key) continue;
    posts.push(await parsePost(key, slug));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1)).map(({ content, html, ...meta }) => meta);
}

export async function loadPost(slug: string, locale: Locale): Promise<Post | null> {
  let keys: string[] = [];
  try {
    keys = await listKeys(BLOG_PREFIX);
  } catch {
    return null;
  }
  const groupKeys = keys.filter((k) => {
    const parsed = parsePostKey(k);
    return parsed?.slug === slug;
  });

  const key = selectBestKey(groupKeys, slug, locale);
  if (!key) return null;
  return parsePost(key, slug);
}

export function formatDate(iso: string, locale: Locale): string {
  const outputLocale = locale === 'en' ? 'en-US' : 'pt-BR';
  return new Date(iso).toLocaleDateString(outputLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
