export interface Solution {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  capabilities: string[];
}

export const solutions: Solution[] = [
  {
    id: "operational-systems",
    title: "Operational Systems Engineering",
    subtitle: "Systems designed to be operated",
    description:
      "We design and build software that functions as operational infrastructure: systems that must stay available, observable and evolvable under real production load.",
    capabilities: [
      "Architecture for long-term maintainability",
      "Observability, tracing and operational telemetry",
      "Failure-mode analysis and controlled degradation",
      "Release discipline and rollback readiness",
    ],
  },
  {
    id: "deterministic-ai",
    title: "Deterministic AI & Agents",
    subtitle: "Controlled automation, not black boxes",
    description:
      "We integrate models and agents into business workflows with guardrails, validation, auditability and human oversight. The goal is reliable automation, not novelty.",
    capabilities: [
      "LLM routing, evaluation and fallback design",
      "Agent orchestration with stop conditions",
      "Truth-grounding and canonical parameter control",
      "Responsible AI review and governance gates",
    ],
  },
  {
    id: "automation-integrations",
    title: "Automation & Integrations",
    subtitle: "Remove manual operation from critical paths",
    description:
      "We connect systems, APIs, data sources and devices into workflows that run consistently. Less manual coordination, more predictable execution.",
    capabilities: [
      "Workflow design and state-machine automation",
      "API and event-driven integrations",
      "Legacy system adapters and data sync",
      "Exception handling and operational alerting",
    ],
  },
  {
    id: "cloud-infrastructure",
    title: "Cloud Infrastructure & Platform Engineering",
    subtitle: "Declarative, reproducible environments",
    description:
      "We build cloud environments with infrastructure-as-code, GitOps, CI/CD pipelines and clear separation between platform and application concerns.",
    capabilities: [
      "Infrastructure as code and GitOps workflows",
      "Kubernetes platform design and operation",
      "CI/CD pipelines and artifact management",
      "Cost, security and access control discipline",
    ],
  },
  {
    id: "backend-apis",
    title: "Backend & API Engineering",
    subtitle: "Reliable foundations for products and integrations",
    description:
      "We design services, APIs and data layers for consistency, performance and safe evolution. Strong contracts, clear boundaries and testable behavior.",
    capabilities: [
      "Service and API architecture",
      "Data modeling and persistence strategy",
      "Schema evolution and contract testing",
      "Performance and reliability benchmarking",
    ],
  },
  {
    id: "maintenance-evolution",
    title: "Long-Term Maintenance & Evolution",
    subtitle: "Software that lasts beyond the first deploy",
    description:
      "We keep systems alive and improving: incident response, technical debt control, incremental modernization and operational documentation.",
    capabilities: [
      "Production support and incident response",
      "Regression control and change management",
      "Technical debt triage and modernization",
      "Runbooks and operational documentation",
    ],
  },
];

export const solutionsPageMeta = {
  title: "Solutions",
  subtitle: "Engineering capabilities for operations that require control.",
  body: "RBX designs, builds and operates systems where reliability, auditability and long-term maintainability are requirements, not afterthoughts.",
};
