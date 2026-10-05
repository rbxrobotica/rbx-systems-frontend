<script lang="ts">
  import ProductsPage from '$components/ProductsPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<ProductsPage locale={data.locale} />
