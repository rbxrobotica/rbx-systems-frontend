<script lang="ts">
  import { _ } from 'svelte-i18n';
  import ContentPage from '$components/ContentPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ContentPage
  page={data.page}
  fallbackTitle={$_('nav.cases')}
  fallbackLead={$_('cases.body')}
  locale={data.locale}
/>
