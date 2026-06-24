<script lang="ts">
  interface Props {
    eyebrow?: string;
    title: string;
    lead?: string;
    body?: string;
  }

  let { eyebrow, title, lead, body }: Props = $props();
</script>

<header class="page-header">
  {#if eyebrow}
    <span class="rbx-eyebrow">{eyebrow}</span>
  {/if}
  <h1>{title}</h1>
  {#if lead}
    <p class="rbx-lead">{lead}</p>
  {/if}
  {#if body}
    <p class="rbx-body">{body}</p>
  {/if}
</header>

<style>
  .page-header {
    max-width: var(--prose-w);
    margin-bottom: var(--s-7);
  }
  .page-header h1 {
    margin: var(--s-2) 0 var(--s-4);
  }
  .page-header .rbx-lead {
    margin-bottom: var(--s-3);
  }
</style>
