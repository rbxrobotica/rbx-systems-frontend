/**
 * Content Gateway — the stable content abstraction consumed by the UI.
 * Orchestrates the Object Storage store + in-memory cache. The UI never
 * touches the S3-compatible API.
 * (ADR-0002: RBX Sovereign Content Delivery Layer.)
 */
import { error } from '@sveltejs/kit';
import { load as parseYaml } from 'js-yaml';
import { marked } from 'marked';
import { getTextObject, getByteObject, listObjectKeys, type ByteObject } from './store';
import { SwrCache, type OriginFailures } from './cache';
import { monitoredCache } from './cache-monitor';
import { trackLoad } from './request-budget';
import type { Locale, PageContent, Post, PostAlternate, PostMeta } from '$types/content';

const SITE_PREFIX = 'site/';
const BLOG_PREFIX = 'blog/posts/';
const S3_COVER_PREFIX = 'https://eu2.contabostorage.com/rbx-content/blog/covers/';

const ttlMs = (Number(process.env.CONTENT_CACHE_TTL_SECONDS) || 60) * 1000;

// The caches load from one bucket, so they share its failure count: a storage
// failure seen through any of them holds evictions in all of them.
const storage: OriginFailures = { count: 0 };

// A loader rejects with the gateway's own 404 when the bucket answered that
// the key does not exist. Any other rejection is a storage failure.
const isNotFound = (err: unknown) => (err as { status?: number } | null)?.status === 404;

function contentCache<T>(name: string, maxEntries: number, ttl = ttlMs): SwrCache<T> {
  return new SwrCache<T>(ttl, {
    ...monitoredCache(name, maxEntries),
    origin: storage,
    isOriginFailure: (err) => !isNotFound(err)
  });
}

// Entry bounds (guardrail 1.3) sit several times above what is published
// today, so only a runaway key space reaches them. Sizing and outage behavior:
// docs/implementation/content-gateway-cache.md.
const pageCache = contentCache<PageContent>('page', 256);
const postCache = contentCache<Post>('post', 1024);
const listCache = contentCache<PostMeta[]>('list', 8);
// Assets are stable by filename; cache longer. `null` records a key that the
// bucket answered as not found.
const assetCache = contentCache<ByteObject | null>('asset', 256, ttlMs * 10);

/**
 * Parse YAML frontmatter (gray-matter-compatible) using js-yaml 4 directly.
 * Replaces gray-matter, which pinned js-yaml 3.x (unfixable CVE). Our content
 * is simple trusted YAML from the CMS, so the slim parser is sufficient.
 */
function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, content: raw };
  let data: Record<string, unknown> = {};
  try {
    const parsed = parseYaml(match[1]);
    if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>;
  } catch {
    data = {};
  }
  return { data, content: match[2] };
}

export async function loadPage(path: string, locale: Locale): Promise<PageContent> {
  return cached(pageCache, `page:${locale}:${path}`, async () => {
    const page = await fetchPage(path, locale);
    if (!page) throw error(404, `Content not found: ${path}`);
    return page;
  });
}

/**
 * Like loadPage, but resolves to null when the CMS object does not exist,
 * letting routes with i18n fallback copy render instead of 404ing. Any
 * failure other than the gateway's own 404 still propagates.
 */
export async function loadPageOrNull(path: string, locale: Locale): Promise<PageContent | null> {
  try {
    return await loadPage(path, locale);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function loadAllPosts(locale: Locale): Promise<PostMeta[]> {
  return cached(listCache, `posts:${locale}`, () => fetchPostList(locale));
}

export async function loadPost(slug: string, locale: Locale): Promise<Post> {
  return cached(postCache, `post:${locale}:${slug}`, async () => {
    const post = await fetchPost(slug, locale);
    if (!post) throw error(404, `Post not found: ${slug}`);
    return post;
  });
}

/**
 * Resolve a requested URL slug (canonical or per-locale alias, in any locale)
 * to the post it identifies. Returns the canonical storage slug, the public
 * slug for the active locale, and the hreflang alternates across locales.
 * Returns null when no post matches.
 */
export async function resolvePostSlug(
  requested: string,
  locale: Locale
): Promise<{ canonicalSlug: string; publicSlug: string; alternates: PostAlternate[] } | null> {
  const locales: Locale[] = ['pt-BR', 'en'];
  const lists = new Map<Locale, PostMeta[]>();
  for (const loc of locales) {
    try {
      lists.set(loc, await loadAllPosts(loc));
    } catch {
      // One locale's list being unavailable must not take the other down.
      lists.set(loc, []);
    }
  }

  // Match the active locale first so ambiguous slugs stay on the host's locale.
  let canonicalSlug: string | null = null;
  for (const loc of [locale, ...locales.filter((l) => l !== locale)]) {
    const match = lists
      .get(loc)
      ?.find((post) => post.slug === requested || post.publicSlug === requested);
    if (match) {
      canonicalSlug = match.slug;
      break;
    }
  }
  if (!canonicalSlug) return null;

  const alternates: PostAlternate[] = [];
  for (const loc of locales) {
    const meta = lists.get(loc)?.find((post) => post.slug === canonicalSlug);
    if (meta) alternates.push({ locale: loc, publicSlug: meta.publicSlug });
  }

  const active = alternates.find((alt) => alt.locale === locale);
  return {
    canonicalSlug,
    publicSlug: active?.publicSlug ?? canonicalSlug,
    alternates
  };
}

/** Resolve a binary asset (cover / UI asset) for the server-side proxy routes. */
export async function getAsset(
  prefix: string,
  path: string
): Promise<{ bytes: Uint8Array; contentType?: string } | null> {
  if (!isSafeAssetPath(path)) return null;
  const key = `${prefix}${path}`;
  try {
    // A storage failure must reach the cache as a failure: that is what keeps
    // a cached asset in place and makes the failed revalidation visible.
    return await cached(assetCache, `asset:${key}`, () => getByteObject(key));
  } catch {
    // Storage failed and nothing is cached for this key. Answer "not found"
    // without caching it: a cached failure would occupy an entry, and during
    // an outage a flood of them would evict assets that can still be served.
    return null;
  }
}

/**
 * Cache lookup whose loader, when the cache runs it, is charged to the storage
 * request budget of the operation that triggered it.
 */
function cached<T>(cache: SwrCache<T>, key: string, load: () => Promise<T>): Promise<T> {
  return cache.get(key, () => trackLoad(key, load));
}

// --- fetchers (talk to the store; never throw to the UI) ---

async function fetchPage(path: string, locale: Locale): Promise<PageContent | null> {
  const key = `${SITE_PREFIX}${locale}/${path}/index.md`;
  try {
    const obj = await getTextObject(key);
    if (!obj) return null;
    const { data, content } = parseFrontmatter(obj.body);
    return {
      title: (data.title as string) ?? '',
      description: (data.description as string) ?? '',
      eyebrow: data.eyebrow as string | undefined,
      lead: data.lead as string | undefined,
      body: data.body as string | undefined,
      html: marked.parse(content) as string,
      meta: data
    };
  } catch {
    throw error(503, `Content unavailable: ${path}`);
  }
}

async function fetchPostList(locale: Locale): Promise<PostMeta[]> {
  let keys: string[] = [];
  try {
    keys = await listObjectKeys(BLOG_PREFIX);
  } catch {
    throw error(503, 'Blog content unavailable');
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
    throw error(503, 'Blog content unavailable');
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
      publicSlug: sanitizeSlugAlias(data.slugAlias) ?? slug,
      title: (data.title as string) ?? slug,
      date: (data.date as string) ?? '',
      author: (data.author as string) ?? 'RBX Systems',
      authorRole: data.authorRole as string | undefined,
      tags: (data.tags as string[]) ?? [],
      excerpt: (data.excerpt as string) ?? '',
      cover: normalizeCover(data.cover as string | undefined, slug),
      content,
      html: marked.parse(content) as string
    };
  } catch {
    throw error(503, 'Blog content unavailable');
  }
}

/**
 * A slug alias is operator-authored frontmatter, but it becomes part of a URL:
 * accept only lowercase slug shape so a typo cannot produce a broken or
 * unsafe path segment.
 */
function sanitizeSlugAlias(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line security/detect-unsafe-regex -- linear: every repetition starts with "-", which the class cannot match
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;
}

function parsePostKey(key: string): { slug: string; locale: Locale } | null {
  const filename = key.replace(BLOG_PREFIX, '');
  const match = filename.match(/^(.+?)(?:\.(pt-BR|en))?\.md$/);
  if (!match) return null;
  return { slug: match[1], locale: (match[2] as Locale) ?? 'pt-BR' };
}

function selectBestKey(keys: string[], slug: string, locale: Locale): string | null {
  const exact = keys.find((k) => k === `${BLOG_PREFIX}${slug}.${locale}.md`);
  return exact ?? null;
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
