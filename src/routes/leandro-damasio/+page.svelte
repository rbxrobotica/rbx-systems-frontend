<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'leandroDamasio.headline')}
  fallbackLead={t(data.locale, 'leandroDamasio.body')}
  locale={data.locale}
/>
