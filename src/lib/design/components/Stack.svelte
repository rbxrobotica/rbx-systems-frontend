<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    gap?: number;
    align?: 'start' | 'center' | 'end' | 'stretch';
    class?: string;
  }

  let { children, gap = 4, align = 'stretch', class: className = '' }: Props = $props();
</script>

<div class="stack {className}" style:--gap="var(--s-{gap})" style:--align={align}>
  {@render children()}
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--gap, var(--s-4));
    align-items: var(--align, stretch);
  }
</style>
