import type { Locale } from '$types/content';

interface Product {
  id: string;
  name: string;
  category: string;
  context: string;
  description: string;
  capabilities: string[];
  note?: string;
  href?: string;
  linkLabel?: string;
}

interface ProductsContent {
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  lead: string;
  disciplines: string[];
  featuredTitle: string;
  featuredLead: string;
  products: Product[];
  platformEyebrow: string;
  platformTitle: string;
  platformLead: string;
  layers: { title: string; description: string; components: string }[];
  foundationLabel: string;
  foundation: string;
  sovereigntyTitle: string;
  sovereigntyLead: string;
  principles: { title: string; description: string }[];
  referencesTitle: string;
  referencesLead: string;
  references: { name: string; title: string; description: string; href: string; label: string }[];
  collaborationTitle: string;
  collaborationLead: string;
  contactLabel: string;
  contactHref: string;
  legalLabel: string;
  financialNote: string;
}

// Curated institutional portfolio. Evidence and publication boundaries:
// docs/products-portfolio.md. Keep capabilities distinct from release promises.
export const productsContent: Record<Locale, ProductsContent> = {
  'pt-BR': {
    title: 'Produtos e plataformas',
    description:
      'Robson, Strategos, Verentir, Satwake e o ecossistema Kulinaryos. Engenharia de produtos, plataformas de conteúdo pago e infraestrutura com soberania dos dados.',
    eyebrow: 'Produtos & ecossistema',
    headline: 'Da infraestrutura à experiência de quem usa.',
    lead: 'Construímos produtos e a base que os sustenta: identidade, conteúdo, pagamentos e operação. Este portfólio reúne sistemas da RBX e projetos do nosso ecossistema.',
    disciplines: ['Engenharia de produto', 'IA aplicada', 'Infraestrutura soberana'],
    featuredTitle: 'Projetos em destaque',
    featuredLead:
      'Aplicações em execução financeira, decisão estratégica, avaliação de IA, conteúdo por assinatura e gestão gastronômica.',
    products: [
      {
        id: 'robson',
        name: 'Robson',
        category: 'Execução & risco',
        context: 'Open source',
        description:
          'Motor de execução e gestão de risco para mercados de cripto. Reúne execução determinística, controles de risco e uma trilha de eventos para auditoria.',
        capabilities: ['Execução determinística', 'Rastreabilidade'],
        note: 'Não é autotrader, não prevê preços e não gera sinais. Operar cripto envolve risco de perda.',
        href: '/produtos/robson',
        linkLabel: 'Sobre o Robson'
      },
      {
        id: 'strategos',
        name: 'Strategos',
        category: 'Decisão estratégica',
        context: 'Acesso antecipado',
        description:
          'Sala de situação para organizar contexto, evidências e decisões. A análise assistida por IA preserva a memória estratégica e a responsabilidade humana.',
        capabilities: ['Memória estratégica', 'Decisões com evidências'],
        href: 'https://strategos.gr',
        linkLabel: 'Site do Strategos'
      },
      {
        id: 'verentir',
        name: 'Verentir',
        category: 'Qualidade de IA',
        context: 'Em desenvolvimento',
        description:
          'Camada de medição e julgamento para sistemas de IA. Organiza avaliações e relatórios de qualidade para apoiar revisão humana e a evolução dos assistentes.',
        capabilities: ['Avaliação de respostas', 'Revisão humana']
      },
      {
        id: 'satwake',
        name: 'Satwake',
        category: 'Conteúdo por assinatura',
        context: 'Evolução do Briefing BTC',
        description:
          'Leitura operacional do mercado BTC Futuros, com edições em área autenticada. O acesso por plano separa a leitura recente do histórico disponível e dos artefatos para download.',
        capabilities: ['Área de membros', 'Acesso por plano', 'Artefatos verificáveis'],
        note: 'Material de preparação operacional. Não é recomendação de investimento.',
        href: '/produtos/briefing-btc',
        linkLabel: 'Sobre o Satwake / Briefing BTC'
      },
      {
        id: 'kulinaryos',
        name: 'Kulinaryos',
        category: 'Gestão gastronômica',
        context: 'Ecossistema Food Process',
        description:
          'Plataforma de gestão para operações de cozinha e restaurantes. Integra este portfólio como referência de atuação do fundador da RBX no ecossistema de software gastronômico.',
        capabilities: ['Software de gestão', 'Operação de restaurantes'],
        note: 'Produto de propriedade e operação da Food Process.',
        href: 'https://kulinaryos.com',
        linkLabel: 'Site do Kulinaryos'
      }
    ],
    platformEyebrow: 'Capacidade de implementação',
    platformTitle: 'Conteúdo pago. Dados sob seu controle.',
    platformLead:
      'Implementamos a plataforma e a infraestrutura para publicar conteúdo, gerir assinaturas e entregar acesso reservado. As capacidades de identidade, pagamento e publicação da RBX formam a base para um projeto sob medida.',
    layers: [
      {
        title: 'Publicar',
        description: 'Conteúdo organizado em um CMS, com arquivos em armazenamento privado.',
        components: 'Acervo · Edições · Arquivos'
      },
      {
        title: 'Gerir o acesso',
        description: 'Identidade, planos e pagamentos conectados às permissões de cada usuário.',
        components: 'Conta · Assinatura · Permissões'
      },
      {
        title: 'Entregar',
        description: 'Área de membros com leitura e downloads autorizados no servidor.',
        components: 'Portal · Histórico · Downloads'
      }
    ],
    foundationLabel: 'Infraestrutura da plataforma',
    foundation: 'Identidade · Armazenamento · APIs · Deploy · Observabilidade',
    sovereigntyTitle: 'Soberania entra na arquitetura.',
    sovereigntyLead:
      'Em cada implementação, definimos como o negócio e seus usuários controlam os dados: onde ficam, quem acessa e como podem ser recuperados ou transferidos.',
    principles: [
      {
        title: 'Controle da infraestrutura',
        description:
          'Hospedagem e armazenamento sob a governança do projeto, com limites claros para serviços externos.'
      },
      {
        title: 'Controle de acesso',
        description:
          'Conteúdo privado protegido por identidade e permissões, com separação entre usuários e projetos.'
      },
      {
        title: 'Portabilidade planejada',
        description:
          'Formatos de exportação, retenção e recuperação definidos no escopo, para preservar a autonomia sobre o acervo.'
      }
    ],
    referencesTitle: 'A experiência por trás da plataforma',
    referencesLead:
      'O Portal RBX e a área de conteúdo do ecossistema Merovelis mostram duas aplicações dessas capacidades.',
    references: [
      {
        name: 'Portal RBX',
        title: 'Acompanhamento com acesso por projeto',
        description:
          'Módulos, riscos, roadmap e evidências em uma área autenticada. Cada pessoa acessa os projetos para os quais recebeu permissão.',
        href: 'https://portal.rbx.ia.br',
        label: 'Portal RBX · acesso autenticado'
      },
      {
        name: 'Satwake no ecossistema Merovelis',
        title: 'Conteúdo com acesso por assinatura',
        description:
          'Edições, histórico disponível e artefatos reunidos em uma área de membros. Uma referência concreta para a experiência de uma plataforma de conteúdo pago.',
        href: 'https://app.merovelis.com/briefing-btc',
        label: 'Área de membros · acesso autenticado'
      }
    ],
    collaborationTitle: 'Um produto próprio, com a base técnica para operar.',
    collaborationLead:
      'Para criadores, empresas e parceiros de distribuição, conectamos a experiência do público à plataforma que sustenta o negócio.',
    contactLabel: 'Conversar sobre um projeto',
    contactHref: '/contato',
    legalLabel: 'Aviso legal e condições de uso',
    financialNote:
      'Este briefing é material de preparação operacional e governança. Não constitui recomendação de investimento, sinal de trading ou orientação financeira. A decisão de operar é exclusiva do operador humano. Este produto não gera ordens, não recomenda compra/venda e não aciona sistemas de execução.'
  },
  en: {
    title: 'Products and platforms',
    description:
      'Robson, Strategos, Verentir, Satwake and the Kulinaryos ecosystem. Product engineering, paid content platforms and infrastructure with data sovereignty.',
    eyebrow: 'Products & ecosystem',
    headline: 'From infrastructure to the user experience.',
    lead: 'We build products and the foundations behind them: identity, content, payments and operations. This portfolio brings together RBX systems and projects from our ecosystem.',
    disciplines: ['Product engineering', 'Applied AI', 'Sovereign infrastructure'],
    featuredTitle: 'Featured projects',
    featuredLead:
      'Applications in financial execution, strategic decisions, AI evaluation, subscription content and restaurant management.',
    products: [
      {
        id: 'robson',
        name: 'Robson',
        category: 'Execution & risk',
        context: 'Open source',
        description:
          'An execution and risk management engine for crypto markets. It combines deterministic execution, risk controls and an event trail for auditing.',
        capabilities: ['Deterministic execution', 'Traceability'],
        note: 'It is not an autotrader, does not predict prices and does not generate signals. Crypto trading involves risk of loss.',
        href: '/products/robson',
        linkLabel: 'About Robson'
      },
      {
        id: 'strategos',
        name: 'Strategos',
        category: 'Strategic decisions',
        context: 'Early access',
        description:
          'A situation room for context, evidence and decisions. AI-assisted analysis preserves strategic memory and human accountability.',
        capabilities: ['Strategic memory', 'Evidence-based decisions'],
        href: 'https://strategos.gr',
        linkLabel: 'Strategos website'
      },
      {
        id: 'verentir',
        name: 'Verentir',
        category: 'AI quality',
        context: 'In development',
        description:
          'A measurement and judgment layer for AI systems. It organizes evaluations and quality reports to support human review and the development of assistants.',
        capabilities: ['Response evaluation', 'Human review']
      },
      {
        id: 'satwake',
        name: 'Satwake',
        category: 'Subscription content',
        context: 'The evolution of Briefing BTC',
        description:
          'Operational reading of the BTC Futures market, with editions in an authenticated area. Plan-based access separates recent reading from available history and downloadable artifacts.',
        capabilities: ['Member area', 'Plan-based access', 'Verifiable artifacts'],
        note: 'Operational preparation material. Not investment advice.',
        href: '/products/briefing-btc',
        linkLabel: 'About Satwake / Briefing BTC'
      },
      {
        id: 'kulinaryos',
        name: 'Kulinaryos',
        category: 'Restaurant management',
        context: 'Food Process ecosystem',
        description:
          'A management platform for kitchens and restaurants. It appears in this portfolio as a reference to the RBX founder’s work in the restaurant software ecosystem.',
        capabilities: ['Management software', 'Restaurant operations'],
        note: 'A product owned and operated by Food Process.',
        href: 'https://kulinaryos.com',
        linkLabel: 'Kulinaryos website'
      }
    ],
    platformEyebrow: 'Implementation capabilities',
    platformTitle: 'Paid content. Data under your control.',
    platformLead:
      'We implement the platform and infrastructure to publish content, manage subscriptions and deliver restricted access. RBX’s identity, payment and publishing capabilities provide the foundation for a tailored project.',
    layers: [
      {
        title: 'Publish',
        description: 'Content organized in a CMS, with files held in private storage.',
        components: 'Collection · Editions · Files'
      },
      {
        title: 'Manage access',
        description: 'Identity, plans and payments connected to each user’s permissions.',
        components: 'Account · Subscription · Permissions'
      },
      {
        title: 'Deliver',
        description: 'A member area with reading and downloads authorized on the server.',
        components: 'Portal · History · Downloads'
      }
    ],
    foundationLabel: 'Platform infrastructure',
    foundation: 'Identity · Storage · APIs · Deployment · Observability',
    sovereigntyTitle: 'Sovereignty starts with the architecture.',
    sovereigntyLead:
      'In each implementation, we define how the business and its users control their data: where it lives, who can access it and how it can be recovered or transferred.',
    principles: [
      {
        title: 'Infrastructure control',
        description:
          'Hosting and storage under the project’s governance, with clear boundaries for external services.'
      },
      {
        title: 'Access control',
        description:
          'Private content protected by identity and permissions, with separation between users and projects.'
      },
      {
        title: 'Planned portability',
        description:
          'Export formats, retention and recovery defined in the scope to preserve control over the content collection.'
      }
    ],
    referencesTitle: 'The experience behind the platform',
    referencesLead:
      'The RBX Portal and the Merovelis ecosystem’s content area illustrate two applications of these capabilities.',
    references: [
      {
        name: 'RBX Portal',
        title: 'Project tracking with controlled access',
        description:
          'Modules, risks, roadmaps and evidence in an authenticated area. Each person can access the projects for which they have permission.',
        href: 'https://portal.rbxsystems.ch',
        label: 'RBX Portal · authenticated access'
      },
      {
        name: 'Satwake in the Merovelis ecosystem',
        title: 'Content with subscription access',
        description:
          'Editions, available history and artifacts in a member area. A concrete reference for the experience of a paid content platform.',
        href: 'https://app.merovelis.com/briefing-btc',
        label: 'Member area · authenticated access'
      }
    ],
    collaborationTitle: 'Your own product, with the technical foundation to operate.',
    collaborationLead:
      'For creators, businesses and distribution partners, we connect the audience experience to the platform behind the business.',
    contactLabel: 'Discuss a project',
    contactHref: '/contact',
    legalLabel: 'Legal notice and terms of use',
    financialNote:
      'This briefing is operational preparation and governance material. It does not constitute investment advice, a trading signal, or financial guidance. The decision to trade belongs exclusively to the human operator. This product does not generate orders, does not recommend buying or selling, and does not trigger execution systems.'
  }
};
