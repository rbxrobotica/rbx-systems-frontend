/* eslint-disable @typescript-eslint/no-require-imports */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { load: parseYaml } = require('js-yaml');

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

function validatePage({ key, body }) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(body);
  if (!match) throw new Error(`${key}: missing YAML frontmatter`);
  const data = parseYaml(match[1]);
  if (!data || typeof data !== 'object') throw new Error(`${key}: invalid YAML frontmatter`);
  for (const field of ['title', 'description', 'lead']) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`${key}: missing ${field}`);
    }
  }
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

## Serviços especializados

- [Desenvolvimento web](/servicos/desenvolvimento-web)
- [Aplicativos mobile](/servicos/aplicativos-mobile)
- [Sistemas personalizados](/servicos/sistemas-personalizados)
- [Consultoria técnica](/servicos/consultoria-tecnica)
- [Automação de processos](/servicos/automacao-de-processos)
- [Integração de APIs](/servicos/integracao-de-apis)
- [Manutenção de sistemas](/servicos/manutencao-de-sistemas)
- [Design UX/UI](/servicos/design-ux-ui)
- [Soluções em nuvem](/servicos/solucoes-em-nuvem)
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

## Specialized services

- [Web development](/services/web-development)
- [Mobile apps](/services/mobile-apps)
- [Custom systems](/services/custom-systems)
- [Technical consulting](/services/technical-consulting)
- [Process automation](/services/process-automation)
- [API integration](/services/api-integration)
- [System maintenance](/services/system-maintenance)
- [UX/UI design](/services/ux-ui-design)
- [Cloud solutions](/services/cloud-solutions)
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
- **Flavia Ribeiro** — Fundadora SDR. Sales Development, Client Support e Customer Care, conectando clientes às soluções da RBX desde a primeira conversa.
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
- **Flavia Ribeiro** — Founding SDR. Sales Development, Client Support and Customer Care, connecting clients to RBX solutions from the first conversation.
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

// Legal
addPage(
  'legal',
  `---
title: Aviso Legal
description: Identificação do operador, propriedade intelectual, aviso de risco e privacidade dos sites da RBX Systems.
eyebrow: RBX Systems
lead: Este aviso identifica quem opera os sites da RBX Systems e as condições que regem o uso do conteúdo.
---

## Identificação

Os sites rbx.ia.br e rbxsystems.ch são operados pela RBX Systems.
<!-- OPERATOR: inserir razão social, CNPJ e endereço registrado antes da divulgação externa deste aviso. -->
Contato: [contact@rbxsystems.ch](mailto:contact@rbxsystems.ch) ou a [página de contato](/contato).

## Propriedade intelectual

O conteúdo destes sites (textos, marcas, material visual e exemplos de código) pertence à RBX Systems. Reprodução integral sem autorização prévia não é permitida. Citação com atribuição e link é permitida.

## Aviso de risco

Robson e o Briefing Diário BTC são produtos de tecnologia e informação. Nada nestes sites constitui recomendação de investimento, oferta de valores mobiliários ou consultoria financeira. Mercados de criptoativos envolvem risco elevado, incluindo a perda integral do capital. Resultados passados não garantem resultados futuros. Decisões de investimento são responsabilidade exclusiva de quem as toma.

## Privacidade

Estes sites usam medição de audiência sem cookies (Plausible, operado em infraestrutura própria). Parâmetros de origem de campanha (UTM) são guardados no navegador e acompanham o pedido de assinatura para atribuição. No checkout do Briefing Diário BTC, nome, e-mail, WhatsApp e CPF ou CNPJ são coletados para execução do contrato e processados pelo provedor de pagamento. Mensagens enviadas ao assistente do site são processadas por um provedor de modelo de linguagem para gerar a resposta e registradas para auditoria de qualidade. Dados do formulário de contato são usados para responder à solicitação. Não vendemos dados pessoais. Pedidos de acesso, correção ou exclusão podem ser feitos pelos canais de contato acima, conforme o artigo 18 da Lei 13.709/2018 (LGPD). Este aviso resume os fluxos de dados atuais destes sites.

## Assinaturas, cancelamento e reembolso

O Briefing Diário BTC é vendido em planos Free (sem cobrança, leitura na área logada), Pro e Equipe (entrega por WhatsApp), com cobrança mensal ou anual. No Brasil o pagamento é por Pix, processado pela Asaas; no site internacional, em USDT pelo BTCPay Server operado pela RBX ou por cartão pela Payrexx.

- O cancelamento pode ser pedido a qualquer momento pelos canais de contato acima ou pelo e-mail de suporte informado na confirmação. Não há multa nem fidelidade.
- Plano mensal: o cancelamento encerra a renovação; o acesso e a entrega seguem até o fim do período já pago.
- Plano anual: compras feitas pelo site têm direito de arrependimento em 7 dias corridos a partir do pagamento, com reembolso integral (artigo 49 do Código de Defesa do Consumidor). Depois desse prazo, o cancelamento encerra a renovação e mantém o acesso até o fim do período pago, sem reembolso proporcional.
- Reembolsos são feitos pelo mesmo meio de pagamento em até 10 dias úteis após a confirmação do pedido.
- Alterações de preço valem apenas para períodos futuros e são comunicadas por e-mail com pelo menos 30 dias de antecedência.

## Sem garantias

O conteúdo é publicado no estado em que se encontra, sem garantia de exatidão, completude ou adequação a um propósito específico. A RBX Systems pode alterar ou remover conteúdo sem aviso prévio.

## Alterações

Este aviso pode ser atualizado. Versão de 12 de setembro de 2026.
`,
  `---
title: Legal Notice
description: Operator identification, intellectual property, risk notice and privacy for the RBX Systems websites.
eyebrow: RBX Systems
lead: This notice identifies who operates the RBX Systems websites and the terms governing use of their content.
---

## Identification

The websites rbx.ia.br and rbxsystems.ch are operated by RBX Systems.
<!-- OPERATOR: insert registered legal entity name, registration number and address before external distribution of this notice. -->
Contact: [contact@rbxsystems.ch](mailto:contact@rbxsystems.ch) or the [contact page](/contact).

## Intellectual property

The content of these websites (texts, marks, visual material and code examples) belongs to RBX Systems. Full reproduction without prior authorization is not permitted. Quotation with attribution and a link is permitted.

## Risk notice

Robson and the Briefing Diário BTC are technology and information products. Nothing on these websites constitutes investment advice, an offer of securities or financial consulting. Cryptoasset markets carry high risk, including total loss of capital. Past results do not guarantee future results. Investment decisions are the sole responsibility of the person making them.

## Privacy

These websites use cookieless audience measurement (Plausible, operated on our own infrastructure). Campaign origin parameters (UTM) are stored in the browser and accompany the subscription order for attribution. The Briefing Diário BTC checkout collects name, email, WhatsApp number and Brazilian tax id (CPF or CNPJ) for contract execution, processed by the payment provider. Messages sent to the site assistant are processed by a language-model provider to generate the reply and recorded for quality audit. Contact form data is used to answer the request. We do not sell personal data. Requests for access, correction or deletion can be made through the contact channels above, under applicable data protection law, including Article 18 of the Brazilian LGPD (Law 13.709/2018). This notice summarizes the current data flows of these websites.

## Subscriptions, cancellation and refunds

The Daily BTC Briefing is sold as Free (no charge, reading in the logged-in area), Pro and Team plans (WhatsApp delivery), billed monthly or annually. On the international site payment is in USDT through the BTCPay Server operated by RBX or by card through Payrexx; in Brazil by Pix, processed by Asaas.

- Cancellation can be requested at any time through the contact channels above or the support email given in the confirmation. There is no penalty or minimum term.
- Monthly plan: cancellation stops the renewal; access and delivery continue until the end of the period already paid.
- Annual plan: a full refund is available if you cancel within 7 days of the first payment. After that, cancellation stops the renewal and keeps access until the end of the paid period, without a pro-rata refund.
- Refunds are made through the original payment method within 10 business days of confirming the request.
- Price changes apply only to future periods and are announced by email at least 30 days in advance.

## No warranties

Content is published as is, without warranty of accuracy, completeness or fitness for a particular purpose. RBX Systems may change or remove content without prior notice.

## Changes

This notice may be updated. Version of 2026-09-12.
`
);

// Manifesto
addPage(
  'manifesto',
  `---
title: Manifesto de IA Governada
description: A arquitetura de IA governada da RBX Systems em seis responsabilidades separadas, auditáveis e combináveis.
eyebrow: Manifesto
lead: Confiança em IA não é propriedade de um modelo. É propriedade de arquitetura.
---

Organizações que constroem produtos de IA descobrem que sistemas de agentes sem governança não sobrevivem ao contato com produção, auditoria ou regulação. Nossa resposta é uma arquitetura em que seis responsabilidades permanecem separadas, auditáveis e combináveis. Nunca fundidas.

## As seis responsabilidades

- **TruthMetal** define e versiona a verdade esperada e as evidências: oráculos, golden cases, especificações de avaliação, proveniência e revogação.
- **Verentir** mede e julga de forma independente: executa avaliações, atribui falhas e detecta regressão. Recomenda; nunca impõe o próprio veredito.
- **Thalamus** aplica o controle de runtime de IA: políticas, roteamento de modelos, limites, guardrails e interrupção. Toda chamada governada passa por ele.
- **Orquestração de Agentes** coordena a execução: missões, papéis, sequências, retries e critérios de parada explícitos.
- **RBX Governance** preserva a memória institucional: decisões registradas com racional, ownership e impacto. O git escreve e aprova; sistemas e interfaces são projeções de leitura.
- **Strategos** apresenta a situação e sustenta o julgamento humano: projeções, dossiês e gatilhos estratégicos sempre autorizados por pessoas.

## Os invariantes

1. Recomendação e enforcement são poderes distintos. O plano que mede nunca impõe; o plano que controla nunca avalia a si mesmo.
2. Ação consequente tem gate humano: gastos, compromissos, afirmações externas e gatilhos estratégicos.
3. Evidência acima de afirmação. Um trace ou um dashboard, sozinho, não é registro de auditoria.
4. Um resultado indeterminado nunca é reexecutado às cegas; é reconciliado antes.

A versão canônica deste manifesto é versionada em nosso repositório de governança, com controle de mudanças por decisão registrada. Nada aqui muda em silêncio.
`,
  `---
title: Governed AI Manifesto
description: The RBX Systems governed AI architecture as six separate, auditable and combinable responsibilities.
eyebrow: Manifesto
lead: Trust in AI is not a model property. It is an architectural property.
---

Organizations building AI products discover that ungoverned agent systems do not survive contact with production, audit or regulation. Our answer is an architecture in which six responsibilities remain separate, auditable and combinable. Never merged.

## The six responsibilities

- **TruthMetal** defines and versions expected truth and evidence: oracles, golden cases, evaluation specifications, provenance and revocation.
- **Verentir** measures and judges independently: it runs evaluations, attributes failures and detects regression. It recommends; it never enforces its own verdict.
- **Thalamus** applies AI runtime control: policies, model routing, limits, guardrails and interruption. Every governed call passes through it.
- **Agent Orchestration** coordinates execution: missions, roles, sequencing, retries and explicit stop criteria.
- **RBX Governance** preserves institutional memory: decisions recorded with rationale, ownership and impact. Git writes and approves; systems and interfaces are read projections.
- **Strategos** presents the situation and supports human judgment: projections, dossiers and strategic triggers always authorized by people.

## The invariants

1. Recommendation and enforcement are distinct powers. The plane that measures never enforces; the plane that controls never grades itself.
2. Consequential action is human-gated: spend, commitments, external claims and strategic triggers.
3. Evidence over assertion. A trace or a dashboard, alone, is not an audit record.
4. An indeterminate outcome is never blindly retried; it is reconciled first.

The canonical version of this manifesto is versioned in our governance repository, with change control by recorded decision. Nothing here changes silently.
`
);

// History
addPage(
  'history',
  `---
title: História da RBX Systems
description: Da automação e robótica à engenharia de sistemas e IA governada. Conheça a trajetória, os princípios e o trabalho atual da RBX Systems.
eyebrow: Empresa
lead: "A RBX evoluiu da automação de processos para a construção e operação de sistemas de alta exigência. O princípio permaneceu o mesmo: tecnologia precisa funcionar no mundo real."
---

## Da RBX Robótica à engenharia de sistemas

A empresa nasceu como RBX Robótica, uma consultoria voltada a automação, robótica e software personalizado. Os primeiros projetos tinham um objetivo direto: retirar trabalho repetitivo do caminho e conectar tecnologia a problemas operacionais concretos.

O escopo cresceu com os problemas. Automatizar uma tarefa isolada raramente basta quando dados, pessoas, integrações e decisões precisam continuar funcionando juntos. A RBX passou a trabalhar com backend, infraestrutura em nuvem, integrações e plataformas completas.

## A evolução para sistemas governados

Com a adoção de modelos de linguagem e agentes de IA, a exigência ficou maior. Não bastava gerar uma resposta plausível. Era necessário medir qualidade, controlar custos, registrar decisões, limitar ações e manter pessoas responsáveis pelo resultado.

Essa necessidade deu forma ao trabalho atual da RBX Systems: engenharia de IA, LLMOps, automação operacional, observabilidade, infraestrutura soberana e produtos open source para operações que exigem controle.

## O que construímos hoje

A RBX projeta e opera sistemas próprios e para clientes. Entre eles estão plataformas de decisão, motores de execução e risco, gateways de IA, camadas de avaliação, sistemas de memória e infraestrutura compartilhada.

O portfólio funciona como prova de trabalho. Cada produto nasce de um problema operacional real e precisa ser observável, auditável e recuperável antes de ser tratado como concluído.

## O que não mudou

- Resolver problemas reais antes de perseguir tendências.
- Projetar para operação, manutenção e falha, não apenas para a primeira entrega.
- Manter evidência e responsabilidade humana em decisões consequentes.
- Preferir sistemas compreensíveis a caixas-pretas difíceis de governar.
- Registrar o que foi decidido, por que mudou e como recuperar.

Conheça [a equipe](/equipe), veja [nossos cases](/cases) ou explore [as soluções da RBX](/solucoes). Para discutir um projeto, [entre em contato](/contato).
`,
  `---
title: RBX Systems History
description: From automation and robotics to systems engineering and governed AI. Explore the trajectory, principles and current work of RBX Systems.
eyebrow: Company
lead: "RBX evolved from process automation into building and operating high-demand systems. The principle stayed the same: technology must work in the real world."
---

## From RBX Robótica to systems engineering

The company began as RBX Robótica, a consultancy focused on automation, robotics and custom software. Its early projects had a direct objective: remove repetitive work and connect technology to concrete operational problems.

The scope grew with the problems. Automating one isolated task is rarely enough when data, people, integrations and decisions must keep working together. RBX expanded into backend engineering, cloud infrastructure, integrations and complete operational platforms.

## The move to governed systems

The adoption of language models and AI agents raised the standard. Producing a plausible answer was not enough. Quality had to be measured, costs controlled, decisions recorded, actions bounded and people kept accountable for outcomes.

That need shaped the work RBX Systems does today: AI engineering, LLMOps, operational automation, observability, sovereign infrastructure and open-source products for operations that demand control.

## What we build today

RBX designs and operates systems for itself and for clients. These include decision platforms, execution and risk engines, AI gateways, evaluation layers, memory systems and shared infrastructure.

The portfolio is proof of work. Each product starts with a real operational problem and must become observable, auditable and recoverable before we consider it complete.

## What has not changed

- Solve real problems before following trends.
- Design for operation, maintenance and failure, not only the first release.
- Keep evidence and human accountability around consequential decisions.
- Prefer understandable systems over black boxes that are hard to govern.
- Record what was decided, why it changed and how to recover.

Meet [the team](/team), review [our cases](/cases) or explore [RBX solutions](/solutions). To discuss a project, [get in touch](/contact).
`
);

// Careers
addPage(
  'careers',
  `---
title: Carreiras na RBX Systems
description: Trabalhe com engenharia de sistemas, IA aplicada, cloud e produtos open source em uma equipe remota, técnica e orientada a evidências.
eyebrow: Pessoas
lead: Construímos sistemas que precisam funcionar em produção. Procuramos pessoas curiosas, responsáveis e confortáveis com problemas difíceis.
---

## Como é trabalhar na RBX

A RBX é uma empresa remote-first, pequena e técnica. O trabalho combina engenharia de produto, infraestrutura, pesquisa aplicada e operação. Quem projeta uma solução também participa da validação, da documentação e do aprendizado depois que ela entra em produção.

Autonomia aqui significa responsabilidade clara. Esperamos que decisões importantes tenham evidência, trade-offs explícitos e um caminho de recuperação. Não confundimos velocidade com pressa nem complexidade com qualidade.

## Perfis que combinam com a equipe

Temos interesse em pessoas que trabalham bem em uma ou mais destas áreas:

- Engenharia de software, backend e sistemas distribuídos.
- IA aplicada, avaliação de modelos, RAG, agentes e LLMOps.
- DevOps, platform engineering, Kubernetes e observabilidade.
- Produto, UX/UI e pesquisa para ferramentas operacionais complexas.
- Operações, relacionamento com clientes e desenvolvimento de negócios técnicos.

Experiência ajuda, mas capacidade de aprender, escrever com clareza e assumir responsabilidade importa tanto quanto uma lista de tecnologias.

## Como avaliamos

O processo depende da função, mas busca responder perguntas simples: você entende o problema, consegue tornar suas decisões legíveis e entrega algo que outra pessoa consegue operar? Preferimos conversas objetivas e amostras de trabalho a etapas artificiais.

## Candidatura espontânea

Nem sempre mantemos vagas abertas publicamente. Ainda assim, recebemos apresentações de pessoas que se identificam com o trabalho da RBX. Envie uma breve mensagem com a área de interesse, links relevantes e currículo pela [página de contato](/contato).

Antes de escrever, conheça [nossa história](/historia), [a equipe](/equipe), [os produtos](/produtos) e o [Journal](/journal).
`,
  `---
title: Careers at RBX Systems
description: Work on systems engineering, applied AI, cloud and open-source products in a remote, technical and evidence-driven team.
eyebrow: People
lead: We build systems that must work in production. We look for curious, accountable people who are comfortable with difficult problems.
---

## Working at RBX

RBX is a small, technical and remote-first company. The work combines product engineering, infrastructure, applied research and operations. People who design a solution also take part in validation, documentation and the learning that follows a production release.

Autonomy here means clear accountability. Important decisions need evidence, explicit trade-offs and a recovery path. We do not confuse speed with haste or complexity with quality.

## Profiles that fit the team

We are interested in people who work well in one or more of these areas:

- Software engineering, backend and distributed systems.
- Applied AI, model evaluation, RAG, agents and LLMOps.
- DevOps, platform engineering, Kubernetes and observability.
- Product, UX/UI and research for complex operational tools.
- Operations, client relationships and technical business development.

Experience helps, but the ability to learn, write clearly and take responsibility matters as much as a list of technologies.

## How we evaluate

The process depends on the role, but it seeks to answer simple questions: do you understand the problem, can you make your decisions legible, and can you deliver something another person can operate? We prefer focused conversations and work samples over artificial stages.

## Open applications

We do not always maintain a public list of open positions. We still welcome introductions from people who identify with RBX's work. Send a short note with your area of interest, relevant links and resume through the [contact page](/contact).

Before writing, explore [our history](/history), [the team](/team), [our products](/products) and the [Journal](/journal).
`
);

// Web development
addPage(
  'services/web-development',
  `---
title: Desenvolvimento Web · RBX Systems
description: Sites, portais e aplicações web rápidas, acessíveis e integradas ao seu negócio, com SEO técnico, observabilidade e operação confiável.
eyebrow: Serviço
lead: Desenvolvimento web para produtos e operações que precisam de desempenho, clareza e manutenção de longo prazo.
---

## O que entregamos

A RBX projeta e desenvolve sites institucionais, portais, dashboards e aplicações web completas. O trabalho cobre a interface, o backend necessário, integrações, publicação e instrumentação em produção.

- Arquitetura SSR, SSG ou SPA escolhida conforme conteúdo e operação.
- Interfaces responsivas, acessíveis e eficientes em conexões reais.
- SEO técnico, metadados, dados estruturados, sitemap e performance.
- Integração com CMS, APIs, identidade, pagamentos e sistemas internos.
- CI/CD, observabilidade, segurança e documentação de operação.

## Quando contratar

Este serviço faz sentido quando o site deixou de ser apenas uma apresentação e passou a participar da operação. Também atende equipes que precisam substituir uma base difícil de manter, melhorar Core Web Vitals, lançar um portal para clientes ou transformar um protótipo em produto confiável.

## Como trabalhamos

Começamos pelos objetivos, públicos e fluxos críticos. Definimos arquitetura, métricas e limites antes de escolher componentes. A entrega é incremental, com validação de conteúdo, acessibilidade, desempenho e comportamento em falhas.

O resultado inclui código versionado, pipeline de publicação, ambientes reproduzíveis e instruções para manutenção. Quando o projeto exige backend ou integrações complexas, conectamos o trabalho a [sistemas personalizados](/servicos/sistemas-personalizados) e [integração de APIs](/servicos/integracao-de-apis).

## Próximo passo

Veja [nossos cases](/cases) ou [fale com a RBX](/contato) para avaliar escopo, riscos e uma primeira entrega útil.
`,
  `---
title: Web Development · RBX Systems
description: Fast, accessible websites, portals and web applications integrated with your business, with technical SEO, observability and reliable operations.
eyebrow: Service
lead: Web development for products and operations that need performance, clarity and long-term maintainability.
---

## What we deliver

RBX designs and develops institutional websites, portals, dashboards and complete web applications. The work covers the interface, required backend, integrations, deployment and production instrumentation.

- SSR, SSG or SPA architecture selected for the content and operating model.
- Responsive, accessible interfaces that perform on real connections.
- Technical SEO, metadata, structured data, sitemaps and performance work.
- Integration with CMS platforms, APIs, identity, payments and internal systems.
- CI/CD, observability, security and operations documentation.

## When to hire us

This service fits when a website has become part of the operation, not only a presentation layer. It also helps teams replace a hard-to-maintain codebase, improve Core Web Vitals, launch a customer portal or turn a prototype into a reliable product.

## How we work

We start with objectives, audiences and critical flows. Architecture, metrics and constraints come before component choices. Delivery is incremental, with validation of content, accessibility, performance and failure behavior.

The result includes versioned code, a deployment pipeline, reproducible environments and maintenance instructions. When the project needs a substantial backend or complex integrations, we connect the work to [custom systems](/services/custom-systems) and [API integration](/services/api-integration).

## Next step

Review [our cases](/cases) or [talk to RBX](/contact) to evaluate scope, risks and the first useful release.
`
);

// Mobile applications
addPage(
  'services/mobile-apps',
  `---
title: Aplicativos Mobile · RBX Systems
description: Aplicativos Android e iOS integrados ao seu backend, com arquitetura segura, operação offline, telemetria e publicação assistida.
eyebrow: Serviço
lead: Aplicativos móveis projetados como parte do sistema, não como uma interface isolada.
---

## O que entregamos

A RBX desenvolve aplicativos para Android e iOS conectados a APIs, identidade, pagamentos, notificações e dados operacionais. Escolhemos abordagem nativa ou multiplataforma conforme requisitos de desempenho, acesso ao dispositivo e manutenção.

- Descoberta de produto e protótipos para validar os fluxos críticos.
- Aplicação, backend e contratos de API tratados como um único sistema.
- Autenticação, armazenamento seguro e proteção de dados sensíveis.
- Sincronização, cache e modo offline quando a operação exige continuidade.
- Métricas, logs, crash reporting e acompanhamento de releases.

## Quando contratar

O serviço é indicado para produtos digitais com uso recorrente, equipes de campo, atendimento, logística, coleta de dados ou experiências que precisam de recursos do dispositivo. Também assumimos modernização de aplicativos instáveis ou difíceis de publicar.

## Como trabalhamos

Mapeamos jornadas, condições de rede, permissões e riscos de sincronização antes da implementação. Cada mutação importante tem estado visível, proteção contra envio duplicado e tratamento de falha. Releases passam por testes, revisão das permissões e um plano de rollback compatível com as lojas.

Quando o aplicativo depende de integrações ou dados específicos, combinamos o projeto com [integração de APIs](/servicos/integracao-de-apis), [sistemas personalizados](/servicos/sistemas-personalizados) e [soluções em nuvem](/servicos/solucoes-em-nuvem).

## Próximo passo

[Fale com a RBX](/contato) sobre o público, as plataformas e o fluxo que precisa funcionar primeiro.
`,
  `---
title: Mobile App Development · RBX Systems
description: Android and iOS applications integrated with your backend, with secure architecture, offline operation, telemetry and release support.
eyebrow: Service
lead: Mobile applications designed as part of the system, not as an isolated interface.
---

## What we deliver

RBX develops Android and iOS applications connected to APIs, identity, payments, notifications and operational data. We choose a native or cross-platform approach based on performance, device access and maintenance requirements.

- Product discovery and prototypes that validate critical flows.
- Application, backend and API contracts treated as one system.
- Authentication, secure storage and sensitive-data protection.
- Synchronization, caching and offline operation when continuity matters.
- Metrics, logs, crash reporting and release monitoring.

## When to hire us

The service fits digital products with recurring use, field teams, customer support, logistics, data collection or experiences that need device capabilities. We also modernize unstable applications or codebases that are difficult to release.

## How we work

We map journeys, network conditions, permissions and synchronization risks before implementation. Every important mutation gets visible state, duplicate-submit protection and failure handling. Releases go through tests, permission review and a rollback plan compatible with app stores.

When the application depends on specialized integrations or data, we combine the project with [API integration](/services/api-integration), [custom systems](/services/custom-systems) and [cloud solutions](/services/cloud-solutions).

## Next step

[Talk to RBX](/contact) about the audience, target platforms and the first flow that must work.
`
);

// Custom systems
addPage(
  'services/custom-systems',
  `---
title: Sistemas Personalizados · RBX Systems
description: Software sob medida para processos específicos, com integrações, controle de acesso, trilha de auditoria e manutenção de longo prazo.
eyebrow: Serviço
lead: Sistemas construídos em torno da sua operação, dos dados existentes e das decisões que precisam permanecer sob controle.
---

## O que entregamos

A RBX constrói software para operações que não cabem bem em ferramentas genéricas. Transformamos planilhas, tarefas manuais e sistemas desconectados em uma plataforma com regras explícitas, dados consistentes e responsabilidades claras.

- Modelagem de domínio e dos fluxos reais da operação.
- Backend, interfaces, APIs e automações no mesmo desenho arquitetural.
- Perfis de acesso, aprovação humana e trilhas de auditoria.
- Migração de dados e integração gradual com sistemas existentes.
- Testes, telemetria, runbooks e plano de evolução.

## Quando contratar

Um sistema personalizado faz sentido quando processos críticos dependem de planilhas frágeis, retrabalho entre equipes ou adaptações caras em um produto de prateleira. Também é adequado quando segurança, rastreabilidade ou regras próprias são diferenciais do negócio.

## Como trabalhamos

Começamos pelo menor recorte que produz valor e reduz risco. Identificamos entidades, invariantes, integrações e modos de falha. A arquitetura mantém limites claros para que novos módulos possam ser adicionados sem reescrever o núcleo.

Não desaparecemos depois do deploy. Documentamos operação, recuperação, ownership e mudanças de schema. Se necessário, o projeto continua com [manutenção de sistemas](/servicos/manutencao-de-sistemas), [automação de processos](/servicos/automacao-de-processos) ou [observabilidade](/servicos/observabilidade).

## Próximo passo

[Fale com a RBX](/contato) para transformar o processo atual em um escopo verificável.
`,
  `---
title: Custom Systems · RBX Systems
description: Purpose-built software for specific workflows, with integrations, access control, audit trails and long-term maintenance.
eyebrow: Service
lead: Systems built around your operation, existing data and the decisions that must remain under control.
---

## What we deliver

RBX builds software for operations that do not fit generic tools. We turn spreadsheets, manual tasks and disconnected systems into a platform with explicit rules, consistent data and clear responsibilities.

- Domain modeling based on the real operational flow.
- Backend, interfaces, APIs and automation in one architectural design.
- Access roles, human approvals and audit trails.
- Data migration and gradual integration with existing systems.
- Tests, telemetry, runbooks and an evolution plan.

## When to hire us

A custom system makes sense when critical processes depend on fragile spreadsheets, handoffs between teams or expensive workarounds in off-the-shelf software. It also fits operations where security, traceability or proprietary rules are business differentiators.

## How we work

We start with the smallest scope that creates value and reduces risk. We identify entities, invariants, integrations and failure modes. The architecture keeps boundaries clear so new modules can be added without rewriting the core.

We do not disappear after deployment. We document operations, recovery, ownership and schema changes. When needed, the project continues through [system maintenance](/services/system-maintenance), [process automation](/services/process-automation) or [observability](/services/observability).

## Next step

[Talk to RBX](/contact) to turn the current process into a verifiable scope.
`
);

// Technical consulting
addPage(
  'services/technical-consulting',
  `---
title: Consultoria Técnica · RBX Systems
description: Diagnóstico independente de arquitetura, confiabilidade, segurança e produto para transformar evidências técnicas em decisões e prioridades claras.
eyebrow: Serviço
lead: Uma leitura técnica independente para decisões que não devem depender de opinião, urgência ou preferência de ferramenta.
---

## O que entregamos

A consultoria técnica da RBX ajuda founders, lideranças e equipes de engenharia a entender o estado real de um produto. O trabalho pode ser um diagnóstico pontual, uma revisão de arquitetura ou o acompanhamento de uma decisão complexa.

- Mapa da arquitetura, dependências e fluxos críticos.
- Avaliação de confiabilidade, segurança, desempenho e manutenibilidade.
- Identificação de riscos, gargalos e dívida técnica com evidências.
- Opções de solução, trade-offs e ordem recomendada de execução.
- Relatório executivo, backlog priorizado e sessão de transferência.

## Quando contratar

Este serviço é útil antes de uma modernização, aquisição, mudança de fornecedor, aumento de escala ou investimento relevante. Também funciona quando incidentes se repetem, entregas ficam imprevisíveis ou a equipe precisa de uma segunda opinião independente.

## Como trabalhamos

O diagnóstico começa read-only. Analisamos código, arquitetura, pipelines, métricas e documentação sem interferir na operação. Entrevistas curtas ajudam a comparar o desenho formal com o sistema que realmente existe.

As recomendações distinguem correções urgentes, melhorias estruturais e escolhas que podem esperar. Cada proposta registra benefício, custo, risco e o que fica de fora. A implementação pode permanecer com sua equipe ou continuar com a RBX em [sistemas personalizados](/servicos/sistemas-personalizados), [DevOps e cloud](/servicos/devops-cloud) ou [manutenção](/servicos/manutencao-de-sistemas).

## Próximo passo

Veja também o [Technical Product Review](/diagnostico) ou [fale com a RBX](/contato) para definir a pergunta que a revisão precisa responder.
`,
  `---
title: Technical Consulting · RBX Systems
description: Independent architecture, reliability, security and product diagnostics that turn technical evidence into clear decisions and priorities.
eyebrow: Service
lead: An independent technical view for decisions that should not depend on opinion, urgency or tool preference.
---

## What we deliver

RBX technical consulting helps founders, leaders and engineering teams understand the real state of a product. The engagement can be a focused diagnostic, an architecture review or support for a complex decision.

- A map of architecture, dependencies and critical flows.
- Reliability, security, performance and maintainability assessment.
- Evidence-backed identification of risks, bottlenecks and technical debt.
- Solution options, trade-offs and a recommended order of execution.
- Executive report, prioritized backlog and handover session.

## When to hire us

This service is useful before modernization, acquisition, vendor changes, significant scaling or a major investment. It also helps when incidents repeat, delivery becomes unpredictable or the team needs an independent second opinion.

## How we work

The diagnostic starts read-only. We analyze code, architecture, pipelines, metrics and documentation without interfering with operations. Short interviews help compare the formal design with the system that actually exists.

Recommendations distinguish urgent fixes, structural improvements and choices that can wait. Each proposal records benefit, cost, risk and what it leaves out. Implementation can remain with your team or continue with RBX through [custom systems](/services/custom-systems), [DevOps and cloud](/services/devops-cloud) or [maintenance](/services/system-maintenance).

## Next step

See the [Technical Product Review](/diagnostic) or [talk to RBX](/contact) to define the question the review must answer.
`
);

// Process automation
addPage(
  'services/process-automation',
  `---
title: Automação de Processos · RBX Systems
description: Workflows auditáveis para reduzir trabalho manual, integrar sistemas e manter pessoas no controle das exceções e decisões importantes.
eyebrow: Serviço
lead: Automação que reduz trabalho repetitivo sem esconder o estado da operação nem remover os controles necessários.
---

## O que entregamos

A RBX transforma processos manuais em workflows explícitos, mensuráveis e recuperáveis. A automação pode coordenar APIs, documentos, filas, aprovações humanas e sistemas legados sem depender de uma sequência frágil de scripts.

- Mapeamento do processo atual, tempos de espera e pontos de erro.
- Máquina de estados com regras, ownership e critérios de conclusão.
- Integrações com ERP, CRM, atendimento, pagamentos e ferramentas internas.
- Gates humanos para ações financeiras, contratuais ou irreversíveis.
- Alertas, auditoria e painéis para exceções e desempenho.

## Quando contratar

O serviço atende operações que repetem tarefas entre sistemas, copiam dados manualmente, perdem solicitações em caixas de entrada ou dependem de uma pessoa para saber o estado de cada caso. Também é útil quando uma automação existente falha em silêncio.

## Como trabalhamos

Primeiro medimos o processo e removemos ambiguidades. Depois automatizamos um fluxo limitado, com idempotência, retries controlados e reconciliação para resultados indeterminados. Nenhuma falha importante deve desaparecer em logs; ela precisa gerar um estado visível e uma ação de recuperação.

Integrações ficam atrás de contratos claros e podem evoluir sem acoplar todo o workflow a um fornecedor. Veja também [integração de APIs](/servicos/integracao-de-apis), [sistemas personalizados](/servicos/sistemas-personalizados) e [agentes de IA](/servicos/agentes-de-ia).

## Próximo passo

[Fale com a RBX](/contato) com um exemplo do processo, o volume atual e as exceções que mais consomem tempo.
`,
  `---
title: Process Automation · RBX Systems
description: Auditable workflows that reduce manual work, integrate systems and keep people in control of exceptions and important decisions.
eyebrow: Service
lead: Automation that removes repetitive work without hiding operational state or removing necessary controls.
---

## What we deliver

RBX turns manual processes into explicit, measurable and recoverable workflows. Automation can coordinate APIs, documents, queues, human approvals and legacy systems without relying on a fragile sequence of scripts.

- Mapping of the current process, wait times and error points.
- State machine with rules, ownership and completion criteria.
- Integration with ERP, CRM, support, payments and internal tools.
- Human gates for financial, contractual or irreversible actions.
- Alerts, audit records and dashboards for exceptions and performance.

## When to hire us

The service fits operations that repeat tasks across systems, copy data manually, lose requests in inboxes or depend on one person to know the state of each case. It is also useful when an existing automation can fail silently.

## How we work

We first measure the process and remove ambiguity. Then we automate a bounded flow with idempotency, controlled retries and reconciliation for indeterminate outcomes. Important failures cannot disappear into logs; they must produce visible state and a recovery action.

Integrations sit behind clear contracts and can evolve without coupling the whole workflow to one vendor. See also [API integration](/services/api-integration), [custom systems](/services/custom-systems) and [AI agents](/services/ai-agents).

## Next step

[Talk to RBX](/contact) with an example of the process, current volume and the exceptions that consume the most time.
`
);

// API integration
addPage(
  'services/api-integration',
  `---
title: Integração de APIs · RBX Systems
description: Integração segura entre APIs, SaaS e sistemas legados, com contratos versionados, idempotência, observabilidade e recuperação de falhas.
eyebrow: Serviço
lead: Integrações projetadas para continuar corretas quando fornecedores, redes e dados não se comportam como o cenário ideal.
---

## O que entregamos

A RBX conecta sistemas internos, plataformas SaaS, parceiros e serviços de nuvem por APIs síncronas, eventos ou processamento em lote. O objetivo não é apenas mover dados, mas preservar significado, segurança e rastreabilidade entre as pontas.

- Contratos de API, schemas e estratégia de versionamento.
- Adaptadores para REST, GraphQL, webhooks, filas e sistemas legados.
- Autenticação, autorização, gestão de secrets e limites de acesso.
- Idempotência, deduplicação, retries e reconciliação.
- Métricas de latência, erro, volume e idade dos dados.

## Quando contratar

O serviço ajuda quando equipes copiam informações entre ferramentas, webhooks se perdem, integrações quebram a cada mudança de fornecedor ou um fluxo crítico não tem owner. Também atende projetos que precisam expor uma API estável sobre um sistema existente.

## Como trabalhamos

Documentamos a fonte de verdade, o contrato e o comportamento esperado em falhas antes de implementar. Cada dependência externa recebe timeout, orçamento de retry, modo degradado e sinal visível de indisponibilidade. Quando os dois lados podem atualizar o mesmo dado, definimos ownership e regras de conflito.

Testes de contrato e ambientes de homologação reduzem surpresas. A operação recebe runbooks e dashboards para distinguir problema local, dado inválido e falha do fornecedor. Para fluxos completos, combinamos com [automação de processos](/servicos/automacao-de-processos) e [observabilidade](/servicos/observabilidade).

## Próximo passo

[Fale com a RBX](/contato) informando os sistemas envolvidos, o volume e o que acontece hoje quando a integração falha.
`,
  `---
title: API Integration · RBX Systems
description: Secure integration across APIs, SaaS and legacy systems, with versioned contracts, idempotency, observability and failure recovery.
eyebrow: Service
lead: Integrations designed to remain correct when vendors, networks and data do not follow the ideal scenario.
---

## What we deliver

RBX connects internal systems, SaaS platforms, partners and cloud services through synchronous APIs, events or batch processing. The goal is not only to move data, but to preserve meaning, security and traceability across endpoints.

- API contracts, schemas and a versioning strategy.
- Adapters for REST, GraphQL, webhooks, queues and legacy systems.
- Authentication, authorization, secret management and access limits.
- Idempotency, deduplication, retries and reconciliation.
- Metrics for latency, errors, volume and data age.

## When to hire us

The service helps when teams copy information between tools, webhooks disappear, integrations break on every vendor change or a critical flow has no owner. It also supports projects that need a stable API over an existing system.

## How we work

We document the source of truth, contract and expected failure behavior before implementation. Every external dependency gets a timeout, retry budget, degraded mode and visible unavailability signal. When both sides can update the same data, we define ownership and conflict rules.

Contract tests and staging environments reduce surprises. Operations receive runbooks and dashboards that distinguish a local problem, invalid data and a vendor failure. For complete flows, we combine this service with [process automation](/services/process-automation) and [observability](/services/observability).

## Next step

[Talk to RBX](/contact) with the systems involved, expected volume and what currently happens when the integration fails.
`
);

// System maintenance
addPage(
  'services/system-maintenance',
  `---
title: Manutenção de Sistemas · RBX Systems
description: Sustentação e evolução de software com correções, upgrades, segurança, observabilidade e redução contínua do risco operacional.
eyebrow: Serviço
lead: Manutenção orientada por risco para sistemas que precisam continuar úteis, seguros e compreensíveis depois da primeira entrega.
---

## O que entregamos

A RBX assume a sustentação de sistemas existentes ou continua operando o que construiu. O serviço combina resposta a incidentes, manutenção preventiva e evolução planejada, com prioridades definidas pelo impacto na operação.

- Diagnóstico inicial de código, infraestrutura, dependências e riscos.
- Correção de defeitos e investigação de causa raiz.
- Atualizações de runtime, bibliotecas, banco de dados e pipelines.
- Observabilidade, alertas, backups e testes de recuperação.
- Backlog técnico priorizado e documentação atualizada.

## Quando contratar

Este serviço é indicado quando o sistema depende de poucas pessoas, acumula versões vulneráveis, apresenta incidentes repetidos ou não tem uma rotina segura de deploy. Também ajuda equipes que precisam recuperar previsibilidade antes de adicionar funcionalidades.

## Como trabalhamos

A transição começa com acesso read-only, inventário e critérios de severidade. Mudanças entram por versionamento, revisão e pipeline reproduzível. Incidentes geram evidência, correção e ação preventiva, não apenas um ajuste emergencial.

Definimos escopo e nível de atendimento de forma explícita. Manutenção não significa disponibilidade ilimitada nem promessa de ausência de falhas. Significa tornar riscos visíveis, reduzir recorrência e manter um caminho testado de recuperação. Quando a base precisa mudar, conectamos o trabalho a [consultoria técnica](/servicos/consultoria-tecnica) e [soluções em nuvem](/servicos/solucoes-em-nuvem).

## Próximo passo

[Fale com a RBX](/contato) sobre o sistema, a stack, os incidentes recentes e a expectativa de operação.
`,
  `---
title: System Maintenance · RBX Systems
description: Software support and evolution through fixes, upgrades, security work, observability and continuous operational risk reduction.
eyebrow: Service
lead: Risk-driven maintenance for systems that must remain useful, secure and understandable after the first release.
---

## What we deliver

RBX takes over existing systems or continues operating what it builds. The service combines incident response, preventive maintenance and planned evolution, with priorities driven by operational impact.

- Initial assessment of code, infrastructure, dependencies and risks.
- Defect correction and root-cause investigation.
- Runtime, library, database and pipeline upgrades.
- Observability, alerts, backups and recovery tests.
- Prioritized technical backlog and updated documentation.

## When to hire us

This service fits systems that depend on a few people, carry vulnerable versions, suffer repeated incidents or lack a safe deployment routine. It also helps teams restore predictability before adding features.

## How we work

The transition starts with read-only access, an inventory and severity criteria. Changes move through version control, review and a reproducible pipeline. Incidents produce evidence, a correction and a preventive action, not only an emergency patch.

We define scope and service level explicitly. Maintenance does not mean unlimited availability or a promise of no failures. It means making risk visible, reducing recurrence and maintaining a tested recovery path. When the foundation needs to change, we connect the work to [technical consulting](/services/technical-consulting) and [cloud solutions](/services/cloud-solutions).

## Next step

[Talk to RBX](/contact) about the system, stack, recent incidents and operating expectations.
`
);

// UX/UI design
addPage(
  'services/ux-ui-design',
  `---
title: Design UX/UI · RBX Systems
description: UX/UI para produtos e ferramentas operacionais, com pesquisa, fluxos claros, protótipos testáveis, acessibilidade e design systems.
eyebrow: Serviço
lead: Interfaces que tornam estado, risco e próxima ação compreensíveis para quem realmente opera o sistema.
---

## O que entregamos

A RBX projeta experiências para produtos digitais, dashboards e ferramentas internas. Nosso foco está em fluxos complexos, decisões frequentes e interfaces em que clareza operacional importa mais do que decoração.

- Entrevistas, análise de tarefas e mapa da jornada atual.
- Arquitetura de informação e fluxos de navegação.
- Wireframes e protótipos para testar hipóteses cedo.
- Interface responsiva, acessível e consistente.
- Design system com componentes e estados implementáveis.

## Quando contratar

O serviço faz sentido quando usuários se perdem, tarefas exigem treinamento excessivo, erros de interface afetam a operação ou o produto cresceu sem uma linguagem visual consistente. Também atende novos produtos que precisam validar o fluxo antes de investir na implementação completa.

## Como trabalhamos

Começamos pelas tarefas, contexto e restrições. Estados de loading, vazio, erro, sucesso, permissão e operação degradada fazem parte do desenho desde o início. A interface bloqueia envios duplicados e deixa visível quando uma ação ainda está em andamento.

Protótipos são testados com cenários realistas. O handoff inclui tokens, componentes, regras de comportamento e prioridades, reduzindo a distância entre design e código. Quando desejado, a RBX também implementa a experiência em [desenvolvimento web](/servicos/desenvolvimento-web) ou [aplicativos mobile](/servicos/aplicativos-mobile).

## Próximo passo

[Fale com a RBX](/contato) sobre o produto, os usuários e a tarefa que hoje causa mais atrito.
`,
  `---
title: UX/UI Design · RBX Systems
description: UX/UI for products and operational tools, with research, clear flows, testable prototypes, accessibility and design systems.
eyebrow: Service
lead: Interfaces that make state, risk and the next action understandable to the people who operate the system.
---

## What we deliver

RBX designs experiences for digital products, dashboards and internal tools. We focus on complex flows, frequent decisions and interfaces where operational clarity matters more than decoration.

- Interviews, task analysis and a map of the current journey.
- Information architecture and navigation flows.
- Wireframes and prototypes that test assumptions early.
- Responsive, accessible and consistent interface design.
- Design system with implementable components and states.

## When to hire us

The service fits products where users get lost, tasks require excessive training, interface mistakes affect operations or growth has produced an inconsistent visual language. It also supports new products that need to validate the flow before investing in full implementation.

## How we work

We start with tasks, context and constraints. Loading, empty, error, success, permission and degraded-operation states are part of the design from the beginning. The interface prevents duplicate submissions and makes pending actions visible.

Prototypes are tested with realistic scenarios. Handoff includes tokens, components, behavior rules and priorities, reducing the gap between design and code. When useful, RBX also implements the experience through [web development](/services/web-development) or [mobile apps](/services/mobile-apps).

## Next step

[Talk to RBX](/contact) about the product, its users and the task that causes the most friction today.
`
);

// Cloud solutions
addPage(
  'services/cloud-solutions',
  `---
title: Soluções em Nuvem · RBX Systems
description: Arquitetura, migração e operação em nuvem com infraestrutura como código, segurança, backups, observabilidade e controle de custos.
eyebrow: Serviço
lead: Infraestrutura em nuvem reproduzível, observável e preparada para falhas, sem esconder custos ou dependências críticas.
---

## O que entregamos

A RBX projeta, migra e opera ambientes em nuvem para aplicações, dados e serviços de IA. Trabalhamos com cloud pública, infraestrutura dedicada e modelos híbridos conforme requisitos de soberania, escala, latência e custo.

- Arquitetura de contas, redes, identidade e ambientes.
- Infraestrutura como código e GitOps com revisão de mudanças.
- Containers, Kubernetes ou serviços gerenciados quando adequados.
- Backups, restauração, continuidade e testes de recuperação.
- Observabilidade, segurança, gestão de secrets e orçamento de custos.

## Quando contratar

O serviço atende migrações de servidores manuais, ambientes que não podem ser reproduzidos, crescimento sem visibilidade de custo ou aplicações que precisam de uma base mais confiável. Também ajuda a reduzir dependência de um único fornecedor quando isso é um requisito real.

## Como trabalhamos

Começamos pelo inventário de workloads, dados, integrações e objetivos de recuperação. Cada componente recebe owner, limite de acesso e comportamento esperado quando uma dependência falha. A migração ocorre em etapas verificáveis, com rollback e sem big bang desnecessário.

Não tratamos um painel de cloud como arquitetura. O resultado precisa estar versionado, documentado e observável. Operação continuada pode ser combinada com [DevOps e cloud](/servicos/devops-cloud), [observabilidade](/servicos/observabilidade) e [manutenção de sistemas](/servicos/manutencao-de-sistemas).

## Próximo passo

[Fale com a RBX](/contato) sobre o ambiente atual, requisitos de disponibilidade, restrições de dados e custos que precisam ser controlados.
`,
  `---
title: Cloud Solutions · RBX Systems
description: Cloud architecture, migration and operations with infrastructure as code, security, backups, observability and cost control.
eyebrow: Service
lead: Reproducible, observable cloud infrastructure designed for failure without hiding costs or critical dependencies.
---

## What we deliver

RBX designs, migrates and operates cloud environments for applications, data and AI services. We work with public cloud, dedicated infrastructure and hybrid models according to sovereignty, scale, latency and cost requirements.

- Account, network, identity and environment architecture.
- Infrastructure as code and GitOps with reviewed changes.
- Containers, Kubernetes or managed services where appropriate.
- Backups, restoration, continuity and recovery tests.
- Observability, security, secret management and cost budgets.

## When to hire us

The service supports migrations from manually managed servers, environments that cannot be reproduced, growth without cost visibility or applications that need a more reliable foundation. It also helps reduce dependence on one vendor when portability is a real requirement.

## How we work

We start with an inventory of workloads, data, integrations and recovery objectives. Every component gets an owner, access boundary and expected behavior when a dependency fails. Migration happens in verifiable stages with rollback, avoiding an unnecessary big-bang change.

We do not treat a cloud console as architecture. The result must be versioned, documented and observable. Continued operations can combine with [DevOps and cloud](/services/devops-cloud), [observability](/services/observability) and [system maintenance](/services/system-maintenance).

## Next step

[Talk to RBX](/contact) about the current environment, availability targets, data constraints and the costs that need control.
`
);
// Briefing BTC landing page (offer copy; the modal and checkout live in the app, see src/lib/briefing)
addPage(
  'briefing-btc',
  `---
title: "Briefing Diário BTC"
description: "Leitura operacional diária do mercado de Futuros BTC/USDT, entregue no WhatsApp todo dia útil até as 07h. Contexto, cenários e plano de voo em artefatos auditáveis. Não é sinal de trading."
eyebrow: "RBX · INTELIGÊNCIA DE MERCADO"
lead: "Leitura operacional diária do mercado de Futuros BTC/USDT. Contexto, cenários e plano de voo, entregue no WhatsApp todo dia útil."
landing:
  briefingBtc:
    metaTitle: "Briefing Diário BTC · Contexto operacional do mercado"
    metaDescription: "Leitura operacional diária do mercado de Futuros BTC/USDT, no WhatsApp até as 07h em dias úteis. Contexto, cenários e plano de voo em artefatos auditáveis. Não é sinal de trading. Free na área logada, Pro por R$ 39/mês."
    subtitle: "RBX · INTELIGÊNCIA DE MERCADO"
    title: "O mercado BTC não espera. Às 07h, você já leu."
    description: "Leitura operacional diária do mercado de Futuros BTC/USDT. Contexto, cenários e plano de voo. Entregue no WhatsApp todo dia útil, até as 07h."
    benefits: |
      Seis artefatos auditáveis por dia: flight-plan, snapshot, model-output, manifest, sources, execution-log
      Entrega no WhatsApp até as 07h (horário de Brasília), segunda a sexta
      Fontes públicas da Binance USD-M, somente leitura
      Contexto, cenários e plano de voo. Nunca um sinal de compra ou venda
      Área logada com a edição do dia e as últimas edições, grátis com sua conta Google
      Histórico completo e artefatos para consulta e auditoria no plano Pro
    cta: "Ler grátis ou assinar por R$ 39/mês"
    formTitle: "Fale com o time antes de assinar"
---

# Briefing Diário BTC

Leitura operacional diária do mercado de Futuros BTC/USDT, entregue no WhatsApp
todo dia útil até as 07h (horário de Brasília) para assinantes Pro, e disponível
para leitura na área logada para qualquer conta Google. Consolida contexto,
cenários e um plano de voo em artefatos auditáveis.

Não é um sinal de trading. Não recomenda compra ou venda. Não aciona sistemas de
execução. É material de preparação operacional e governança para quem já opera e
quer contexto consolidado sem montar o próprio painel.
`,
  `---
title: "Daily BTC Briefing"
description: "Daily operational reading of the BTC/USDT Futures market, delivered on WhatsApp every business day by 07h. Context, scenarios, and a flight plan in auditable artifacts. Not a trading signal."
eyebrow: "RBX · MARKET INTELLIGENCE"
lead: "Daily operational reading of the BTC/USDT Futures market. Context, scenarios, and a flight plan, delivered on WhatsApp every business day."
landing:
  briefingBtc:
    metaTitle: "Daily BTC Briefing · Operational market context"
    metaDescription: "Daily operational reading of the BTC/USDT Futures market, on WhatsApp by 07h on business days. Context, scenarios, and a flight plan in auditable artifacts. Not a trading signal. Free in the logged-in area, Pro from $10/month."
    subtitle: "RBX · MARKET INTELLIGENCE"
    title: "The BTC market does not wait. By 07h, you have already read it."
    description: "Daily operational reading of the BTC/USDT Futures market. Context, scenarios, and a flight plan. Delivered on WhatsApp every business day, by 07h."
    benefits: |
      Six auditable artifacts per day: flight-plan, snapshot, model-output, manifest, sources, execution-log
      Delivered on WhatsApp by 07h (Brasília time), Monday to Friday, in English
      Public Binance USD-M APIs, read-only
      Context, scenarios, and a flight plan. Never a buy or sell signal
      Logged-in area with the day's edition and the latest editions, free with your Google account
      Full history and artifacts for review and audit on the Pro plan
    cta: "Read for free or subscribe from $10/month"
    formTitle: "Talk to the team before subscribing"
---

# Daily BTC Briefing

Daily operational reading of the BTC/USDT Futures market, delivered on WhatsApp
every business day by 07h (Brasília time) to Pro subscribers, and readable in the
logged-in area with any Google account. It consolidates context, scenarios, and
a flight plan into auditable artifacts.

It is not a trading signal. It does not recommend buying or selling. It does not
trigger execution systems. It is operational preparation and governance material
for those who already trade and want consolidated context without building their
own panel.
`
);

async function main() {
  // --only=<page> publishes a single page's locale objects (e.g. --only=legal)
  // instead of rewriting every site page, which would clobber content
  // published via CMS after this script's snapshot. The match is exact on the
  // page path segment; an empty or unmatched value aborts instead of falling
  // back to a bulk upload.
  const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
  let selected = pages;
  if (onlyArg) {
    const only = onlyArg.slice('--only='.length);
    if (!only) {
      console.error('usage: --only=<page-path> (e.g. --only=legal)');
      process.exit(1);
    }
    selected = pages.filter((page) => page.key.endsWith(`/${only}/index.md`));
    if (selected.length !== 2) {
      console.error(`--only=${only} matched ${selected.length} objects, expected 2 (pt-BR + en)`);
      process.exit(1);
    }
  }
  selected.forEach(validatePage);
  if (process.argv.includes('--validate-only')) {
    console.log(`validated ${selected.length} objects`);
    return;
  }
  for (const { key, body } of selected) {
    await put(key, body);
    console.log('uploaded', key);
  }
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
