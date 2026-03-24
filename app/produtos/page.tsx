"use client";

import { motion } from "framer-motion";
import { NavigationMenuBar } from "@/app/page/views/header/nav-bar-menu";
import Footer from "@/app/page/views/footer/footer";
import {
  products,
  PHASE_LABEL,
  type Product,
  type Phase,
} from "@/app/data/products/productsData";

const PHASE_ORDER: Phase[] = [
  "institutionalized",
  "structuring",
  "expansion",
  "seed",
];

const PHASE_STYLE: Record<Phase, string> = {
  institutionalized:
    "border-amber-400/40 bg-amber-400/10 text-amber-300",
  structuring:
    "border-primary/40 bg-primary/10 text-primary",
  expansion:
    "border-violet-400/40 bg-violet-400/10 text-violet-300",
  seed:
    "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const TYPE_LABEL: Record<Product["type"], string> = {
  api: "API",
  fullstack: "Fullstack",
  "web-static": "Web",
  agent: "Agente",
  cli: "CLI",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function ProdutosPage() {
  const grouped = PHASE_ORDER.reduce<Record<Phase, Product[]>>(
    (acc, phase) => {
      acc[phase] = products.filter((p) => p.phase === phase);
      return acc;
    },
    { institutionalized: [], structuring: [], expansion: [], seed: [] }
  );

  return (
    <>
      <div className="main-container w-full px-4 md:px-12 py-6">
        <NavigationMenuBar />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-12 pb-24">
        {/* Hero */}
        <motion.div
          className="pt-16 pb-14 max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Open source · Made in Brazil
          </span>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-5">
            Produtos{" "}
            <span className="text-primary">RBX</span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed">
            Todos os produtos são open source, implantados em infraestrutura própria
            via ArgoCD e Kubernetes. O ciclo de vida segue quatro fases:{" "}
            <span className="text-foreground font-medium">Semente, Estruturação, Expansão e Institucionalizado</span>.
          </p>
        </motion.div>

        {/* Phase legend */}
        <motion.div
          className="flex flex-wrap gap-2 mb-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {PHASE_ORDER.map((phase) => (
            <span
              key={phase}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${PHASE_STYLE[phase]}`}
            >
              {PHASE_LABEL[phase]}
            </span>
          ))}
        </motion.div>

        {/* Sections by phase */}
        <div className="space-y-16">
          {PHASE_ORDER.filter((phase) => grouped[phase].length > 0).map(
            (phase) => (
              <section key={phase}>
                <div className="flex items-center gap-4 mb-7">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${PHASE_STYLE[phase]}`}
                  >
                    {PHASE_LABEL[phase]}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <motion.div
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                >
                  {grouped[phase].map((product) => (
                    <ProductCard key={product.name} product={product} />
                  ))}
                </motion.div>
              </section>
            )
          )}
        </div>

        {/* CTA */}
        <motion.div
          className="mt-20 rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-3">Contribua</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Todos os repositórios são públicos. Issues, PRs e discussões são bem-vindos.
          </p>
          <a
            href="https://github.com/rbxrobotica"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <GitHubIcon className="h-4 w-4" />
            github.com/rbxrobotica
          </a>
        </motion.div>
      </div>

      <Footer />
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      variants={itemVariants}
      className="group rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/30 hover:bg-primary/[0.03] transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
        <span className="shrink-0 font-mono text-[10px] tracking-wider text-muted-foreground bg-muted rounded px-1.5 py-0.5">
          {TYPE_LABEL[product.type]}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {product.description}
      </p>

      {/* Domains */}
      {product.domains.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.domains.map((domain) => (
            <a
              key={domain}
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-muted-foreground bg-muted hover:text-primary hover:bg-primary/10 rounded px-2 py-0.5 transition-colors"
            >
              {domain}
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PHASE_STYLE[product.phase]}`}
        >
          {PHASE_LABEL[product.phase]}
        </span>
        <a
          href={product.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <GitHubIcon className="h-3.5 w-3.5" />
          open source
        </a>
      </div>
    </motion.div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-4 w-4"} fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
