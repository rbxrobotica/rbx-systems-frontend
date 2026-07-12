<script lang="ts">
  import { browser } from '$app/environment';
  import { getAnalyticsConfig } from '$lib/analytics';

  const config = getAnalyticsConfig();
</script>

{#if browser && config}
  <script
    defer
    data-domain={config.domain}
    src={config.scriptSrc}
    data-api={config.apiHost ? `${config.apiHost}/api/event` : undefined}
  ></script>
{/if}
