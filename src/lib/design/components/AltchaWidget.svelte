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

  export function getValue(): string | null {
    const el = widget;
    if (!el) return null;
    const input = (el.shadowRoot ?? el).querySelector(
      'input[name="altcha"]'
    ) as HTMLInputElement | null;
    return input?.value ?? null;
  }

  function refreshPayload() {
    payload = getValue();
    dispatch('statechange', payload);
  }

  function onVerified() {
    refreshPayload();
  }

  function onStateChange(ev: Event) {
    const detail = (ev as CustomEvent)?.detail;
    if (detail?.state === 'verified') {
      refreshPayload();
    } else if (
      detail?.state === 'unverified' ||
      detail?.state === 'error' ||
      detail?.state === 'expired'
    ) {
      payload = null;
      dispatch('statechange', null);
    }
  }

  onMount(() => {
    const el = widget;
    el?.addEventListener('verified', onVerified);
    el?.addEventListener('statechange', onStateChange);
    return () => {
      el?.removeEventListener('verified', onVerified);
      el?.removeEventListener('statechange', onStateChange);
    };
  });
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
