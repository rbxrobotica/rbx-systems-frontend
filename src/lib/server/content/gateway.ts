/**
 * Content Gateway — the stable content abstraction consumed by the UI.
 * Orchestrates the Object Storage store + in-memory cache. The UI never
 * touches the S3-compatible API.
 * (ADR-0002: RBX Sovereign Content Delivery Layer.)
 */
import { error } from '@sveltejs/kit';
import { load as parseYaml } from 'js-yaml';
import { marked } from 'marked';
import { decodeHTMLAttribute } from 'entities';
import { getTextObject, getByteObject, listObjectKeys, type ByteObject } from './store';
import { SwrCache, type OriginFailures } from './cache';
import { absorbedFailures, monitoredCache } from './cache-monitor';
import { trackLoad } from './request-budget';
import { LOCALE_PREFIX } from '$lib/i18n/locale';
import { siteHref } from '$lib/seo/alternates';
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

const POST_LOCALES: Locale[] = ['pt-BR', 'en'];

/** The posts of each language, as one reading of the lists gave them. */
type PostLists = Map<Locale, PostMeta[]>;

// A list that cannot be read is read as empty, so its failure would show
// nowhere: the locale is one of two, which bounds what this keeps.
const reportPostListFailure = absorbedFailures('post list unavailable, read as empty');

/**
 * Read the post list of each language once. A list that cannot be read is
 * empty in the result and reported in the log: one language being
 * unavailable must not take the other down, and whoever asked gets one
 * answer for the whole operation instead of a new attempt per question.
 */
async function loadPostLists(): Promise<PostLists> {
  const lists: PostLists = new Map();
  for (const locale of POST_LOCALES) {
    try {
      lists.set(locale, await loadAllPosts(locale));
    } catch (err) {
      reportPostListFailure(locale, err);
      lists.set(locale, []);
    }
  }
  return lists;
}

/** The post a slug identifies, in lists already read. */
function resolveInLists(
  requested: string,
  locale: Locale,
  lists: PostLists
): { canonicalSlug: string; publicSlug: string; alternates: PostAlternate[] } | null {
  // Match the active locale first so ambiguous slugs stay in its language.
  let canonicalSlug: string | null = null;
  for (const loc of [locale, ...POST_LOCALES.filter((l) => l !== locale)]) {
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
  for (const loc of POST_LOCALES) {
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

/**
 * The slug a post has in a language, from post lists that are already in
 * memory. It reads nothing from storage and waits for nothing: undefined
 * when either list is not cached, or when no post has the slug. For the
 * redirect path, which must answer whatever storage is doing.
 */
export function cachedPublicPostSlug(requested: string, locale: Locale): string | undefined {
  const lists: PostLists = new Map();
  for (const loc of POST_LOCALES) {
    const list = listCache.peek(`posts:${loc}`);
    if (!list) return undefined;
    lists.set(loc, list);
  }
  return resolveInLists(requested, locale, lists)?.publicSlug;
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
  return resolveInLists(requested, locale, await loadPostLists());
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

// HTML counts five characters as white space: tab, line feed, form feed,
// carriage return and space. The patterns below follow the tokenizer.
const ANCHOR_OPEN = /<a(?=[\t\n\f\r />])/gi;
// The parts of one attribute of a start tag, each read where the last ended:
// its name, the equals sign, and a value in double quotes, in single quotes
// or without quotes. A name ends at white space, a slash, `>` or `=`; a value
// without quotes ends at white space or `>`.
const ATTRIBUTE_NAME = /[\t\n\f\r /]*([^\t\n\f\r />][^\t\n\f\r />=]*)/y;
const ATTRIBUTE_EQUALS = /[\t\n\f\r ]*=[\t\n\f\r ]*/y;
const ATTRIBUTE_VALUE = /"([^"]*)"|'([^']*)'|([^\t\n\f\r "'>][^\t\n\f\r >]*)/y;

/** Read with a sticky pattern at a position; the match, or null with nothing consumed. */
function readAt(pattern: RegExp, html: string, at: number): RegExpExecArray | null {
  pattern.lastIndex = at;
  return pattern.exec(html);
}

/**
 * The address a browser reads from the value of an `href`. HTML decodes the
 * character references of the value (`&amp;`, `&#47;`). The URL parser then
 * drops, before it reads anything, the control characters and spaces around
 * the value and every tab and line break inside it.
 */
function addressOfAttribute(value: string): string {
  const decoded = decodeHTMLAttribute(value);
  let start = 0;
  let end = decoded.length;
  while (start < end && decoded.charCodeAt(start) <= 0x20) start += 1;
  while (end > start && decoded.charCodeAt(end - 1) <= 0x20) end -= 1;
  return decoded.slice(start, end).replace(/[\t\n\r]/g, '');
}

/**
 * Write an address as the value of an attribute, in its quotes, so that HTML
 * reads the same address back: the ampersand and the quote that would end the
 * value become character references.
 */
function quotedAttributeValue(address: string, quote: '"' | "'"): string {
  const escaped = address.replace(quote === '"' ? /[&"]/g : /[&']/g, (character) =>
    character === '&' ? '&amp;' : `&#${character.charCodeAt(0)};`
  );
  return `${quote}${escaped}${quote}`;
}

/**
 * Rewrite the `href` of every `<a>` in rendered content. The tags are read as
 * HTML writes them, whatever the case of the names and the quoting of the
 * value, because stored pages carry HTML an author wrote by hand. `rewrite`
 * is given the address a browser reads from the value. An address it changes
 * is written back escaped for its quotes, and in double quotes when the
 * author used none; one it returns unchanged keeps the bytes the author
 * wrote. A path quoted in a code sample is escaped in the rendered content
 * and is not a tag. One pass, and nothing is read twice.
 */
function rewriteAnchorHrefs(html: string, rewrite: (address: string) => string): string {
  let out = '';
  let copied = 0;
  ANCHOR_OPEN.lastIndex = 0;
  for (let open = ANCHOR_OPEN.exec(html); open; open = ANCHOR_OPEN.exec(html)) {
    let at = open.index + 2;
    for (;;) {
      const name = readAt(ATTRIBUTE_NAME, html, at);
      if (!name) break;
      at += name[0].length;
      const equals = readAt(ATTRIBUTE_EQUALS, html, at);
      if (!equals) continue;
      const value = readAt(ATTRIBUTE_VALUE, html, at + equals[0].length);
      if (!value) continue;
      at += equals[0].length + value[0].length;
      if (name[1].toLowerCase() !== 'href') continue;
      const address = addressOfAttribute(value[1] ?? value[2] ?? value[3]);
      const rewritten = rewrite(address);
      if (rewritten !== address) {
        // The whole value goes, with the quotes it had.
        const start = at - value[0].length;
        out +=
          html.slice(copied, start) +
          quotedAttributeValue(rewritten, value[2] === undefined ? '"' : "'");
        copied = at;
      }
      // A browser reads the first href of a tag and ignores a second.
      break;
    }
    ANCHOR_OPEN.lastIndex = at;
  }
  return out + html.slice(copied);
}

/** The language and the slug an href names, when it is the address of a post. */
function postOf(href: string): { locale: Locale; slug: string } | undefined {
  const post = /^\/(pt-br|en)\/blog\/([a-z0-9-]+)(?=$|[?#])/.exec(href);
  return post ? { locale: post[1] === 'en' ? 'en' : 'pt-BR', slug: post[2] } : undefined;
}

/**
 * Render stored Markdown for a language. A link to this site, in Markdown
 * (`[contato](/contato)`) or in the HTML that stored pages carry
 * (`<a href="/contato">`), is written as the address the server answers
 * directly: with the locale segment and the spelling of the language, an
 * earlier name of a page resolved (see `siteHref`), and a post by the slug it
 * has in that language. Any other address is left as written.
 *
 * Which slug a post has in a language comes from the post lists. They are
 * read once for the whole content, and only when it links to a post: nothing
 * when they are cached, and otherwise one listing and one object per post for
 * each of the two languages. A list that cannot be read leaves the links to
 * posts as written; the loader of the post still redirects them.
 */
async function renderMarkdown(content: string, locale: Locale): Promise<string> {
  const posts: { locale: Locale; slug: string }[] = [];
  const html = rewriteAnchorHrefs(marked.parse(content) as string, (href) => {
    const address = siteHref(locale, href);
    const post = postOf(address);
    if (post) posts.push(post);
    return address;
  });
  if (posts.length === 0) return html;

  const lists = await loadPostLists();
  return rewriteAnchorHrefs(html, (href) => {
    const post = postOf(href);
    const publicSlug = post && resolveInLists(post.slug, post.locale, lists)?.publicSlug;
    if (!post || !publicSlug || publicSlug === post.slug) return href;
    const prefix = `${LOCALE_PREFIX[post.locale]}/blog/`;
    return `${prefix}${publicSlug}${href.slice(prefix.length + post.slug.length)}`;
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
      html: await renderMarkdown(content, locale),
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
    // A listing shows no body, and completing the links of a body reads the
    // lists: rendering here would wait on the list being built.
    const post = await parsePost(key, slug, locale, false);
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
  return parsePost(key, slug, locale, true);
}

async function parsePost(
  key: string,
  slug: string,
  locale: Locale,
  renderBody: boolean
): Promise<Post | null> {
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
      html: renderBody ? await renderMarkdown(content, locale) : ''
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
