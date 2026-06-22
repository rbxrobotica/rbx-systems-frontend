export type ChangelogType = "added" | "changed" | "fixed" | "improved" | "deprecated" | "security";

export interface ChangelogEntry {
  date: string;
  product: string;
  type: ChangelogType;
  description: string;
  link?: {
    label: string;
    href: string;
  };
}

export const changelogTypes: Record<ChangelogType, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  improved: "Improved",
  deprecated: "Deprecated",
  security: "Security",
};

export const changelogProducts = [
  "Strategos",
  "Robson",
  "TruthMetal",
  "Thalamus",
  "Eden",
  "Argos Radar",
  "Infrastructure",
  "rbx.ia.br",
];

export const changelogEntries: ChangelogEntry[] = [
  {
    date: "2026-06-18",
    product: "rbx.ia.br",
    type: "changed",
    description:
      "Evolved site navigation and editorial structure: added Solutions, Journal, Changelog, Cases, Newsroom and Trust pages. Removed direct WhatsApp links in favor of a controlled contact drawer.",
  },
  {
    date: "2026-05-15",
    product: "rbx.ia.br",
    type: "added",
    description:
      "Contact system Phase 0 live on rbx.ia.br and rbxsystems.ch. Forms route through rbx-comms with Postmark and 360dialog integration.",
    link: {
      label: "Operator brief",
      href: "/journal/2026-05-15-ia-corporativa-como-infraestrutura",
    },
  },
  {
    date: "2026-05-15",
    product: "Infrastructure",
    type: "improved",
    description:
      "Published field notes on corporate AI as operational infrastructure and the discipline required to run it in production.",
    link: {
      label: "Journal post",
      href: "/journal/2026-05-15-ia-corporativa-como-infraestrutura",
    },
  },
  {
    date: "2026-04-22",
    product: "Robson",
    type: "added",
    description:
      "Robson executed its first real capital position using the live trading pipeline. Validation focused on execution reliability and risk controls.",
    link: {
      label: "Journal post",
      href: "/journal/2026-04-22-robson-first-real-capital",
    },
  },
  {
    date: "2026-04-16",
    product: "TruthMetal",
    type: "improved",
    description:
      "Testnet validation architecture documented: golden cases, eval suites and regression controls for agent behavior.",
    link: {
      label: "Journal post",
      href: "/journal/2026-04-16-testnet-validation-architecture",
    },
  },
  {
    date: "2026-04-05",
    product: "Robson",
    type: "improved",
    description:
      "Robson v2 integrated its missing execution glue: clearer separation between signal generation, risk check and broker execution.",
    link: {
      label: "Journal post",
      href: "/journal/2026-04-05-robson-v2-finds-its-missing-execution-glue",
    },
  },
  {
    date: "2026-04-04",
    product: "Thalamus",
    type: "added",
    description:
      "Published notes on the unit of control in agent systems: the prompt is not the interface, the decision boundary is.",
    link: {
      label: "Journal post",
      href: "/journal/2026-04-04-the-unit-is-not-the-prompt",
    },
  },
  {
    date: "2026-04-01",
    product: "TruthMetal",
    type: "added",
    description:
      "Launched TruthMetal, the canonical ground-truth control plane for shared parameters and decisions across agents.",
    link: {
      label: "Journal post",
      href: "/journal/2026-04-01-the-model-is-not-the-system",
    },
  },
  {
    date: "2026-03-29",
    product: "Infrastructure",
    type: "improved",
    description:
      "Infrastructure update: refined Kubernetes platform layout, GitOps boundaries and observability baseline across product namespaces.",
    link: {
      label: "Journal post",
      href: "/journal/2026-03-29-infrastructure-update",
    },
  },
  {
    date: "2026-03-25",
    product: "TruthMetal",
    type: "added",
    description:
      "Announced TruthMetal as RBX's ground-truth layer for evals, benchmarks and agent accountability.",
    link: {
      label: "Journal post",
      href: "/journal/2026-03-25-truthmetal-launch",
    },
  },
];

export const changelogPageMeta = {
  title: "Changelog",
  subtitle: "Objective record of product and infrastructure evolution.",
  body: "What we have built, changed and learned. Short, factual entries. Links to Journal posts when there is a longer story.",
};
