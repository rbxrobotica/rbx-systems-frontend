/* eslint-disable @typescript-eslint/no-require-imports */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: process.env.CONTABO_S3_ENDPOINT,
  region: 'default',
  credentials: {
    accessKeyId: process.env.CONTABO_S3_ACCESS_KEY,
    secretAccessKey: process.env.CONTABO_S3_SECRET_KEY
  },
  forcePathStyle: true
});

const BUCKET = 'rbx-content';

function put(key, body) {
  return s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: 'text/markdown' })
  );
}

const pages = [];

function addPage(path, pt, en) {
  pages.push({ key: `site/pt-BR/${path}/index.md`, body: pt });
  pages.push({ key: `site/en/${path}/index.md`, body: en });
}

// Home
addPage(
  'home',
  `---
title: Engenharia de sistemas para operações que exigem controle
description: Engenharia de sistemas, automação operacional, IA aplicada e infraestrutura em nuvem para operações de alta exigência.
eyebrow: RBX Systems
lead: Projetamos plataformas, automações e infraestrutura para empresas que operam com alta exigência. Backend, cloud, agentes inteligentes e integrações construídos para confiabilidade e escala previsível.
---
`,
  `---
title: Systems engineering for operations that demand control
description: Systems engineering, operational automation, applied AI and cloud infrastructure for high-demand operations.
eyebrow: RBX Systems
lead: We design platforms, automations and infrastructure for companies operating with high demands. Backend, cloud, intelligent agents and integrations built for reliability and predictable scale.
---
`
);

// Solutions
addPage(
  'solutions',
  `---
title: Soluções
description: Capacidades de engenharia para operações que exigem controle.
eyebrow: Engineering
lead: Capacidades de engenharia para operações que exigem controle.
---

A RBX projeta, constrói e opera sistemas onde confiabilidade, auditabilidade e manutenibilidade de longo prazo são requisitos, não detalhes.

## Operational Systems Engineering

Systems designed to be operated.

- Architecture for long-term maintainability
- Observability, tracing and operational telemetry
- Failure-mode analysis and controlled degradation
- Release discipline and rollback readiness

## Deterministic AI & Agents

Controlled automation, not black boxes.

- LLM routing, evaluation and fallback design
- Agent orchestration with stop conditions
- Truth-grounding and canonical parameter control
- Responsible AI review and governance gates

## Automation & Integrations

Remove manual operation from critical paths.

- Workflow design and state-machine automation
- API and event-driven integrations
- Legacy system adapters and data sync
- Exception handling and operational alerting

## Cloud Infrastructure & Platform Engineering

Declarative, reproducible environments.

- Infrastructure as code and GitOps workflows
- Kubernetes platform design and operation
- CI/CD pipelines and artifact management
- Cost, security and access control discipline

## Backend & API Engineering

Reliable foundations for products and integrations.

- Service and API architecture
- Data modeling and persistence strategy
- Schema evolution and contract testing
- Performance and reliability benchmarking

## Long-Term Maintenance & Evolution

Software that lasts beyond the first deploy.

- Production support and incident response
- Regression control and change management
- Technical debt triage and modernization
- Runbooks and operational documentation
`,
  `---
title: Solutions
description: Engineering capabilities for operations that demand control.
eyebrow: Engineering
lead: Engineering capabilities for operations that demand control.
---

RBX designs, builds and operates systems where reliability, auditability and long-term maintainability are requirements, not afterthoughts.

## Operational Systems Engineering

Systems designed to be operated.

- Architecture for long-term maintainability
- Observability, tracing and operational telemetry
- Failure-mode analysis and controlled degradation
- Release discipline and rollback readiness

## Deterministic AI & Agents

Controlled automation, not black boxes.

- LLM routing, evaluation and fallback design
- Agent orchestration with stop conditions
- Truth-grounding and canonical parameter control
- Responsible AI review and governance gates

## Automation & Integrations

Remove manual operation from critical paths.

- Workflow design and state-machine automation
- API and event-driven integrations
- Legacy system adapters and data sync
- Exception handling and operational alerting

## Cloud Infrastructure & Platform Engineering

Declarative, reproducible environments.

- Infrastructure as code and GitOps workflows
- Kubernetes platform design and operation
- CI/CD pipelines and artifact management
- Cost, security and access control discipline

## Backend & API Engineering

Reliable foundations for products and integrations.

- Service and API architecture
- Data modeling and persistence strategy
- Schema evolution and contract testing
- Performance and reliability benchmarking

## Long-Term Maintenance & Evolution

Software that lasts beyond the first deploy.

- Production support and incident response
- Regression control and change management
- Technical debt triage and modernization
- Runbooks and operational documentation
`
);

// Cases
addPage(
  'cases',
  `---
title: Cases
description: Prova de trabalho, field notes e sistemas internos.
eyebrow: Work
lead: Prova de trabalho, field notes e sistemas internos.
---

Não publicamos nomes de clientes ou detalhes sensíveis sem autorização. O que aparece aqui é público com consentimento, aprendizado de campo anonimizado ou trabalho em nossa própria infraestrutura e produtos.

## RBX Product Platform

**Tipo:** Sistema interno  
**Indústria:** Engineering infrastructure

Design e operação da plataforma interna que suporta Robson, Strategos, TruthMetal, Thalamus, Eden e Argos Radar. Kubernetes, GitOps, observabilidade compartilhada e identidade cross-product.

- Declarative infrastructure per product namespace
- Shared identity and entitlement layer
- Centralized logging, metrics and alerting baseline
- Reproducible deployment pipeline from commit to production

## Robson — Algorithmic Trading Engine

**Tipo:** Sistema interno  
**Indústria:** Financial operations

Case interno sobre a construção de um motor de trading direcional onde confiabilidade de execução, controles de risco e auditabilidade importam mais do que retornos em destaque.

- Real-time market data ingestion and signal generation
- Automated risk checks before order execution
- Trade journal and replay capability for post-hoc analysis
- First live capital execution under controlled exposure

## TruthMetal — Ground-Truth Control Plane

**Tipo:** Sistema interno  
**Indústria:** AI systems

Case interno sobre a necessidade de uma camada de verdade canônica quando múltiplos agentes compartilham parâmetros, decisões e critérios de avaliação.

- Versioned golden cases and eval suites
- Shared parameter registry across agents
- Regression detection for agent behavior
- Audit trail of what changed and why

## Deterministic AI attached to ERP data

**Tipo:** Field note  
**Indústria:** Operations / Enterprise software

Field note sobre integrar assistentes baseados em LLM com registros de ERP sem permitir que alucinações afetem decisões operacionais. Detalhes do cliente omitidos a pedido.

- Structured retrieval from ERP tables
- Decision boundaries restricted to validated fields
- Human confirmation gate for write operations
- Observability of every generated recommendation
`,
  `---
title: Cases
description: Proof of work, field notes and internal systems.
eyebrow: Work
lead: Proof of work, field notes and internal systems.
---

We do not publish client names or sensitive details without authorization. What appears here is either public with consent, anonymized field learning, or work on our own infrastructure and products.

## RBX Product Platform

**Type:** Internal system  
**Industry:** Engineering infrastructure

Design and operation of the internal platform that supports Robson, Strategos, TruthMetal, Thalamus, Eden and Argos Radar. Kubernetes, GitOps, shared observability and cross-product identity.

- Declarative infrastructure per product namespace
- Shared identity and entitlement layer
- Centralized logging, metrics and alerting baseline
- Reproducible deployment pipeline from commit to production

## Robson — Algorithmic Trading Engine

**Type:** Internal system  
**Industry:** Financial operations

An internal case on building a directional trading engine where execution reliability, risk controls and auditability matter more than headline returns.

- Real-time market data ingestion and signal generation
- Automated risk checks before order execution
- Trade journal and replay capability for post-hoc analysis
- First live capital execution under controlled exposure

## TruthMetal — Ground-Truth Control Plane

**Type:** Internal system  
**Industry:** AI systems

Internal case on the need for a canonical truth layer when multiple agents share parameters, decisions and eval criteria.

- Versioned golden cases and eval suites
- Shared parameter registry across agents
- Regression detection for agent behavior
- Audit trail of what changed and why

## Deterministic AI attached to ERP data

**Type:** Field note  
**Industry:** Operations / Enterprise software

A field note on integrating LLM-based assistants with ERP records without allowing hallucinated outputs to affect operational decisions. Client details omitted by request.

- Structured retrieval from ERP tables
- Decision boundaries restricted to validated fields
- Human confirmation gate for write operations
- Observability of every generated recommendation
`
);

// Changelog
addPage(
  'changelog',
  `---
title: Changelog
description: Registro objetivo da evolução de produtos e infraestrutura.
eyebrow: Log
lead: Registro objetivo da evolução de produtos e infraestrutura.
---

O que construímos, mudamos e aprendemos. Entradas curtas e factuais.

### 2026-06-18

- **rbx.ia.br** — changed: Evolução da navegação e arquitetura editorial do site, com adição de Soluções, Journal, Changelog, Cases, Newsroom e Trust.

### 2026-05-15

- **rbx.ia.br** — added: Sistema de contato Phase 0 no ar em rbx.ia.br e rbxsystems.ch. Formulários roteados via rbx-comms com Postmark e 360dialog.
- **Infrastructure** — improved: Publicação de field notes sobre IA corporativa como infraestrutura operacional.

### 2026-04-22

- **Robson** — added: Robson executou sua primeira posição de capital real usando o pipeline de trading. Foco na confiabilidade de execução e controles de risco.

### 2026-04-16

- **TruthMetal** — improved: Arquitetura de validação em testnet documentada: golden cases, eval suites e controles de regressão.

### 2026-04-05

- **Robson** — improved: Robson v2 integrou a camada de execução: separação clara entre geração de sinal, verificação de risco e execução na corretora.

### 2026-04-04

- **Thalamus** — added: Publicação sobre a unidade de controle em sistemas de agentes.

### 2026-04-01

- **TruthMetal** — added: Lançamento do TruthMetal, o plano de controle de ground truth canônico para parâmetros e decisões compartilhados entre agentes.

### 2026-03-29

- **Infrastructure** — improved: Refinamento do layout da plataforma Kubernetes, limites GitOps e baseline de observabilidade.

### 2026-03-25

- **TruthMetal** — added: Anúncio do TruthMetal como camada de ground truth da RBX para evals, benchmarks e accountability de agentes.
`,
  `---
title: Changelog
description: Objective record of product and infrastructure evolution.
eyebrow: Log
lead: Objective record of product and infrastructure evolution.
---

What we built, changed and learned. Short, factual entries.

### 2026-06-18

- **rbx.ia.br** — changed: Evolved site navigation and editorial structure, adding Solutions, Journal, Changelog, Cases, Newsroom and Trust.

### 2026-05-15

- **rbx.ia.br** — added: Contact system Phase 0 live on rbx.ia.br and rbxsystems.ch. Forms route through rbx-comms with Postmark and 360dialog.
- **Infrastructure** — improved: Published field notes on corporate AI as operational infrastructure.

### 2026-04-22

- **Robson** — added: Robson executed its first real capital position using the live trading pipeline. Focus on execution reliability and risk controls.

### 2026-04-16

- **TruthMetal** — improved: Testnet validation architecture documented: golden cases, eval suites and regression controls.

### 2026-04-05

- **Robson** — improved: Robson v2 integrated its missing execution glue: clearer separation between signal generation, risk check and broker execution.

### 2026-04-04

- **Thalamus** — added: Published notes on the unit of control in agent systems.

### 2026-04-01

- **TruthMetal** — added: Launched TruthMetal, the canonical ground-truth control plane for shared parameters and decisions across agents.

### 2026-03-29

- **Infrastructure** — improved: Refined Kubernetes platform layout, GitOps boundaries and observability baseline.

### 2026-03-25

- **TruthMetal** — added: Announced TruthMetal as RBX's ground-truth layer for evals, benchmarks and agent accountability.
`
);

// Newsroom
addPage(
  'newsroom',
  `---
title: Newsroom
description: Informação oficial, recursos de imprensa e fatos da empresa.
eyebrow: Press
lead: Informação oficial, recursos de imprensa e fatos da empresa.
---

Esta é a fonte institucional da RBX Systems. Para contato de imprensa, use **contact@rbxsystems.ch**.

## Boilerplate

A RBX Systems é uma empresa de engenharia focada em automação, infraestrutura de IA e sistemas operacionais para ambientes que exigem controle, confiabilidade e manutenibilidade de longo prazo.

## Fatos

| Label | Value |
|-------|-------|
| Foco | Engenharia de sistemas operacionais, automação e infraestrutura de IA |
| Produtos | Robson, Strategos, TruthMetal, Thalamus, Eden, Argos Radar |
| Modelo | Product-led, engineering-led, open-source core |
| Presença | Remote-first · Zug, CH |

## Press kit

- **Boilerplate** — disponível nesta página.
- **Logos** — disponíveis sob pedido.
- **Founder bio** — disponível sob pedido.
- **Product fact sheet** — disponível sob pedido.

## Comunicados oficiais

- **2026-06-18** — RBX atualiza arquitetura editorial com Journal, Changelog, Cases, Newsroom e Trust.
- **2026-03-25** — TruthMetal lançado como camada de ground truth para sistemas de agentes da RBX.
`,
  `---
title: Newsroom
description: Official information, press resources and company facts.
eyebrow: Press
lead: Official information, press resources and company facts.
---

This is the institutional source of RBX Systems. For press inquiries, use **contact@rbxsystems.ch**.

## Boilerplate

RBX Systems is an engineering company focused on automation, AI infrastructure and operational systems for environments that require control, reliability and long-term maintainability.

## Facts

| Label | Value |
|-------|-------|
| Focus | Engineering of operational systems, automation and AI infrastructure |
| Products | Robson, Strategos, TruthMetal, Thalamus, Eden, Argos Radar |
| Model | Product-led, engineering-led, open-source core |
| Presence | Remote-first · Zug, CH |

## Press kit

- **Boilerplate** — available on this page.
- **Logos** — available on request.
- **Founder bio** — available on request.
- **Product fact sheet** — available on request.

## Official announcements

- **2026-06-18** — RBX refreshes editorial architecture with Journal, Changelog, Cases, Newsroom and Trust pages.
- **2026-03-25** — TruthMetal launched as the ground-truth control plane for RBX agent systems.
`
);

// Trust
addPage(
  'trust',
  `---
title: Trust
description: Como a RBX constrói, opera e governa seus sistemas.
eyebrow: Governance
lead: Como a RBX constrói, opera e governa seus sistemas.
---

Esta página descreve nossos princípios de trabalho. Não é uma parede de certificações. Onde ainda estamos amadurecendo, dizemos isso.

## Security posture

Nossos sistemas são construídos com acesso least-privilege, gerenciamento de secrets, comunicação criptografada e auditabilidade por padrão.

## Governance

Decisões de arquitetura, ownership e padrões são registrados e versionados. Governança não é uma função separada; é como construímos.

## Responsible AI

Tratamos IA como infraestrutura que deve ser observável, testável e superável. Modelos são ferramentas; decisões permanecem responsáveis.

## Observability

Se não pode ser observado, não pode ser operado. Instrumentamos métricas, logs, traces e eventos estruturados desde o início.

## Open source

Os produtos RBX são desenvolvidos em repositórios públicos. Issues, discussões e contribuições são bem-vindas quando apropriado.

## Reliability

Projetamos para modos de falha, operação degradada e recuperação. Uptime é função de disciplina, não otimismo.
`,
  `---
title: Trust
description: How RBX builds, operates and governs its systems.
eyebrow: Governance
lead: How RBX builds, operates and governs its systems.
---

This page describes our working principles. It is not a certificate wall. Where we are still maturing, we say so.

## Security posture

Our systems are built with least-privilege access, secret management, encrypted communication and auditability by default.

## Governance

Architecture decisions, ownership and standards are recorded and versioned. Governance is not a separate function; it is how we build.

## Responsible AI

We treat AI as infrastructure that must be observable, testable and overrideable. Models are tools; decisions remain accountable.

## Observability

If it cannot be observed, it cannot be operated. We instrument for metrics, logs, traces and structured events from the start.

## Open source

RBX products are developed in public repositories. Issues, discussions and contributions are welcome where appropriate.

## Reliability

We design for failure modes, degraded operation and recovery. Uptime is a function of discipline, not optimism.
`
);

// Products
addPage(
  'products',
  `---
title: Produtos
description: Produtos open source da RBX Systems.
eyebrow: Open source
lead: Produtos open source, construídos com rigor operacional e prontos para deploys críticos.
---

Todos os produtos são open source e disponíveis publicamente. Construídos com rigor operacional e prontos para deploys críticos.

## Produtos RBX

- **Strategos**: Sala de situação estratégica para sua operação. Conecta dados operacionais, financeiros e externos em um modelo único de decisão.
- **RBX Ledger**: Event ledger para operações de alta exigência. Registra cada evento de negócio de forma imutável e auditável.
- **RBX Yield**: Mede o retorno real de agentes e sistemas de IA. Conecta custo (tokens, infraestrutura, pessoas) a resultados de negócio.
- **RBX Maestro**: Orquestração governada de agentes de IA. Coordena múltiplos agentes com controle semântico, memória e fallbacks seguros.
- **Robson**: Motor de execução e risco para mercados de cripto. Open source, focado em perda limitada, auditabilidade e recuperação de falhas.
- **Verentir**: Plano de medição e julgamento para IA. Avalia assistentes em shadow, compara com respostas de humanos e produz sinais de aprendizado.
- **Argos Radar**: Vigilância de mercado e financiamento sustentável. Monitora sinais operacionais, de risco e sustentabilidade.
- **Thalamus**: Camada de controle semântico para tráfego de IA. Aplica guardrails, políticas e roteamento baseado em conteúdo.
- **TruthMetal**: Sistema de groundtruth e avaliação para IA. Mantém datasets de referência, métricas e evidências para decisões sobre modelos.

Os repositórios estão em [github.com/rbxrobotica](https://github.com/rbxrobotica).
`,
  `---
title: Products
description: RBX Systems open source products.
eyebrow: Open source
lead: Open source products, built with operational rigor and ready for mission-critical deployments.
---

All products are open source and publicly available. Built with operational rigor and ready for mission-critical deployments.

## RBX Products

- **Strategos**: The strategic situation room for your operation. Connects operational, financial and external data into a single decision model.
- **RBX Ledger**: Event ledger for high-demand operations. Records every business event immutably and auditably.
- **RBX Yield**: Measures the real return of agents and AI systems. Connects cost (tokens, infrastructure, people) to business outcomes.
- **RBX Maestro**: Governed orchestration of AI agents. Coordinates multiple agents with semantic control, memory and safe fallbacks.
- **Robson**: Execution and risk engine for crypto markets. Open source, focused on bounded loss, auditability and failure recovery.
- **Verentir**: Measurement and judgment plane for AI. Evaluates assistants in shadow, compares with human answers and produces learning signals.
- **Argos Radar**: Market surveillance and sustainable financing. Monitors operational, risk and sustainability signals.
- **Thalamus**: Semantic control layer for AI traffic. Applies guardrails, policies and content-based routing.
- **TruthMetal**: Groundtruth and evaluation system for AI. Maintains reference datasets, metrics and evidence for model decisions.

Repositories are at [github.com/rbxrobotica](https://github.com/rbxrobotica).
`
);

// Atelier
addPage(
  'atelier',
  `---
title: Atelier
description: RBX Atelier.
eyebrow: Studio
lead: RBX Atelier.
---

Em breve.
`,
  `---
title: Atelier
description: RBX Atelier.
eyebrow: Studio
lead: RBX Atelier.
---

Coming soon.
`
);

// About
addPage(
  'about',
  `---
title: Sobre nós
description: Quem somos.
eyebrow: Company
lead: Sistemas projetados para operar.
---

A RBX projeta e opera plataformas, automações e infraestrutura para ambientes onde confiabilidade, governança e controle são requisitos.

## Liderança

- **Leandro Damasio** — Fundador & CEO. AI Engineer, Platform & Backend Systems, Technical Leadership. Criador de produtos como Strategos, Robson e Verentir.
- **Cauê Alencar** — CFO. Liderança financeira e estratégia para operações de alta exigência.
`,
  `---
title: About us
description: Who we are.
eyebrow: Company
lead: Systems designed to operate.
---

RBX designs and operates platforms, automations and infrastructure for environments where reliability, governance and control are requirements.

## Leadership

- **Leandro Damasio** — Founder & CEO. AI Engineer, Platform & Backend Systems, Technical Leadership. Creator of products such as Strategos, Robson and Verentir.
- **Cauê Alencar** — CFO. Financial leadership and strategy for high-demand operations.
`
);

// Team
addPage(
  'team',
  `---
title: Equipe
description: Conheça os fundadores e a liderança da RBX Systems.
eyebrow: People
lead: A RBX Systems é construída por fundadores com background em engenharia, pesquisa, operações e empreendedorismo de alta tecnologia.
---

Nossa equipe é pequena, técnica e focada em entregar sistemas que funcionam em produção.
`,
  `---
title: Team
description: Meet the founders and leadership of RBX Systems.
eyebrow: People
lead: RBX Systems is built by founders with backgrounds in engineering, research, operations and deep-tech entrepreneurship.
---

Our team is small, technical and focused on delivering systems that work in production.
`
);

// Leandro Damasio
addPage(
  'leandro-damasio',
  `---
title: Leandro Damasio
description: Fundador e CEO da RBX Systems.
eyebrow: Founder
lead: AI Engineer, Platform & Backend Systems, Technical Leadership.
---

Leandro Damasio é AI Engineer e fundador da RBX Systems. Criou produtos como Strategos, Robson e a plataforma de IA soberana da RBX.
`,
  `---
title: Leandro Damasio
description: Founder & CEO of RBX Systems.
eyebrow: Founder
lead: AI Engineer, Platform & Backend Systems, Technical Leadership.
---

Leandro Damasio is an AI Engineer and founder of RBX Systems. He created products such as Strategos, Robson and the RBX sovereign AI platform.
`
);

// Cauê Alencar
addPage(
  'caue-alencar',
  `---
title: Cauê Alencar
description: CFO da RBX Systems.
eyebrow: Chief Financial Officer
lead: Liderança financeira e estratégia para operações de alta exigência.
---

Cauê Alencar é Chief Financial Officer da RBX Systems. Lidera a estratégia financeira e operacional para plataformas críticas.
`,
  `---
title: Cauê Alencar
description: CFO of RBX Systems.
eyebrow: Chief Financial Officer
lead: Financial leadership and strategy for high-demand operations.
---

Cauê Alencar is Chief Financial Officer of RBX Systems. He leads financial and operational strategy for mission-critical platforms.
`
);

// Contact
addPage(
  'contact',
  `---
title: Contato
description: Fale conosco.
eyebrow: Contact
lead: Fale conosco.
---

Envie um e-mail para **contact@rbxsystems.ch** ou use o formulário em breve disponível nesta página.
`,
  `---
title: Contact
description: Get in touch.
eyebrow: Contact
lead: Get in touch.
---

Send an email to **contact@rbxsystems.ch** or use the form soon available on this page.
`
);

async function main() {
  for (const { key, body } of pages) {
    await put(key, body);
    console.log('uploaded', key);
  }
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
