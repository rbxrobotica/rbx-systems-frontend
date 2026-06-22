export type CaseType = "public" | "field-note" | "internal";

export interface Case {
  id: string;
  type: CaseType;
  title: string;
  client?: string;
  industry?: string;
  description: string;
  outcomes?: string[];
  link?: {
    label: string;
    href: string;
  };
}

export const caseTypeLabels: Record<CaseType, string> = {
  public: "Public case",
  "field-note": "Field note",
  internal: "Internal system",
};

export const cases: Case[] = [
  {
    id: "rbx-platform",
    type: "internal",
    title: "RBX Product Platform",
    industry: "Engineering infrastructure",
    description:
      "Design and operation of the internal platform that supports Robson, Strategos, TruthMetal, Thalamus, Eden and Argos Radar. Kubernetes, GitOps, shared observability and cross-product identity.",
    outcomes: [
      "Declarative infrastructure per product namespace",
      "Shared identity and entitlement layer",
      "Centralized logging, metrics and alerting baseline",
      "Reproducible deployment pipeline from commit to production",
    ],
  },
  {
    id: "robson-trading",
    type: "internal",
    title: "Robson — Algorithmic Trading Engine",
    industry: "Financial operations",
    description:
      "An internal case on building a directional trading engine where execution reliability, risk controls and auditability matter more than headline returns.",
    outcomes: [
      "Real-time market data ingestion and signal generation",
      "Automated risk checks before order execution",
      "Trade journal and replay capability for post-hoc analysis",
      "First live capital execution under controlled exposure",
    ],
    link: {
      label: "Read the field note",
      href: "/journal/2026-04-22-robson-first-real-capital",
    },
  },
  {
    id: "truthmetal-groundtruth",
    type: "internal",
    title: "TruthMetal — Ground-Truth Control Plane",
    industry: "AI systems",
    description:
      "Internal case on the need for a canonical truth layer when multiple agents share parameters, decisions and eval criteria.",
    outcomes: [
      "Versioned golden cases and eval suites",
      "Shared parameter registry across agents",
      "Regression detection for agent behavior",
      "Audit trail of what changed and why",
    ],
    link: {
      label: "Read the launch post",
      href: "/journal/2026-03-25-truthmetal-launch",
    },
  },
  {
    id: "erp-integration",
    type: "field-note",
    title: "Deterministic AI attached to ERP data",
    industry: "Operations / Enterprise software",
    description:
      "A field note on integrating LLM-based assistants with ERP records without allowing hallucinated outputs to affect operational decisions. Client details omitted by request.",
    outcomes: [
      "Structured retrieval from ERP tables",
      "Decision boundaries restricted to validated fields",
      "Human confirmation gate for write operations",
      "Observability of every generated recommendation",
    ],
  },
  {
    id: "upcoming",
    type: "public",
    title: "Upcoming public case",
    client: "To be announced",
    industry: "—",
    description:
      "Placeholder for a future public case study. We only publish client work with explicit authorization and after review of what can be shared.",
  },
];

export const casesPageMeta = {
  title: "Cases",
  subtitle: "Proof of work, field notes and internal systems.",
  body: "We do not publish client names or sensitive details without authorization. What you see here is either public with consent, anonymized field learning, or work on our own infrastructure and products.",
};
