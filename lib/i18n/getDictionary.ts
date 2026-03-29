import 'server-only';

export type Locale = 'pt-BR' | 'en';

const dictionaries: Record<Locale, () => Promise<Record<string, unknown>>> = {
  'pt-BR': () =>
    import('./dictionaries/pt-BR.json').then((module) => module.default),
  'en': () =>
    import('./dictionaries/en.json').then((module) => module.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]?.() ?? dictionaries['pt-BR']();
}
