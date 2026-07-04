<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'nav.trust')}
  fallbackLead="Governança, segurança, compliance e práticas de confiabilidade da RBX Systems."
  locale={data.locale}
/>
