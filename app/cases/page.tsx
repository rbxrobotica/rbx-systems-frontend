"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/app/page/views/footer/footer";
import { cases, Case } from "@/app/data/cases/casesData";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { Dictionary } from "@/lib/i18n/types";

const typeStyle: Record<Case["type"], string> = {
  public: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  "field-note": "border-violet-400/40 bg-violet-400/10 text-violet-300",
  internal: "border-primary/40 bg-primary/10 text-primary",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function CasesPage() {
  const { dict } = useI18n();

  return (
    <>
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pb-32 sm:pt-32 lg:px-12">
        <motion.div
          className="max-w-2xl pb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {dict.cases.heading}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {dict.cases.tagline}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {dict.cases.body}
          </p>
        </motion.div>

        <motion.div
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {cases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} dict={dict} />
          ))}
        </motion.div>
      </main>
      <Footer dict={dict} />
    </>
  );
}

function CaseCard({ caseItem, dict }: { caseItem: Case; dict: Dictionary }) {
  const typeLabel =
    caseItem.type === "public"
      ? dict.cases.typePublic
      : caseItem.type === "field-note"
      ? dict.cases.typeFieldNote
      : dict.cases.typeInternal;

  return (
    <motion.div
      variants={itemVariants}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-tight">{caseItem.title}</h2>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
            typeStyle[caseItem.type]
          }`}
        >
          {typeLabel as string}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {caseItem.industry && <span>{caseItem.industry}</span>}
        {caseItem.client && <span>{caseItem.client}</span>}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {caseItem.description}
      </p>

      {caseItem.outcomes && caseItem.outcomes.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-border pt-4">
          {caseItem.outcomes.map((outcome) => (
            <li key={outcome} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {outcome}
            </li>
          ))}
        </ul>
      )}

      {caseItem.link && (
        <div className="mt-auto pt-4">
          <Link
            href={caseItem.link.href}
            className="text-sm font-medium text-primary hover:underline"
          >
            {caseItem.link.label} →
          </Link>
        </div>
      )}
    </motion.div>
  );
}
