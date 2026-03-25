import matter from "gray-matter";
import { listPostKeys, getPostContent, coverUrl } from "./s3";

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
        cover: data.cover ?? coverUrl(slug),
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
      cover: data.cover ?? coverUrl(slug),
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
