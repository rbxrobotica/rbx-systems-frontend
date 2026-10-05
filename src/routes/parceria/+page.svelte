<script lang="ts">
  import PartnershipPage from '$components/PartnershipPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<PartnershipPage locale={data.locale} />
