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
import { SwrCache } from './cache';
import type { Locale, PageContent, Post, PostMeta } from '$types/content';

const SITE_PREFIX = 'site/';
const BLOG_PREFIX = 'blog/posts/';
const S3_COVER_PREFIX = 'https://eu2.contabostorage.com/rbx-content/blog/covers/';

const ttlMs = (Number(process.env.CONTENT_CACHE_TTL_SECONDS) || 60) * 1000;

const pageCache = new SwrCache<PageContent>(ttlMs);
const postCache = new SwrCache<Post>(ttlMs);
const listCache = new SwrCache<PostMeta[]>(ttlMs);
// Assets are stable by filename; cache longer.
const assetCache = new SwrCache<ByteObject | null>(ttlMs * 10);

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
  return pageCache.get(`page:${locale}:${path}`, async () => {
    const page = await fetchPage(path, locale);
    if (!page) throw error(404, `Content not found: ${path}`);
    return page;
  });
}

export async function loadAllPosts(locale: Locale): Promise<PostMeta[]> {
  return listCache.get(`posts:${locale}`, () => fetchPostList(locale));
}

export async function loadPost(slug: string, locale: Locale): Promise<Post> {
  return postCache.get(`post:${locale}:${slug}`, async () => {
    const post = await fetchPost(slug, locale);
    if (!post) throw error(404, `Post not found: ${slug}`);
    return post;
  });
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
