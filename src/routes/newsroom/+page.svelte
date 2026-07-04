<script lang="ts">
  import { _ } from 'svelte-i18n';
  import ContentPage from '$components/ContentPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ContentPage
  page={data.page}
  fallbackTitle={$_('nav.newsroom')}
  fallbackLead="Notícias, comunicados e posicionamentos oficiais da RBX Systems."
  locale={data.locale}
/>
