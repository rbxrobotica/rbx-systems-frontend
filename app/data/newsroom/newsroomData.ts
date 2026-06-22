export interface NewsroomData {
  boilerplate: {
    en: string;
    "pt-BR": string;
  };
  facts: {
    label: string;
    value: string;
    status: "confirmed" | "placeholder";
  }[];
  mediaContact: {
    label: string;
    value: string;
    href?: string;
  }[];
  pressKit: {
    label: string;
    description: string;
    href?: string;
    status: "available" | "placeholder";
  }[];
  announcements: {
    date: string;
    title: string;
    href?: string;
  }[];
}

export const newsroomData: NewsroomData = {
  boilerplate: {
    en: "RBX Systems is an engineering company focused on automation, AI infrastructure and operational systems for environments that require control, reliability and long-term maintainability.",
    "pt-BR":
      "A RBX Systems é uma empresa de engenharia focada em automação, infraestrutura de IA e sistemas operacionais para ambientes que exigem controle, confiabilidade e manutenibilidade de longo prazo.",
  },
  facts: [
    {
      label: "Focus",
      value: "Engineering of operational systems, automation and AI infrastructure",
      status: "confirmed",
    },
    {
      label: "Products",
      value: "Robson, Strategos, TruthMetal, Thalamus, Eden, Argos Radar",
      status: "confirmed",
    },
    {
      label: "Model",
      value: "Product-led, engineering-led, open-source core",
      status: "confirmed",
    },
    {
      label: "Presence",
      value: "Remote-first · Zug, CH",
      status: "confirmed",
    },
    {
      label: "Founded",
      value: "TODO — editorial placeholder",
      status: "placeholder",
    },
    {
      label: "Legal entity",
      value: "TODO — editorial placeholder",
      status: "placeholder",
    },
  ],
  mediaContact: [
    {
      label: "Press inquiries",
      value: "contact@rbxsystems.ch",
      href: "mailto:contact@rbxsystems.ch",
    },
    {
      label: "Press kit",
      value: "Available on request",
    },
  ],
  pressKit: [
    {
      label: "Logos",
      description: "SVG and PNG variants of the RBX Systems mark.",
      status: "placeholder",
    },
    {
      label: "Boilerplate",
      description: "EN and PT-BR boilerplate for press use.",
      status: "available",
    },
    {
      label: "Founder bio",
      description: "Short biography of Leandro Damasio, CEO and CTO.",
      status: "placeholder",
    },
    {
      label: "Product fact sheet",
      description: "One-page summary of RBX products and phases.",
      status: "placeholder",
    },
  ],
  announcements: [
    {
      date: "2026-06-18",
      title: "RBX refreshes editorial architecture with Journal, Changelog, Cases, Newsroom and Trust pages.",
    },
    {
      date: "2026-03-25",
      title: "TruthMetal launched as the ground-truth control plane for RBX agent systems.",
      href: "/journal/2026-03-25-truthmetal-launch",
    },
  ],
};

export const newsroomPageMeta = {
  title: "Newsroom",
  subtitle: "Official information, press resources and company facts.",
  body: "This is the institutional source of truth for RBX Systems. For press inquiries, use the contact below.",
};
