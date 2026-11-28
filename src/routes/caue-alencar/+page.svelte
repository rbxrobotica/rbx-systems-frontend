<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import { personSchemaFor } from '$lib/seo/schema';
  import { SITE_ORIGIN } from '$lib/seo/site';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const name = $derived(data.page?.title || t(data.locale, 'caueAlencar.headline'));
  const personId = $derived(`${SITE_ORIGIN}/#caue-alencar`);
  const schemaNodes = $derived([
    personSchemaFor(data.locale, 'caue-alencar', name, t(data.locale, 'caueAlencar.jobTitle'))
  ]);
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'caueAlencar.headline')}
  fallbackLead={t(data.locale, 'caueAlencar.body')}
  locale={data.locale}
  {schemaNodes}
  aboutId={personId}
/>
