/**
 * Content Gateway — the stable content abstraction consumed by the UI.
 * Orchestrates the Object Storage store + in-memory cache, applies locale
 * fallback and safe degradation. The UI never touches the S3-compatible API.
 * (ADR-0002: RBX Sovereign Content Delivery Layer.)
 */
import { load as parseYaml } from 'js-yaml';
import { marked } from 'marked';
import { getAlternateLocale } from '$api/content';
import { getTextObject, getByteObject, listObjectKeys, type ByteObject } from './store';
import { SwrCache } from './cache';
import type { Locale, PageContent, Post, PostMeta } from '$types/content';

const SITE_PREFIX = 'site/';
const BLOG_PREFIX = 'blog/posts/';
const S3_COVER_PREFIX = 'https://eu2.contabostorage.com/rbx-content/blog/covers/';

const ttlMs = (Number(process.env.CONTENT_CACHE_TTL_SECONDS) || 60) * 1000;
const staleMs = (Number(process.env.CONTENT_CACHE_STALE_SECONDS) || 300) * 1000;

const pageCache = new SwrCache<PageContent | null>(ttlMs, staleMs);
const postCache = new SwrCache<Post | null>(ttlMs, staleMs);
const listCache = new SwrCache<PostMeta[]>(ttlMs, staleMs);
// Assets are stable by filename; cache longer.
const assetCache = new SwrCache<ByteObject | null>(ttlMs * 10, staleMs * 10);

/**
 * Parse YAML frontmatter (gray-matter-compatible) using js-yaml 4 directly.
 * Replaces gray-matter, which pinned js-yaml 3.x (unfixable CVE). Our content
 * is simple trusted YAML from the CMS, so the slim parser is sufficient.
 */
function parseFrontmatter(raw: string): {
  data: Record<string, any>;
  content: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, content: raw };
  let data: Record<string, any> = {};
  try {
    const parsed = parseYaml(match[1]);
    if (parsed && typeof parsed === 'object') data = parsed as Record<string, any>;
  } catch {
    data = {};
  }
  return { data, content: match[2] };
}

export async function loadPage(path: string, locale: Locale): Promise<PageContent | null> {
  return pageCache.get(`page:${locale}:${path}`, () => fetchPage(path, locale));
}

export async function loadAllPosts(locale: Locale): Promise<PostMeta[]> {
  return listCache.get(`posts:${locale}`, () => fetchPostList(locale));
}

export async function loadPost(slug: string, locale: Locale): Promise<Post | null> {
  return postCache.get(`post:${locale}:${slug}`, () => fetchPost(slug, locale));
}

/** Resolve a binary asset (cover / UI asset) for the server-side proxy routes. */
export async function getAsset(
  prefix: string,
  path: string
): Promise<{ bytes: Uint8Array; contentType?: string } | null> {
  if (!isSafeAssetPath(path)) return null;
  const key = `${prefix}${path}`;
  return assetCache.get(`asset:${key}`, async () => {
    try {
      return await getByteObject(key);
    } catch {
      return null;
    }
  });
}

// --- fetchers (talk to the store; never throw to the UI) ---

async function fetchPage(path: string, locale: Locale): Promise<PageContent | null> {
  const candidates = [
    `${SITE_PREFIX}${locale}/${path}/index.md`,
    `${SITE_PREFIX}${getAlternateLocale(locale)}/${path}/index.md`
  ];
  for (const key of candidates) {
    try {
      const obj = await getTextObject(key);
      if (!obj) continue;
      const { data, content } = parseFrontmatter(obj.body);
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

async function fetchPostList(locale: Locale): Promise<PostMeta[]> {
  let keys: string[] = [];
  try {
    keys = await listObjectKeys(BLOG_PREFIX);
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
    const post = await parsePost(key, slug);
    if (post) posts.push(post);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1)).map(({ content, html, ...meta }) => meta);
}

async function fetchPost(slug: string, locale: Locale): Promise<Post | null> {
  let keys: string[] = [];
  try {
    keys = await listObjectKeys(BLOG_PREFIX);
  } catch {
    return null;
  }
  const groupKeys = keys.filter((k) => parsePostKey(k)?.slug === slug);
  const key = selectBestKey(groupKeys, slug, locale);
  if (!key) return null;
  return parsePost(key, slug);
}

async function parsePost(key: string, slug: string): Promise<Post | null> {
  try {
    const obj = await getTextObject(key);
    if (!obj) return null;
    const { data, content } = parseFrontmatter(obj.body);
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
  } catch {
    return null;
  }
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
  const alternate = keys.find((k) => k === `${BLOG_PREFIX}${slug}.${getAlternateLocale(locale)}.md`);
  return alternate ?? null;
}

function normalizeCover(cover: string | undefined, slug: string): string | undefined {
  if (cover) {
    if (cover.startsWith(S3_COVER_PREFIX)) {
      return `/api/blog/cover/${cover.slice(S3_COVER_PREFIX.length)}`;
    }
    return cover;
  }
  return `/api/blog/cover/${slug}.jpg`;
}

function isSafeAssetPath(path: string): boolean {
  // Reject absolute paths and traversal segments.
  return path.length > 0 && !path.startsWith('/') && !path.split('/').some((seg) => seg === '..');
}
