export type NavItem = {
  id: number;
  href: string;
  title: string;
  description: string;
  isHighlight?: boolean;
};

export type ServiceItem = {
  id: number;
  title: string;
  href: string;
  description: string;
};

export type CardItem = {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  description: string;
};

export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    aboutUs: string;
    services: string;
    products: string;
    solutions: string;
    journal: string;
    blog: string;
    contact: string;
    atelier: string;
    learnMore: string;
    close: string;
    mode: string;
    menu: string;
    navigation: string;
    subtitle: string;
  };
  theme: {
    srOnly: string;
    light: string;
    dark: string;
    system: string;
  };
  aboutUsMenu: NavItem[];
  servicesMenu: NavItem[];
  blogEcontatoMenu: NavItem[];
  atelierMenu: NavItem;
  hero: {
    headline: string;
    body: string;
    ctaServices: string;
    ctaProducts: string;
  };
  about: {
    heading: string;
    mission: string;
    positioning: string;
    positioningBody: string;
    howWeOperate: string;
    howWeOperateBody: string;
    cards: {
      title: string;
      description: string;
    }[];
    teamSection: {
      heading: string;
      body: string;
    };
    joinTeam: {
      label: string;
      heading: string;
      body: string;
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      role: string;
      rolePlaceholder: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      success: string;
      sendAnother: string;
      error: string;
      metaLocation: string;
      metaMode: string;
      metaStack: string;
    };
  };
  services: {
    pageTitle: string;
    pageSubtitle: string;
    ctaHeading: string;
    ctaBody: string;
    ctaButton: string;
    items: ServiceItem[];
  };
  products: {
    badge: string;
    heading: string;
    body: string;
    phases: {
      seed: string;
      structuring: string;
      expansion: string;
      institutionalized: string;
    };
    types: {
      api: string;
      fullstack: string;
      webStatic: string;
      agent: string;
      cli: string;
    };
    contribute: {
      heading: string;
      body: string;
      cta: string;
    };
  };
  atelier: {
    footerNote: string;
  };
  blog: {
    heading: string;
    tagline: string;
    empty: string;
    backLabel: string;
  };
  journal: {
    heading: string;
    tagline: string;
    body: string;
    empty: string;
    backLabel: string;
  };
  solutions: {
    heading: string;
    tagline: string;
    body: string;
  };
  changelog: {
    heading: string;
    tagline: string;
    body: string;
  };
  cases: {
    heading: string;
    tagline: string;
    body: string;
    typePublic: string;
    typeFieldNote: string;
    typeInternal: string;
  };
  newsroom: {
    heading: string;
    tagline: string;
    body: string;
    boilerplateTitle: string;
    factsTitle: string;
    contactTitle: string;
    pressKitTitle: string;
    announcementsTitle: string;
  };
  trust: {
    heading: string;
    tagline: string;
    body: string;
  };
  footer: {
    description: string;
    sections: {
      company: string;
      resources: string;
      contact: string;
    };
    links: {
      aboutUs: string;
      team: string;
      products: string;
      journal: string;
      changelog: string;
      cases: string;
      newsroom: string;
      trust: string;
      status: string;
      legal: string;
      github: string;
      linkedin: string;
    };
    copyright: string;
  };
  contact: {
    heading: string;
    body: string;
    form: {
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      message: string;
      messagePlaceholder: string;
      whatsappOptIn: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
    };
    emailLabel: string;
    whatsappLabel: string;
    whatsappCta: string;
  };
};
