"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/app/page/views/footer/footer";
import { newsroomData } from "@/app/data/newsroom/newsroomData";
import { useI18n } from "@/lib/i18n/LocaleContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function NewsroomPage() {
  const { locale, dict } = useI18n();
  const data = newsroomData;

  return (
    <>
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 sm:pb-32 sm:pt-32 lg:px-12">
        <motion.div
          className="max-w-2xl pb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {dict.newsroom.heading}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {dict.newsroom.tagline}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {dict.newsroom.body}
          </p>
        </motion.div>

        <motion.div
          className="space-y-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <section>
            <h2 className="mb-5 text-xl font-semibold tracking-tight">
              {dict.newsroom.boilerplateTitle}
            </h2>
            <p className="rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-foreground">
              {locale === "pt-BR" ? data.boilerplate["pt-BR"] : data.boilerplate.en}
            </p>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold tracking-tight">
              {dict.newsroom.factsTitle}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {data.facts.map((fact) => (
                <motion.div
                  key={fact.label}
                  variants={itemVariants}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd
                    className={`mt-1 text-sm ${
                      fact.status === "placeholder"
                        ? "text-muted-foreground italic"
                        : "text-foreground"
                    }`}
                  >
                    {fact.value}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold tracking-tight">
              {dict.newsroom.contactTitle}
            </h2>
            <ul className="space-y-2">
              {data.mediaContact.map((contact) => (
                <li key={contact.label} className="text-sm text-foreground">
                  {contact.href ? (
                    <a
                      href={contact.href}
                      className="text-primary hover:underline"
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{contact.value}</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {contact.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold tracking-tight">
              {dict.newsroom.pressKitTitle}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.pressKit.map((item) => (
                <motion.div
                  key={item.label}
                  variants={itemVariants}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground">
                      {item.label}
                    </h3>
                    {item.status === "available" ? (
                      item.href ? (
                        <a
                          href={item.href}
                          className="text-xs text-primary hover:underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-emerald-400">Available</span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">On request</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold tracking-tight">
              {dict.newsroom.announcementsTitle}
            </h2>
            <ul className="space-y-4">
              {data.announcements.map((announcement) => (
                <li
                  key={announcement.title}
                  className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <time
                    dateTime={announcement.date}
                    className="shrink-0 text-xs font-medium text-muted-foreground"
                  >
                    {announcement.date}
                  </time>
                  {announcement.href ? (
                    <Link
                      href={announcement.href}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {announcement.title}
                    </Link>
                  ) : (
                    <span className="text-sm text-foreground">
                      {announcement.title}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </motion.div>
      </main>
      <Footer dict={dict} />
    </>
  );
}
