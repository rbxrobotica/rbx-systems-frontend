<script lang="ts">
  import { createAltchaStore } from './altchaStore';

  interface Props {
    challengeurl?: string;
    onstatechange?: (payload: string | null) => void;
    disabled?: boolean;
  }

  let { challengeurl = '/api/altcha-challenge', onstatechange, disabled = false }: Props = $props();

  // svelte-ignore state_referenced_locally
  const {
    altchaState,
    errorText,
    payload,
    verify,
    reset: resetStore,
    getValue: getStoreValue
  } = createAltchaStore(challengeurl);

  $effect(() => {
    onstatechange?.($payload);
  });

  export function getValue(): string | null {
    return getStoreValue();
  }

  export function reset() {
    resetStore();
  }

  export function handleVerify() {
    return verify();
  }
</script>

<button
  type="button"
  class="altcha-box"
  disabled={$altchaState === 'loading' || disabled}
  onclick={handleVerify}
  aria-label="Verify you are not a robot"
>
  <span class="checkbox" class:checked={$altchaState === 'verified'}>
    {#if $altchaState === 'loading'}
      <span class="spinner"></span>
    {:else if $altchaState === 'verified'}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    {/if}
  </span>
  <span class="label">
    {#if $altchaState === 'verified'}
      Verified
    {:else if $altchaState === 'loading'}
      Verifying...
    {:else if $altchaState === 'error'}
      {$errorText ?? 'Verification failed. Try again.'}
    {:else}
      I'm not a robot
    {/if}
  </span>
</button>

<style>
  .altcha-box {
    display: inline-flex;
    align-items: center;
    gap: var(--s-3);
    padding: var(--s-3) var(--s-4);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--fg-1);
    font-size: var(--text-sm);
    cursor: pointer;
    transition:
      border-color var(--dur) var(--ease),
      background var(--dur) var(--ease);
  }

  .altcha-box:hover:not(:disabled) {
    border-color: var(--cyan-dim);
  }

  .altcha-box:disabled {
    cursor: wait;
  }

  .checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--bg-0);
    color: var(--bg-0);
    transition:
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }

  .checkbox.checked {
    background: var(--cyan-brand);
    border-color: var(--cyan-brand);
  }

  .checkbox svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  .spinner {
    width: 0.875rem;
    height: 0.875rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: var(--cyan-brand);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
