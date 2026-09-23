/**
 * Journal tag taxonomy.
 * Post frontmatter tags are free-form and differ across locales (e.g.
 * 'engineering' vs 'engenharia'). Tag pages and internal links use a single
 * canonical ASCII slug per concept; this module is the declarative mapping.
 */

/** Lowercase, strip diacritics, trim. */
export function normalizeTag(tag: string): string {
  return tag
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Normalized alias → canonical slug. Canonical slugs are lowercase ASCII and
 * English-leaning; tags absent from this map are already canonical.
 * Covers every tag present in the published Journal frontmatter.
 */
const TAG_ALIASES: Record<string, string> = {
  engenharia: 'engineering',
  'engenharia-de-ia': 'ai-engineering',
  ia: 'ai',
  risco: 'risk',
  confiabilidade: 'reliability',
  resiliencia: 'resilience',
  agentes: 'agents',
  governanca: 'governance',
  arquitetura: 'architecture',
  execucao: 'execution',
  validacao: 'validation',
  depuracao: 'debugging',
  dados: 'data',
  qualidade: 'quality',
  auditoria: 'audit',
  observabilidade: 'observability',
  infraestrutura: 'infrastructure',
  infra: 'infrastructure',
  pagamentos: 'payments',
  soberania: 'sovereignty',
  economia: 'economics',
  inovacao: 'innovation',
  estrategia: 'strategy',
  consultoria: 'consulting',
  produto: 'product',
  politica: 'policy',
  processo: 'process',
  'sistemas-distribuidos': 'distributed-systems',
  'codigo-aberto': 'open-source'
};

export function canonicalTag(tag: string): string {
  const normalized = normalizeTag(tag);
  return TAG_ALIASES[normalized] ?? normalized;
}

export function postHasTag(tags: string[], tag: string): boolean {
  const canonical = canonicalTag(tag);
  return tags.some((candidate) => canonicalTag(candidate) === canonical);
}

/** Distinct canonical tags present in a post list, sorted ascending. */
export function collectCanonicalTags(posts: { tags: string[] }[]): string[] {
  const set = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) set.add(canonicalTag(tag));
  }
  return [...set].sort();
}
