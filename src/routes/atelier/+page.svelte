<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import AtelierReference from '$components/AtelierReference.svelte';
  import AtelierHero from '$components/AtelierHero.svelte';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const pageText = $derived(
    [data.page?.title, data.page?.lead, data.page?.body, data.page?.html]
      .filter(Boolean)
      .join(' ')
      .trim()
  );
  const isPlaceholder = $derived(
    !pageText ||
      pageText.toLowerCase().includes('em breve') ||
      pageText.toLowerCase().includes('coming soon')
  );
</script>

{#if isPlaceholder}
  <AtelierHero locale={data.locale} />
{:else}
  <ContentPage
    page={data.page}
    fallbackTitle={t(data.locale, 'nav.atelier')}
    fallbackLead="Notas de laboratório, experimentos e pesquisa aplicada da RBX Systems."
    locale={data.locale}
  />
{/if}

<AtelierReference locale={data.locale} />
