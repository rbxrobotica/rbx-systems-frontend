"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/app/page/views/footer/footer";
import {
  changelogEntries,
  changelogTypes,
  ChangelogEntry,
} from "@/app/data/changelog/changelogData";
import { useI18n } from "@/lib/i18n/LocaleContext";

const typeStyle: Record<string, string> = {
  added: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  changed: "border-primary/40 bg-primary/10 text-primary",
  improved: "border-violet-400/40 bg-violet-400/10 text-violet-300",
  fixed: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  deprecated: "border-gray-400/40 bg-gray-400/10 text-gray-300",
  security: "border-red-400/40 bg-red-400/10 text-red-300",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ChangelogPage() {
  const { dict } = useI18n();

  const grouped = changelogEntries.reduce<Record<string, ChangelogEntry[]>>((acc, entry) => {
    const year = entry.date.slice(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

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
            {dict.changelog.heading}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {dict.changelog.tagline}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {dict.changelog.body}
          </p>
        </motion.div>

        <motion.div
          className="space-y-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {years.map((year) => (
            <section key={year}>
              <h2 className="mb-6 text-2xl font-bold tracking-tight">{year}</h2>
              <div className="space-y-6">
                {grouped[year].map((entry, index) => (
                  <ChangelogItem key={`${entry.date}-${index}`} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      </main>
      <Footer dict={dict} />
    </>
  );
}

function ChangelogItem({ entry }: { entry: ChangelogEntry }) {
  return (
    <motion.article
      variants={itemVariants}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 sm:flex-row sm:gap-6"
    >
      <div className="flex shrink-0 flex-col gap-1 sm:w-36">
        <time dateTime={entry.date} className="text-sm font-medium text-foreground">
          {entry.date}
        </time>
        <span className="text-xs text-muted-foreground">{entry.product}</span>
      </div>
      <div className="flex-1">
        <span
          className={`mb-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
            typeStyle[entry.type] ?? typeStyle.changed
          }`}
        >
          {changelogTypes[entry.type]}
        </span>
        <p className="text-sm leading-relaxed text-foreground">{entry.description}</p>
        {entry.link && (
          <Link
            href={entry.link.href}
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            {entry.link.label} →
          </Link>
        )}
      </div>
    </motion.article>
  );
}
