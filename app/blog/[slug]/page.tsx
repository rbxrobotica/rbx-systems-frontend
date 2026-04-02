import { getPost, formatDate } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Footer from "../../page/views/footer/footer";
import remarkGfm from "remark-gfm";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;
  const post = await getPost(params.slug, locale);
  if (!post) notFound();

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:mb-10"
        >
          {dict.blog.backLabel}
        </Link>

        <header className="mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
            {post.tags.map((t) => (
              <span
                key={t}
                className="border border-border rounded-full px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          <p className="mb-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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

        {post.cover && (
          <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted sm:mb-12 md:h-96 md:aspect-auto">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <article className="blog-prose">
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </article>
      </main>
      <Footer dict={dict} />
    </>
  );
}
