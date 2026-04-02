import matter from "gray-matter";
import { listPostKeys, getPostContent } from "./s3";
import type { Locale } from "./i18n/getDictionary";

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
}

const POST_KEY_RE = /^(.+?)(?:\.(pt-BR|en))?\.mdx$/;

const S3_COVER_PREFIX = "https://eu2.contabostorage.com/rbx-content/blog/covers/";

type PostDescriptor = {
  key: string;
  slug: string;
  locale?: Locale;
};

function parsePostKey(key: string): PostDescriptor | null {
  const filename = key.replace("blog/posts/", "");
  const match = filename.match(POST_KEY_RE);
  if (!match) return null;

  const slug = match[1];
  const locale = match[2] as Locale | undefined;
  if (!slug) return null;

  return {
    key,
    slug,
    locale,
  };
}

function getAlternateLocale(locale: Locale): Locale {
  return locale === "pt-BR" ? "en" : "pt-BR";
}

function selectPostDescriptor(
  descriptors: PostDescriptor[],
  locale: Locale
): PostDescriptor | null {
  const exact = descriptors.find((descriptor) => descriptor.locale === locale);
  if (exact) return exact;

  const legacy = descriptors.find((descriptor) => !descriptor.locale);
  if (legacy) return legacy;

  const alternate = descriptors.find(
    (descriptor) => descriptor.locale === getAlternateLocale(locale)
  );
  return alternate ?? null;
}

function normalizeCover(cover: string | undefined): string | undefined {
  if (!cover) return undefined;
  // Rewrite direct S3 cover URLs to the internal proxy route.
  // Contabo does not allow unauthenticated public object access.
  if (cover.startsWith(S3_COVER_PREFIX)) {
    const filename = cover.slice(S3_COVER_PREFIX.length);
    return `/api/blog/cover/${filename}`;
  }
  return cover;
}

async function getPostByKey(key: string, slug: string): Promise<Post> {
  const raw = await getPostContent(key);
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    author: data.author ?? "RBX Systems",
    authorRole: data.authorRole,
    tags: data.tags ?? [],
    excerpt: data.excerpt ?? "",
    cover: normalizeCover(data.cover),
    content,
  };
}

export async function getAllPosts(locale: Locale): Promise<PostMeta[]> {
  const descriptors = (await listPostKeys())
    .map(parsePostKey)
    .filter((descriptor): descriptor is PostDescriptor => descriptor !== null);

  const grouped = descriptors.reduce<Map<string, PostDescriptor[]>>((acc, descriptor) => {
    const current = acc.get(descriptor.slug) ?? [];
    current.push(descriptor);
    acc.set(descriptor.slug, current);
    return acc;
  }, new Map());

  const selected = Array.from(grouped.entries())
    .map(([slug, group]) => {
      const descriptor = selectPostDescriptor(group, locale);
      return descriptor ? { slug, key: descriptor.key } : null;
    })
    .filter((item): item is { slug: string; key: string } => item !== null);

  const posts = await Promise.all(
    selected.map(async ({ key, slug }) => {
      const post = await getPostByKey(key, slug);
      return {
        slug,
        title: post.title,
        date: post.date,
        author: post.author,
        authorRole: post.authorRole,
        tags: post.tags,
        excerpt: post.excerpt,
        cover: post.cover,
      } satisfies PostMeta;
    })
  );

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string, locale: Locale): Promise<Post | null> {
  const candidates = [
    `blog/posts/${slug}.${locale}.mdx`,
    `blog/posts/${slug}.mdx`,
    `blog/posts/${slug}.${getAlternateLocale(locale)}.mdx`,
  ];

  for (const key of candidates) {
    try {
      return await getPostByKey(key, slug);
    } catch {
      continue;
    }
  }

  return null;
}

export function formatDate(iso: string, locale: Locale): string {
  const outputLocale = locale === "en" ? "en-US" : "pt-BR";

  return new Date(iso).toLocaleDateString(outputLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
