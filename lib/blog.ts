import matter from "gray-matter";
import { listPostKeys, getPostContent } from "./s3";

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

function keyToSlug(key: string): string {
  return key.replace("blog/posts/", "").replace(".mdx", "");
}

const S3_COVER_PREFIX = "https://eu2.contabostorage.com/rbx-content/blog/covers/";

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

export async function getAllPosts(): Promise<PostMeta[]> {
  const keys = await listPostKeys();

  const posts = await Promise.all(
    keys.map(async (key) => {
      const raw = await getPostContent(key);
      const { data } = matter(raw);
      const slug = keyToSlug(key);
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? "",
        author: data.author ?? "RBX Systems",
        authorRole: data.authorRole,
        tags: data.tags ?? [],
        excerpt: data.excerpt ?? "",
        cover: normalizeCover(data.cover),
      } satisfies PostMeta;
    })
  );

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const raw = await getPostContent(`blog/posts/${slug}.mdx`);
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
  } catch {
    return null;
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
