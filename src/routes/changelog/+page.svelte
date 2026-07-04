<script lang="ts">
  import { _ } from 'svelte-i18n';
  import ContentPage from '$components/ContentPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ContentPage
  page={data.page}
  fallbackTitle={$_('nav.changelog')}
  fallbackLead="Histórico público de mudanças, releases e decisões da RBX Systems."
  locale={data.locale}
/>
