import { getAllPosts, formatDate, PostMeta } from "@/lib/blog";
import Link from "next/link";
import Image from "next/image";
import { NavigationMenuBar } from "../page/views/header/nav-bar-menu";
import Footer from "../page/views/footer/footer";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";

export const revalidate = 300;

export default async function BlogPage() {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;

  let posts: PostMeta[] = [];
  try {
    posts = await getAllPosts();
  } catch (err) {
    console.error("[blog] failed to load posts from S3:", err);
  }

  return (
    <>
      <NavigationMenuBar dict={dict} />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-3">{dict.blog.heading}</h1>
          <p className="text-muted-foreground text-lg">
            {dict.blog.tagline}
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">{dict.blog.empty}</p>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <article key={post.slug} className="py-10 group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-col md:flex-row gap-6">
                    {post.cover && (
                      <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <Image
                          src={post.cover}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <time dateTime={post.date}>{formatDate(post.date)}</time>
                        {post.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="border border-border rounded-full px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors mb-2">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {post.excerpt}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {post.author}
                        {post.authorRole && (
                          <span className="opacity-60"> — {post.authorRole}</span>
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
