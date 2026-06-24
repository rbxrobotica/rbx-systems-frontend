<script lang="ts">
  import WhatsAppDrawer from './WhatsAppDrawer.svelte';
</script>

{#snippet trigger(open: () => void)}
  <button type="button" class="float" aria-label="WhatsApp" onclick={open}>
    <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
      <path
        d="M17.6 6.32A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.88 12.15l-1.08 3.94 4.03-1.06A7.93 7.93 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.68ZM12 17.5a5.46 5.46 0 0 1-2.8-.77l-.2-.12-1.66.44.44-1.62-.14-.22a5.5 5.5 0 1 1 4.36 2.29Z"
      />
      <path
        d="M14.8 13.1c-.1-.15-.35-.23-.73-.4s-2.14-.93-2.47-1.04c-.33-.1-.57-.16-.81.16s-.93 1.04-1.14 1.25-.42.24-.78.08a9.66 9.66 0 0 1-2.86-1.77 10.57 10.57 0 0 1-1.98-2.46c-.2-.35 0-.55.16-.73.16-.16.35-.4.52-.6.17-.2.23-.35.35-.58.1-.23.05-.43-.03-.6-.08-.15-.73-1.76-1-2.4-.26-.62-.53-.54-.73-.55l-.62-.01c-.22 0-.57.08-.87.4-.3.3-1.15 1.12-1.15 2.73 0 1.6 1.17 3.15 1.33 3.37.17.2 2.3 3.52 5.58 4.94.78.33 1.39.54 1.86.7.78.25 1.5.21 2.06.13.63-.09 1.95-.8 2.23-1.57.27-.77.27-1.43.19-1.57Z"
      />
    </svg>
  </button>
{/snippet}

<WhatsAppDrawer {trigger} />

<style>
  .float {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 40;
    width: 3.5rem;
    height: 3.5rem;
    border: none;
    border-radius: 50%;
    background: #25d366;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  .float:hover {
    background: #20bd5a;
    transform: scale(1.05);
  }

  .icon {
    width: 1.75rem;
    height: 1.75rem;
  }
</style>
