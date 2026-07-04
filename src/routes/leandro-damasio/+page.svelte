<script lang="ts">
  import { _ } from 'svelte-i18n';
  import ContentPage from '$components/ContentPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ContentPage
  page={data.page}
  fallbackTitle={$_('leandroDamasio.headline')}
  fallbackLead={$_('leandroDamasio.body')}
  locale={data.locale}
/>
