<script lang="ts">
  import TeamPage from '$components/TeamPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<TeamPage page={data.page} locale={data.locale} />
