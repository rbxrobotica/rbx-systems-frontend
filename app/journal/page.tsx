import { getAllPosts, formatDate, PostMeta } from "@/lib/blog";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/app/page/views/footer/footer";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;

  let posts: PostMeta[] = [];
  try {
    posts = await getAllPosts(locale);
  } catch (err) {
    console.error("[journal] failed to load posts from S3:", err);
  }

  return (
    <>
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <div className="mb-6">
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {dict.journal.heading}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {dict.journal.tagline}
          </p>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {dict.journal.body}
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">{dict.journal.empty}</p>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <article key={post.slug} className="group py-8 sm:py-10">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-col gap-5 sm:gap-6 md:flex-row">
                    {post.cover && (
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted md:h-32 md:w-48 md:aspect-auto md:shrink-0">
                        <Image
                          src={post.cover}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                        {post.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="border border-border rounded-full px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <h2 className="mb-2 text-xl font-semibold tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
                        {post.title}
                      </h2>
                      <p className="line-clamp-3 text-sm text-muted-foreground sm:line-clamp-2">
                        {post.excerpt}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {post.author}
                        {post.authorRole && (
                          <span className="opacity-60"> | {post.authorRole}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer dict={dict} />
    </>
  );
}
