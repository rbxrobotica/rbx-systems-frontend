<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import AtelierReference from '$components/AtelierReference.svelte';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'nav.atelier')}
  fallbackLead="Notas de laboratório, experimentos e pesquisa aplicada da RBX Systems."
  locale={data.locale}
/>

<AtelierReference locale={data.locale} />
