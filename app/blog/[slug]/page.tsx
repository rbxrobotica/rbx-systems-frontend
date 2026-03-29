import { getPost, getAllPosts, formatDate } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { NavigationMenuBar } from "../../page/views/header/nav-bar-menu";
import Footer from "../../page/views/footer/footer";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const posts = await getAllPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <>
      <NavigationMenuBar />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          ← Blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.tags.map((t) => (
              <span
                key={t}
                className="border border-border rounded-full px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>

          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
              {post.author[0]}
            </div>
            <div>
              <p className="font-medium">{post.author}</p>
              {post.authorRole && (
                <p className="text-muted-foreground text-xs">{post.authorRole}</p>
              )}
            </div>
          </div>
        </header>

        {/* Cover */}
        {post.cover && (
          <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden mb-12 bg-muted">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Body */}
        <article className="prose prose-neutral dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-pre:border-border">
          <MDXRemote source={post.content} />
        </article>
      </main>
      <Footer />
    </>
  );
}
