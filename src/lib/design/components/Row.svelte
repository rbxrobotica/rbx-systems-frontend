<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    gap?: number;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    wrap?: boolean;
    class?: string;
  }

  let {
    children,
    gap = 4,
    align = 'center',
    justify = 'start',
    wrap = false,
    class: className = ''
  }: Props = $props();
</script>

<div
  class="row {className}"
  style:--gap="var(--s-{gap})"
  style:--align={align}
  style:--justify={justify}
  style:flex-wrap={wrap ? 'wrap' : 'nowrap'}
>
  {@render children()}
</div>

<style>
  .row {
    display: flex;
    flex-direction: row;
    gap: var(--gap, var(--s-4));
    align-items: var(--align, center);
    justify-content: var(--justify, start);
  }
</style>
