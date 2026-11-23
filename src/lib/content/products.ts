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
  secondaryLinks?: { href: string; label: string }[];
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
  externalTitle: string;
  externalReference: Product;
  additionalTitle: string;
  additionalLead: string;
  additionalProducts: Pick<
    Product,
    'id' | 'name' | 'description' | 'context' | 'href' | 'linkLabel'
  >[];
  platformEyebrow: string;
  platformTitle: string;
  platformLead: string;
  layers: { title: string; description: string; components: string }[];
  foundationLabel: string;
  foundation: string;
  sovereigntyTitle: string;
  sovereigntyLead: string;
  principles: { title: string; description: string }[];
  evolutionTitle: string;
  evolutionLead: string;
  evolutionCards: { title: string; description: string }[];
  evolutionNote: string;
  referencesTitle: string;
  referencesLead: string;
  references: { name: string; title: string; description: string; href?: string; label?: string }[];
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
    title: 'Produtos',
    description:
      'Produtos da Merovelis Sistemas: Strategos, Robson, Satwake / Briefing BTC, Verentir e Initelo, sobre uma plataforma própria de IA e infraestrutura.',
    eyebrow: 'Produtos',
    headline: 'Os produtos da Merovelis.',
    lead: 'A Merovelis Sistemas cria e opera produtos de software com IA. Cada um tem marca, endereço e estágio próprios, sobre a mesma base de engenharia: identidade, conteúdo, pagamentos e operação.',
    disciplines: ['Engenharia de produto', 'IA aplicada', 'Infraestrutura soberana'],
    featuredTitle: 'Produtos',
    featuredLead:
      'Logística, execução e risco, conteúdo por assinatura, avaliação de IA e educação. Cada produto tem seu próprio escopo e estágio de disponibilidade.',
    products: [
      {
        id: 'strategos',
        name: 'Strategos',
        category: 'Logística & operações críticas',
        context: 'Acesso antecipado',
        description:
          'Sala de situação para logística. Operações distantes da base dependem de mover pessoas e equipamentos por mar, ar e terra, com janelas curtas e pouca infraestrutura de apoio. O Strategos reúne os dados que a operação já tem e mostra custo, risco e capacidade no mesmo lugar, com cada decisão registrada.',
        capabilities: [
          'Custo, risco e capacidade',
          'Decisões com evidências',
          'Memória da operação'
        ],
        href: 'https://strategos.gr',
        linkLabel: 'Site do Strategos'
      },
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
        linkLabel: 'Sobre o Robson',
        secondaryLinks: [{ href: 'https://github.com/ldamasio/robson', label: 'Código-fonte' }]
      },
      {
        id: 'satwake',
        name: 'Satwake / Briefing BTC',
        category: 'Conteúdo por assinatura',
        context: 'Edições publicadas',
        description:
          'Leitura operacional do mercado BTC Futuros, com edições em área autenticada. O acesso por plano separa a leitura recente do histórico disponível e dos artefatos para download.',
        capabilities: ['Área de membros', 'Acesso por plano', 'Artefatos auditáveis'],
        note: 'Material de preparação operacional. Não é recomendação de investimento.',
        href: '/produtos/briefing-btc',
        linkLabel: 'Sobre o Satwake / Briefing BTC'
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
        id: 'initelo',
        name: 'Initelo',
        category: 'Educação',
        context: 'Primeira aula publicada',
        description:
          'Plataforma educacional. O primeiro curso é Finanças pessoais com IA, com uma aula aberta sobre como organizar o dinheiro do mês.',
        capabilities: ['Cursos', 'Aula aberta'],
        href: 'https://initelo.com',
        linkLabel: 'Site da Initelo'
      }
    ],
    externalTitle: 'Referência externa · Food Process',
    externalReference: {
      id: 'kulinaryos',
      name: 'Kulinaryos',
      category: 'Gestão gastronômica',
      context: 'Ecossistema Food Process',
      description:
        'Plataforma de gestão para cozinhas e restaurantes, de propriedade e operação da Food Process. Apresentada como referência externa de software gastronômico.',
      capabilities: ['Software de gestão', 'Operação de restaurantes'],

      href: 'https://kulinaryos.com',
      linkLabel: 'Site do Kulinaryos'
    },
    additionalTitle: 'Plataforma de IA',
    additionalLead: 'Dois produtos de plataforma controlam e avaliam as chamadas de IA dos demais.',
    additionalProducts: [
      {
        id: 'thalamus',
        name: 'Thalamus',
        context: 'Controle de IA',
        description: 'Controle de chamadas de IA com políticas, roteamento e auditoria.',
        href: '/blog/2026-07-29-governed-public-rag',
        linkLabel: 'Arquitetura no Journal'
      },
      {
        id: 'truthmetal',
        name: 'TruthMetal',
        context: 'Avaliação de IA',
        description: 'Datasets e critérios de referência para avaliações de IA.',
        href: '/blog/2026-07-29-governed-public-rag',
        linkLabel: 'Arquitetura no Journal'
      }
    ],
    platformEyebrow: 'Capacidade de implementação',
    platformTitle: 'Engenharia para plataformas de conteúdo pago.',
    platformLead:
      'Publicação, identidade e pagamentos compõem a arquitetura de uma plataforma de conteúdo pago. Na Engineering Partnership, o roadmap acordado define as integrações e responsabilidades de implementação.',
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
    sovereigntyTitle: 'Infraestrutura soberana. Decisões explícitas sobre os dados.',
    sovereigntyLead:
      'A arquitetura trata a soberania dos dados do usuário como requisito a definir: hospedagem, permissões, formatos de exportação e recuperação entram no roadmap e nos critérios de aceite da parceria.',
    principles: [
      {
        title: 'Controle da infraestrutura',
        description:
          'Definir quem opera a hospedagem e o armazenamento e quais serviços externos participam da solução.'
      },
      {
        title: 'Controle de acesso',
        description:
          'Projetar permissões e isolamento para que cada usuário acesse apenas o conteúdo autorizado.'
      },
      {
        title: 'Portabilidade planejada',
        description:
          'Definir formatos de exportação, retenção e recuperação antes da implementação, conforme os requisitos dos usuários.'
      }
    ],
    evolutionTitle: 'Blockchain, metaverso e IA',
    evolutionLead:
      'Frentes de evolução para plataformas de conteúdo na estratégia B2B da Merovelis. Cada uma pode integrar o roadmap da Engineering Partnership, conforme o modelo de negócio e os requisitos dos usuários.',
    evolutionCards: [
      {
        title: 'Blockchain e proveniência',
        description:
          'Registros verificáveis da origem e integridade do conteúdo, conectados à identidade e às regras de acesso. Conteúdo privado e dados pessoais permanecem fora da cadeia, com armazenamento e permissões próprios.'
      },
      {
        title: 'Metaverso e ambientes imersivos',
        description:
          'Espaços virtuais e experiências 3D para formação, eventos e comunidades, integrados à identidade e à assinatura da plataforma.'
      },
      {
        title: 'IA na experiência',
        description:
          'Assistentes contextuais, descoberta de conteúdo e interação por texto ou voz para personalizar a experiência, com consentimento, controle de acesso e avaliação de qualidade.'
      }
    ],
    evolutionNote:
      'A soberania dos dados depende do conjunto: armazenamento, gestão de chaves, permissões e portabilidade. Blockchain contribui com registros verificáveis; o escopo de cada integração é definido e validado na parceria.',
    referencesTitle: 'Referências de implementação',
    referencesLead:
      'O Portal e a área de membros orientam estas capacidades técnicas. As referências abaixo descrevem os mecanismos; a assinatura de conteúdo e a parceria de engenharia têm contratações próprias.',
    references: [
      {
        name: 'Portal Merovelis',
        title: 'Acompanhamento com acesso por projeto',
        description:
          'Módulos, riscos, roadmap e evidências em uma área autenticada. Cada pessoa acessa os projetos para os quais recebeu permissão.'
      },
      {
        name: 'Satwake / Briefing BTC',
        title: 'Conteúdo com acesso por assinatura',
        description:
          'Edições, histórico disponível e artefatos reunidos em uma área de membros. A apresentação pública descreve os planos e o acesso ao conteúdo.',
        href: '/produtos/briefing-btc',
        label: 'Apresentação pública e planos'
      },
      {
        name: 'Merovelis Journal',
        title: 'Publicação e distribuição sob controle',
        description:
          'O próprio Journal usa a camada de conteúdo da Merovelis para publicar artigos e distribuí-los por RSS. O relato técnico público descreve esse fluxo.',
        href: '/blog/2026-08-02-rbx-journal-rss',
        label: 'Ler o relato de implementação'
      }
    ],
    collaborationTitle: 'Merovelis Engineering Partnership',
    collaborationLead:
      'Parceria continuada de engenharia de produto, com roadmap, responsabilidades e critérios de aceite acordados. Arquitetura, implementação e operação entram no escopo conforme o contexto.',
    contactLabel: 'Conhecer a parceria de engenharia',
    contactHref: '/parceria',
    legalLabel: 'Aviso legal e condições de uso',
    financialNote:
      'Este briefing é material de preparação operacional e governança. Não constitui recomendação de investimento, sinal de trading ou orientação financeira. A decisão de operar é exclusiva do operador humano. Este produto não gera ordens, não recomenda compra/venda e não aciona sistemas de execução.'
  },
  en: {
    title: 'Products',
    description:
      'Merovelis Systems products: Strategos, Robson, Satwake / Briefing BTC, Verentir and Initelo, on our own AI platform and infrastructure.',
    eyebrow: 'Products',
    headline: 'The Merovelis products.',
    lead: 'Merovelis Systems builds and operates AI software products. Each has its own brand, address and stage, on the same engineering base: identity, content, payments and operations.',
    disciplines: ['Product engineering', 'Applied AI', 'Sovereign infrastructure'],
    featuredTitle: 'Products',
    featuredLead:
      'Logistics, execution and risk, subscription content, AI evaluation and education. Each product has its own scope and availability stage.',
    products: [
      {
        id: 'strategos',
        name: 'Strategos',
        category: 'Logistics & critical operations',
        context: 'Early access',
        description:
          'A situation room for logistics. Operations far from their base depend on moving people and equipment by sea, air and land, with short windows and little supporting infrastructure. Strategos brings together the data the operation already holds and shows cost, risk and capacity in one place, with every decision recorded.',
        capabilities: ['Cost, risk and capacity', 'Evidence-based decisions', 'Operational memory'],
        href: 'https://strategos.gr',
        linkLabel: 'Strategos website'
      },
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
        linkLabel: 'About Robson',
        secondaryLinks: [{ href: 'https://github.com/ldamasio/robson', label: 'Source code' }]
      },
      {
        id: 'satwake',
        name: 'Satwake / Briefing BTC',
        category: 'Subscription content',
        context: 'Published editions',
        description:
          'Operational reading of the BTC Futures market, with editions in an authenticated area. Plan-based access separates recent reading from available history and downloadable artifacts.',
        capabilities: ['Member area', 'Plan-based access', 'Auditable artifacts'],
        note: 'Operational preparation material. Not investment advice.',
        href: '/products/briefing-btc',
        linkLabel: 'About Satwake / Briefing BTC'
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
        id: 'initelo',
        name: 'Initelo',
        category: 'Education',
        context: 'First lesson published',
        description:
          'An education platform. Its first course is Personal finance with AI, taught in Portuguese, with an open lesson on organizing the month’s money.',
        capabilities: ['Courses', 'Open lesson'],
        href: 'https://initelo.com',
        linkLabel: 'Initelo website'
      }
    ],
    externalTitle: 'External reference · Food Process',
    externalReference: {
      id: 'kulinaryos',
      name: 'Kulinaryos',
      category: 'Restaurant management',
      context: 'Food Process ecosystem',
      description:
        'A management platform for kitchens and restaurants, owned and operated by Food Process. Presented as an external reference for restaurant software.',
      capabilities: ['Management software', 'Restaurant operations'],

      href: 'https://kulinaryos.com',
      linkLabel: 'Kulinaryos website'
    },
    additionalTitle: 'AI platform',
    additionalLead: 'Two platform products control and evaluate the AI calls of the others.',
    additionalProducts: [
      {
        id: 'thalamus',
        name: 'Thalamus',
        context: 'AI control',
        description: 'Control of AI calls through policies, routing and audit.',
        href: '/blog/2026-07-29-governed-public-rag',
        linkLabel: 'Architecture in the Journal'
      },
      {
        id: 'truthmetal',
        name: 'TruthMetal',
        context: 'AI evaluation',
        description: 'Reference datasets and criteria for AI evaluations.',
        href: '/blog/2026-07-29-governed-public-rag',
        linkLabel: 'Architecture in the Journal'
      }
    ],
    platformEyebrow: 'Implementation capabilities',
    platformTitle: 'Engineering for paid content platforms.',
    platformLead:
      'Publishing, identity and payments form the architecture of a paid content platform. Within the Engineering Partnership, the agreed roadmap defines the integrations and implementation responsibilities.',
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
    sovereigntyTitle: 'Sovereign infrastructure. Explicit decisions about data.',
    sovereigntyLead:
      'The architecture treats user data sovereignty as a requirement to define: hosting, permissions, export formats and recovery become part of the partnership roadmap and acceptance criteria.',
    principles: [
      {
        title: 'Infrastructure control',
        description:
          'Define who operates hosting and storage and which external services participate in the solution.'
      },
      {
        title: 'Access control',
        description:
          'Design permissions and isolation so each user can access only authorized content.'
      },
      {
        title: 'Planned portability',
        description:
          'Define export formats, retention and recovery before implementation, according to user requirements.'
      }
    ],
    evolutionTitle: 'Blockchain, metaverse and AI',
    evolutionLead:
      'Development paths for content platforms within the Merovelis B2B strategy. Each can enter the Engineering Partnership roadmap according to the business model and user requirements.',
    evolutionCards: [
      {
        title: 'Blockchain and provenance',
        description:
          'Verifiable records of content origin and integrity, connected to identity and access rules. Private content and personal data remain off-chain, with their own storage and permissions.'
      },
      {
        title: 'Metaverse and immersive environments',
        description:
          'Virtual spaces and 3D experiences for learning, events and communities, integrated with the platform’s identity and subscription system.'
      },
      {
        title: 'AI in the experience',
        description:
          'Contextual assistants, content discovery and text or voice interaction to personalize the experience, with consent, access control and quality evaluation.'
      }
    ],
    evolutionNote:
      'Data sovereignty depends on the whole system: storage, key management, permissions and portability. Blockchain contributes verifiable records; the scope of each integration is defined and validated within the partnership.',
    referencesTitle: 'Implementation references',
    referencesLead:
      'The Portal and member area inform these technical capabilities. The references below describe the mechanisms; the content subscription and engineering partnership are separate engagements.',
    references: [
      {
        name: 'Merovelis Portal',
        title: 'Project tracking with controlled access',
        description:
          'Modules, risks, roadmaps and evidence in an authenticated area. Each person can access the projects for which they have permission.'
      },
      {
        name: 'Satwake / Briefing BTC',
        title: 'Content with subscription access',
        description:
          'Editions, available history and artifacts in a member area. The public presentation describes plans and content access.',
        href: '/products/briefing-btc',
        label: 'Public presentation and plans'
      },
      {
        name: 'Merovelis Journal',
        title: 'Controlled publishing and distribution',
        description:
          'The Journal itself uses the Merovelis content layer to publish articles and distribute them through RSS. The public technical report describes this flow.',
        href: '/blog/2026-08-02-rbx-journal-rss',
        label: 'Read the implementation report'
      }
    ],
    collaborationTitle: 'Merovelis Engineering Partnership',
    collaborationLead:
      'An ongoing product engineering partnership, with an agreed roadmap, responsibilities and acceptance criteria. Architecture, implementation and operations enter the scope according to the context.',
    contactLabel: 'Explore the engineering partnership',
    contactHref: '/partnership',
    legalLabel: 'Legal notice and terms of use',
    financialNote:
      'This briefing is operational preparation and governance material. It does not constitute investment advice, a trading signal or financial guidance. The decision to trade belongs exclusively to the human operator. This product does not generate orders, does not recommend buying or selling and does not trigger execution systems.'
  }
};
