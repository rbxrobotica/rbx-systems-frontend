<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { bootstrapPlausible, setRuntimeConfig, type AnalyticsConfig } from '$lib/analytics';

  // Runtime config resolved server-side (+layout.server.ts) from the pod's
  // env; import.meta.env.VITE_* is baked at build time and is always empty
  // in the deployed image.
  const config = $derived(($page.data.analytics ?? null) as AnalyticsConfig | null);

  // Make the runtime config visible to trackEvent/trackPageview callers.
  $effect(() => {
    if (browser && config) setRuntimeConfig(config);
  });

  // The per-site script embeds the domain and the event endpoint and stays inert
  // until init() runs. Doing it here instead of as an inline <script> in the head
  // keeps it under Svelte's control and out of the way of a future CSP.
  $effect(() => {
    if (browser && config) bootstrapPlausible();
  });
</script>

<svelte:head>
  {#if config}
    <script async src={config.scriptSrc}></script>
  {/if}
</svelte:head>
