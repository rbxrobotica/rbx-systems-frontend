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
      cvLabel: string;
      cvLink: string;
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
  footer: {
    description: string;
    sections: {
      services: string;
      company: string;
      contact: string;
    };
    links: {
      systems_web: string;
      automacao: string;
      ia_aplicada: string;
      infraestrutura: string;
      backend: string;
      manutencao: string;
      aboutUs: string;
      team: string;
      products: string;
    };
    copyright: string;
  };
};
