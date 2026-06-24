<script lang="ts">
  import 'altcha';
  import { createEventDispatcher, onMount } from 'svelte';

  interface Props {
    challengeurl?: string;
  }

  let { challengeurl = '/api/altcha-challenge' }: Props = $props();

  let widget: HTMLElement | undefined = $state();
  let payload = $state<string | null>(null);
  const dispatch = createEventDispatcher<{ statechange: string | null }>();

  function onStateChange(ev: Event) {
    const detail = (ev as CustomEvent).detail;
    payload = detail?.payload ?? null;
    dispatch('statechange', payload);
  }

  onMount(() => {
    const el = widget;
    el?.addEventListener('statechange', onStateChange);
    return () => el?.removeEventListener('statechange', onStateChange);
  });

  export function getValue(): string | null {
    return payload;
  }
</script>

<altcha-widget bind:this={widget} challenge={challengeurl}></altcha-widget>

<style>
  altcha-widget {
    display: block;
    min-height: 44px;
  }

  :global(altcha-widget) {
    --altcha-color-base: transparent !important;
    --altcha-color-text: var(--fg-1) !important;
    --altcha-color-border: var(--border) !important;
    --altcha-color-border-focus: var(--cyan-brand) !important;
    --altcha-color-checkbox: var(--cyan-brand) !important;
    --altcha-color-error: var(--err) !important;
    --altcha-color-spinner: var(--cyan-brand) !important;
  }
</style>
