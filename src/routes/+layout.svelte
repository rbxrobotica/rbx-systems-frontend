<script lang="ts">
  import '$design/tokens.css';
  import '$lib/i18n';

  import type { Snippet } from 'svelte';
  import NavBar from '$components/NavBar.svelte';
  import Footer from '$components/Footer.svelte';
  import WhatsAppFloat from '$components/WhatsAppFloat.svelte';
  import AIChatFloat from '$components/AIChatFloat.svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="rbx-root">
  <NavBar />
  <main class="page">
    {@render children()}
  </main>
  <Footer />
  <AIChatFloat />
  <WhatsAppFloat />
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: var(--bg-0);
    color: var(--fg-0);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--lead-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
  :global(h1, h2, h3, h4, h5, h6) {
    margin: 0;
    color: var(--fg-0);
  }
  :global(p) {
    margin: 0;
  }
  :global(a) {
    color: var(--fg-0);
    text-decoration: none;
    border-bottom: 1px solid var(--border-strong);
    transition:
      border-color var(--dur) var(--ease),
      color var(--dur) var(--ease);
  }
  :global(a:hover) {
    color: var(--cyan-brand);
    border-bottom-color: var(--cyan-brand);
  }
  :global(*:focus-visible) {
    outline: none;
    box-shadow: var(--ring-focus);
    outline-offset: 2px;
  }
  .rbx-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .page {
    flex: 1;
    max-width: var(--content-w);
    width: 100%;
    margin: 0 auto;
    padding: var(--s-7) var(--gutter);
  }
</style>
