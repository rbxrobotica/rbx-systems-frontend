export type Phase = "seed" | "structuring" | "expansion" | "institutionalized";

export interface Product {
  name: string;
  type: "api" | "fullstack" | "web-static" | "agent" | "cli";
  phase: Phase;
  domains: string[];
  repo: string;
  description: string;
}

export const PHASE_LABEL: Record<Phase, string> = {
  seed: "Semente",
  structuring: "Estruturação",
  expansion: "Expansão",
  institutionalized: "Institucionalizado",
};

export const products: Product[] = [
  {
    name: "Robson",
    type: "fullstack",
    phase: "institutionalized",
    domains: ["robson.{domain}", "api.robson.{domain}"],
    repo: "https://github.com/ldamasio/robson",
    description:
      "Motor de inteligência direcional para trading algorítmico. Análise de mercado em tempo real, gestão de risco automatizada e execução de estratégias com IA.",
  },
  {
    name: "Strategos",
    type: "fullstack",
    phase: "structuring",
    domains: ["app.strategos.gr", "api.strategos.gr"],
    repo: "https://github.com/ldamasio/strategos",
    description:
      "Sistema operacional estratégico para coordenação cognitiva organizacional. Integra planejamento, execução e aprendizado contínuo em uma plataforma unificada.",
  },
  {
    name: "TruthMetal",
    type: "api",
    phase: "seed",
    domains: ["api.truthmetal.{domain}"],
    repo: "https://github.com/ldamasio/truthmetal",
    description:
      "Plano de controle de verdade canônica para sistemas de IA. Garante que parâmetros e decisões compartilhados entre agentes sejam auditáveis, versionados e imutáveis.",
  },
  {
    name: "Thalamus",
    type: "api",
    phase: "seed",
    domains: ["api.thalamus.{domain}"],
    repo: "https://github.com/ldamasio/thalamus",
    description:
      "Camada de roteamento e orquestração de dados analíticos. Hub central de sinais e eventos para os produtos RBX.",
  },
  {
    name: "Argos Radar",
    type: "fullstack",
    phase: "seed",
    domains: ["argos.{domain}", "api.argos.{domain}"],
    repo: "https://github.com/ldamasio/argos-radar",
    description:
      "Plataforma de vigilância e monitoramento de mercados. Detecta padrões, anomalias e sinais relevantes em múltiplos ativos e timeframes.",
  },
  {
    name: "Eden",
    type: "cli",
    phase: "seed",
    domains: [],
    repo: "https://github.com/ldamasio/eden",
    description:
      "Plataforma interna de desenvolvimento (IDP). CLI que automatiza o provisionamento de novos produtos na infraestrutura Kubernetes com GitOps.",
  },
];
