<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import Seo from '$components/Seo.svelte';
  import { buildGraph } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { Locale, PageContent } from '$types/content';

  interface Props {
    page: PageContent | null;
    locale: Locale;
  }

  let { page, locale }: Props = $props();

  const title = $derived(page?.title || t(locale, 'team.headline'));
  const description = $derived(page?.description ?? t(locale, 'team.body') ?? '');
  const siteUrl = $derived(locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const schema = $derived(buildGraph(locale, pageUrl, title, description));

  const founders = $derived([
    {
      key: 'leandro-damasio',
      name: 'Leandro Damasio',
      role: locale === 'pt-BR' ? 'Fundador & CEO' : 'Founder & CEO',
      bio:
        locale === 'pt-BR'
          ? 'AI Engineer, Platform & Backend Systems, Technical Leadership. Fundador e CEO da RBX Systems.'
          : 'AI Engineer, Platform & Backend Systems, Technical Leadership. Founder & CEO of RBX Systems.',
      href: '/leandro-damasio'
    }
  ]);
</script>

<Seo {title} {description} {locale} canonical={pageUrl} {schema} />

<ContentPage
  {page}
  fallbackTitle={t(locale, 'team.headline')}
  fallbackLead={t(locale, 'team.body')}
  {locale}
/>

<section class="team-section">
  <h2>{locale === 'pt-BR' ? 'Fundadores' : 'Founders'}</h2>
  <ul class="founders">
    {#each founders as founder}
      <li class="founder-card">
        <a href={founder.href} class="founder-link">
          <span class="founder-name">{founder.name}</span>
          <span class="founder-role">{founder.role}</span>
        </a>
        <p class="founder-bio">{founder.bio}</p>
      </li>
    {/each}
  </ul>
</section>

<style>
  .team-section {
    max-width: var(--prose-w);
    margin: var(--s-7) auto 0;
    padding: 0 var(--gutter);
  }

  .team-section h2 {
    font-size: var(--text-2xl);
    font-weight: 400;
    margin-bottom: var(--s-5);
  }

  .founders {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--s-4);
  }

  .founder-card {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--s-4);
  }

  .founder-link {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    margin-bottom: var(--s-3);
    border-bottom: none;
  }

  .founder-link:hover {
    text-decoration: none;
  }

  .founder-name {
    font-size: var(--text-xl);
    font-weight: 500;
    color: var(--fg-0);
  }

  .founder-role {
    font-size: var(--text-sm);
    color: var(--cyan-brand);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
  }

  .founder-bio {
    color: var(--fg-2);
    font-size: var(--text-sm);
    line-height: 1.6;
    margin: 0;
  }
</style>
