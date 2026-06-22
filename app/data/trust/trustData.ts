export interface TrustSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  items: string[];
  link?: {
    label: string;
    href: string;
  };
}

export const trustSections: TrustSection[] = [
  {
    id: "security",
    title: "Security posture",
    subtitle: "Designed for control",
    description:
      "Our systems are built with least-privilege access, secret management, encrypted communication and auditability by default. We do not claim certifications we do not hold.",
    items: [
      "Least-privilege access and RBAC in all environments",
      "Secrets managed outside application code",
      "Encrypted communication between services",
      "Security contact for responsible disclosure",
    ],
    link: {
      label: "Report a security concern",
      href: "mailto:contact@rbxsystems.ch",
    },
  },
  {
    id: "governance",
    title: "Governance",
    subtitle: "Decisions with traceability",
    description:
      "Architecture decisions, ownership and standards are recorded and versioned. Governance is not a separate function; it is how we build.",
    items: [
      "Architecture Decision Records (ADRs) for significant choices",
      "Clear ownership boundaries between products and platforms",
      "Change management and rollback discipline",
      "Peer review for code, infrastructure and documentation",
    ],
  },
  {
    id: "responsible-ai",
    title: "Responsible AI",
    subtitle: "Automated, but governed",
    description:
      "We treat AI as infrastructure that must be observable, testable and overrideable. Models are tools; decisions remain accountable.",
    items: [
      "Human oversight and stop conditions for agent actions",
      "Eval suites and regression tests for model behavior",
      "Truth-grounding through canonical parameter control",
      "Clear fallback paths when models fail or drift",
    ],
  },
  {
    id: "observability",
    title: "Observability",
    subtitle: "Systems that can be understood",
    description:
      "If it cannot be observed, it cannot be operated. We instrument for metrics, logs, traces and structured events from the start.",
    items: [
      "Structured logging and centralized log retention",
      "Metrics and alerting for critical paths",
      "Distributed tracing across services",
      "Health checks and synthetic monitoring",
    ],
  },
  {
    id: "open-source",
    title: "Open source",
    subtitle: "Public by default",
    description:
      "RBX products are developed in public repositories. Issues, discussions and contributions are welcome where appropriate.",
    items: [
      "Core products available on GitHub",
      "Public ADRs and technical documentation",
      "Issue-driven roadmap and feedback",
      "Clear license and contribution guidelines",
    ],
    link: {
      label: "github.com/rbxrobotica",
      href: "https://github.com/rbxrobotica",
    },
  },
  {
    id: "reliability",
    title: "Reliability",
    subtitle: "Built to fail safely",
    description:
      "We design for failure modes, degraded operation and recovery. Uptime is a function of discipline, not optimism.",
    items: [
      "Failure-mode analysis for critical components",
      "Controlled degradation instead of total failure",
      "Automated backups and tested recovery paths",
      "Release gates and rollback capability",
    ],
  },
];

export const trustPageMeta = {
  title: "Trust",
  subtitle: "How RBX builds, operates and governs its systems.",
  body: "This page describes our working principles. It is not a certificate wall. Where we are still maturing, we say so.",
};
