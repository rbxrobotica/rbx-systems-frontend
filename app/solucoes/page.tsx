"use client";

import { motion } from "framer-motion";
import Footer from "@/app/page/views/footer/footer";
import { solutions, Solution } from "@/app/data/solutions/solutionsData";
import { useI18n } from "@/lib/i18n/LocaleContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function SolucoesPage() {
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
            {dict.solutions.heading}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {dict.solutions.tagline}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {dict.solutions.body}
          </p>
        </motion.div>

        <motion.div
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {solutions.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </motion.div>
      </main>
      <Footer dict={dict} />
    </>
  );
}

function SolutionCard({ solution }: { solution: Solution }) {
  return (
    <motion.div
      variants={itemVariants}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div>
        <h2 className="text-lg font-semibold leading-tight">{solution.title}</h2>
        <p className="mt-1 text-xs font-medium text-primary">{solution.subtitle}</p>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {solution.description}
      </p>
      <ul className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        {solution.capabilities.map((capability) => (
          <li key={capability} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            {capability}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
