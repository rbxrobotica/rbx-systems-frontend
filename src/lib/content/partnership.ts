import type { Locale } from '$types/content';

// Commercial terms approved by the operator on 2026-10-05.
// Capacity is a planning limit, not a live count of available places.
export const partnershipTerms = {
  monthlyPriceBRL: 8000,
  monthlyHours: 16,
  initialPartners: 2,
  maxPartners: 3,
  version: '2026-10-05'
} as const;

export function formatPartnershipPrice(locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(partnershipTerms.monthlyPriceBRL);
}

export const partnershipContent = {
  'pt-BR': {
    title: 'Parceria mensal de engenharia',
    description: `Parceria RBX de engenharia de produto por ${formatPartnershipPrice('pt-BR')}/mês, com ${partnershipTerms.monthlyHours} horas mensais de capacidade técnica e qualificação assíncrona. Conheça o escopo e as condições.`,
    eyebrow: 'RBX Engineering Partnership',
    headline: 'Parceria mensal de engenharia para evoluir seu produto.',
    lead: 'Engenharia de produto com direção técnica, execução assistida por IA e entregas verificáveis. Uma parceria mensal para evoluir software com prioridades e responsabilidades claras.',
    priceLabel: 'Parceria mensal',
    period: '/mês',
    currency: 'Valor em reais (BRL).',
    capacity: 'horas mensais de atuação técnica',
    capacityDetail:
      'Implementação, revisão, testes, comunicação e acompanhamento fazem parte dessa capacidade.',
    intake: `Entrada inicial limitada a ${partnershipTerms.initialPartners} parcerias. A data de início é confirmada após a avaliação de aderência e disponibilidade.`,
    cta: 'Verificar aderência e disponibilidade',
    ctaNote: 'Comece por escrito. Uma reunião inicial não é requisito para enviar seu contexto.',
    portfolioLabel: 'Explorar produtos e evidências',
    portfolioHref: '/produtos#evidencias',
    fitTitle: 'Para quem precisa evoluir um produto.',
    fitLead:
      'Organizações com um produto em operação ou piloto avançado, um objetivo concreto e alguém responsável por priorizar e validar o trabalho.',
    fitCards: [
      {
        title: 'Evolução de produto',
        description:
          'Destravar uma integração, melhorar um fluxo ou desenvolver a próxima etapa de uma plataforma.'
      },
      {
        title: 'Continuidade técnica',
        description:
          'Organizar decisões de arquitetura, reduzir dívida técnica e tornar a manutenção mais previsível.'
      },
      {
        title: 'Plataformas de conteúdo',
        description:
          'Conectar publicação, identidade, acesso pago e controle dos dados em um roadmap dimensionado por ciclo.'
      },
      {
        title: 'Produtos conectados e embarcados',
        description:
          'Avaliamos demandas de software embarcado e integração de dispositivos com APIs e plataformas, conforme o escopo e a disponibilidade técnica.'
      }
    ],
    scopeTitle: 'Um compromisso delimitado a cada ciclo.',
    includedTitle: 'Dentro da parceria',
    included: [
      'Um produto acompanhado, com uma frente de trabalho prioritária por vez.',
      'Objetivos, prioridades e critérios de aceite acordados antes da execução.',
      'Implementação assistida por IA, revisão humana, testes e registro das decisões relevantes.',
      'Atualização assíncrona sobre entregas, riscos e próximos passos.'
    ],
    boundariesTitle: 'Condições de trabalho',
    boundaries: [
      'O volume de entregas depende da complexidade. Demandas maiores são divididas entre ciclos.',
      'Infraestrutura, licenças e APIs do produto têm orçamento separado, acordado antes do consumo.',
      'As ferramentas usadas pela RBX para executar o trabalho integram o custo da parceria.',
      'Atendimento em horários acordados. Plantão 24 horas e resposta imediata não fazem parte desta modalidade.'
    ],
    sovereigntyTitle: 'Continuidade também significa controle.',
    sovereignty:
      'Repositórios, ambientes e contas sob controle do cliente sempre que aplicável, com acessos autorizados e documentação para continuidade. A proposta explicita propriedade intelectual, responsabilidades, portabilidade e condições de encerramento.',
    processTitle: 'Qualificação assíncrona, contexto primeiro.',
    steps: [
      {
        title: 'Compartilhe o contexto',
        description:
          'Conte qual produto precisa evoluir, a prioridade e o horizonte de início. O preço e a capacidade já estão visíveis.'
      },
      {
        title: 'A RBX verifica a aderência',
        description:
          'Analisamos o escopo e a disponibilidade. Eventuais perguntas seguem por e-mail; uma conversa acontece quando ajudar a resolver uma dúvida.'
      },
      {
        title: 'Receba uma proposta clara',
        description:
          'Se houver aderência à modalidade, a mensalidade apresentada é mantida. Escopo, início e condições são confirmados antes da contratação.'
      }
    ],
    processNote:
      'O envio solicita uma avaliação. Não efetua cobrança, reserva uma vaga ou inicia a execução. Necessidades fora desta capacidade são discutidas antes de qualquer compromisso.',
    qualificationTitle: 'Conte o que precisa evoluir.',
    qualificationLead:
      'Um breve contexto é suficiente para começar. A resposta segue por e-mail, sem agendamento obrigatório.'
  },
  en: {
    title: 'Monthly engineering partnership',
    description: `RBX product engineering partnership at ${formatPartnershipPrice('en')}/month, with ${partnershipTerms.monthlyHours} monthly hours of technical capacity and asynchronous qualification. Explore scope and terms.`,
    eyebrow: 'RBX Engineering Partnership',
    headline: 'Monthly engineering partnership to evolve your product.',
    lead: 'Product engineering with technical direction, AI-assisted execution and verifiable delivery. A monthly partnership to evolve software with clear priorities and responsibilities.',
    priceLabel: 'Monthly partnership',
    period: '/month',
    currency: 'Priced in Brazilian reais (BRL).',
    capacity: 'monthly hours of technical work',
    capacityDetail:
      'Implementation, review, testing, communication and follow-up all use this capacity.',
    intake: `Initial intake is limited to ${partnershipTerms.initialPartners} partnerships. A start date is confirmed after reviewing fit and availability.`,
    cta: 'Check fit and availability',
    ctaNote: 'Start in writing. An introductory meeting is not required to share your context.',
    portfolioLabel: 'Explore products and implementation evidence',
    portfolioHref: '/products#evidencias',
    fitTitle: 'For organisations evolving an existing product.',
    fitLead:
      'A product in operation or an advanced pilot, a concrete objective and someone responsible for prioritising and accepting the work.',
    fitCards: [
      {
        title: 'Product evolution',
        description:
          'Unblock an integration, improve a workflow or build the next stage of a platform.'
      },
      {
        title: 'Technical continuity',
        description:
          'Structure architecture decisions, reduce technical debt and make maintenance more predictable.'
      },
      {
        title: 'Content platforms',
        description:
          'Connect publishing, identity, paid access and data control through a roadmap sized to each cycle.'
      },
      {
        title: 'Connected products and embedded software',
        description:
          'We assess embedded software needs and device integration with APIs and platforms, subject to scope review and engineering availability.'
      }
    ],
    scopeTitle: 'A bounded commitment for each cycle.',
    includedTitle: 'Within the partnership',
    included: [
      'One product, with one prioritised workstream at a time.',
      'Objectives, priorities and acceptance criteria agreed before execution.',
      'AI-assisted implementation, human review, testing and records of significant decisions.',
      'Asynchronous updates on deliveries, risks and next steps.'
    ],
    boundariesTitle: 'Working terms',
    boundaries: [
      'Delivery volume depends on complexity. Larger requests are divided across cycles.',
      'Product infrastructure, licences and APIs have a separate budget agreed before use.',
      'The tools RBX uses to perform the work are included in the partnership cost.',
      'Support during agreed hours. Round-the-clock on-call support and immediate response are outside this plan.'
    ],
    sovereigntyTitle: 'Continuity also means control.',
    sovereignty:
      'Repositories, environments and accounts under the client’s control where applicable, with authorised access and continuity documentation. The proposal sets out intellectual property, responsibilities, portability and termination terms.',
    processTitle: 'Asynchronous qualification, context first.',
    steps: [
      {
        title: 'Share the context',
        description:
          'Describe the product, priority and intended start. Price and capacity are already visible.'
      },
      {
        title: 'RBX reviews fit',
        description:
          'We assess scope and availability. Follow-up questions go by email; a conversation happens when it helps resolve an open question.'
      },
      {
        title: 'Receive a clear proposal',
        description:
          'When the request fits this plan, the displayed monthly price applies. Scope, start date and terms are confirmed before engagement.'
      }
    ],
    processNote:
      'Submitting requests an assessment. It does not charge you, reserve capacity or start execution. Requirements outside this capacity are discussed before any commitment.',
    qualificationTitle: 'Tell us what needs to evolve.',
    qualificationLead:
      'A brief context is enough to start. We reply by email, with no mandatory scheduling.'
  }
} satisfies Record<Locale, unknown>;
