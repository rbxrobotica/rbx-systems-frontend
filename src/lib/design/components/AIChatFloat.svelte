<script lang="ts">
  import AIChatWidget from './AIChatWidget.svelte';

  let open = $state(false);
</script>

{#if open}
  <AIChatWidget onclose={() => (open = false)} />
{/if}

<button
  type="button"
  class="float"
  aria-label="RBX AI Assistant"
  aria-expanded={open}
  onclick={() => (open = !open)}
>
  {#if open}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
      <path
        d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10A10 10 0 0 1 2 12C2 6.48 6.48 2 12 2zm0 2a8 8 0 1 0 0 16A8 8 0 0 0 12 4zm-1 4h2v4h-2V8zm0 6h2v2h-2v-2z"
      />
    </svg>
  {/if}
</button>

<style>
  .float {
    position: fixed;
    bottom: 1.5rem;
    right: 6rem;
    z-index: 40;
    width: 3.5rem;
    height: 3.5rem;
    border: 1px solid var(--border-accent);
    border-radius: 50%;
    background: var(--bg-1);
    color: var(--cyan-brand);
    box-shadow:
      0 4px 16px rgba(0, 255, 255, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  .float:hover {
    background: var(--bg-2);
    box-shadow:
      0 6px 24px rgba(0, 255, 255, 0.25),
      0 2px 8px rgba(0, 0, 0, 0.4);
    transform: scale(1.05);
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
  }
</style>
