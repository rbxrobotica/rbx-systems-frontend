<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import ContentPage from '$components/ContentPage.svelte';
  import { collectionPageSchema } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const siteUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(`${siteUrl}${$pageStore.url.pathname}`);
  const title = $derived(data.page?.title || t(data.locale, 'products.headline'));
  const description = $derived(data.page?.description ?? t(data.locale, 'products.body'));
  // The listing body comes from CMS HTML without structured entries, so the
  // CollectionPage goes out without an ItemList.
  const schemaNodes = $derived([collectionPageSchema(data.locale, pageUrl, title, description)]);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'products.headline')}
  fallbackLead={t(data.locale, 'products.body')}
  locale={data.locale}
  {schemaNodes}
/>
