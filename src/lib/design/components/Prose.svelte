<script lang="ts">
  interface Props {
    html: string;
  }

  let { html }: Props = $props();
</script>

<article class="prose">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</article>

<style>
  .prose :global(h1),
  .prose :global(h2),
  .prose :global(h3),
  .prose :global(h4) {
    color: var(--fg-0);
    margin-top: var(--s-6);
    margin-bottom: var(--s-3);
  }
  .prose :global(h1) {
    font-size: var(--text-3xl);
    font-weight: 300;
  }
  .prose :global(h2) {
    font-size: var(--text-2xl);
    font-weight: 400;
  }
  .prose :global(h3) {
    font-size: var(--text-xl);
    font-weight: 500;
  }
  .prose :global(p) {
    color: var(--fg-1);
    margin-bottom: var(--s-4);
  }
  .prose :global(ul),
  .prose :global(ol) {
    color: var(--fg-1);
    padding-left: var(--s-5);
    margin-bottom: var(--s-4);
  }
  .prose :global(li) {
    margin-bottom: var(--s-2);
  }
  .prose :global(a) {
    color: var(--cyan-brand);
    border-bottom-color: var(--cyan-dim);
  }
  .prose :global(a:hover) {
    color: var(--cyan-signal);
    border-bottom-color: var(--cyan-brand);
  }
  .prose :global(code) {
    font-family: var(--font-mono);
    background: var(--bg-2);
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
  }
  .prose :global(pre) {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--s-4);
    overflow-x: auto;
    margin-bottom: var(--s-4);
  }
  .prose :global(pre code) {
    background: transparent;
    padding: 0;
  }
  .prose :global(blockquote) {
    border-left: 2px solid var(--cyan-dim);
    padding-left: var(--s-4);
    margin-left: 0;
    color: var(--fg-1);
    font-style: italic;
  }
</style>
