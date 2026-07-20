<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { setRuntimeConfig, type AnalyticsConfig } from '$lib/analytics';

  // Runtime config resolved server-side (+layout.server.ts) from the pod's
  // env; import.meta.env.VITE_* is baked at build time and is always empty
  // in the deployed image.
  const config = $derived(($page.data.analytics ?? null) as AnalyticsConfig | null);

  // Make the runtime config visible to trackEvent/trackPageview callers.
  $effect(() => {
    if (browser && config) setRuntimeConfig(config);
  });
</script>

<svelte:head>
  {#if config}
    <script
      defer
      data-domain={config.domain}
      src={config.scriptSrc}
      data-api={config.apiHost ? `${config.apiHost}/api/event` : undefined}
    ></script>
  {/if}
</svelte:head>
