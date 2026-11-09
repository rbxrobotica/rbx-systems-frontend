<script lang="ts">
  /**
   * RBX lockup: the mark (block with two opposite 45° chamfers) and the
   * wordmark set in type. The mark is the only drawn element; "RBX" and
   * "Systems" are text so they stay crisp and translatable in screen readers.
   *
   * - stacked: mark + "RBX" over "SYSTEMS" (desktop header)
   * - compact: mark + "RBX" (mobile header)
   * - horizontal: mark + "RBX Systems" on one line (footer, documents)
   * - mark: the mark alone (favicon-like uses)
   */
  interface Props {
    /** Mark size in px. The wordmark sizes are fixed per variant. */
    size?: number;
    variant?: 'stacked' | 'compact' | 'horizontal' | 'mark';
  }

  let { size = 28, variant = 'stacked' }: Props = $props();
</script>

<span class="logo logo--{variant}">
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
    <path d="M30 8 H56 V34 L34 56 H8 V30 Z" />
  </svg>
  {#if variant === 'stacked'}
    <span class="stack">
      <span class="wm">RBX</span>
      <span class="sys">Systems</span>
    </span>
  {:else if variant === 'compact'}
    <span class="wm">RBX</span>
  {:else if variant === 'horizontal'}
    <span class="wm">RBX</span>
    <span class="sys-h">Systems</span>
  {/if}
</span>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: var(--s-3);
    color: var(--fg-0);
    white-space: nowrap;
  }
  .logo--compact {
    gap: 10px;
  }
  svg {
    display: block;
    flex: none;
    fill: var(--cyan-brand);
  }
  .stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }
  .wm {
    font-family: var(--font-wordmark);
    font-weight: 700;
    font-stretch: 125%;
    font-size: 17px;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--fg-0);
  }
  .logo--compact .wm {
    font-size: 16px;
  }
  .sys {
    font-family: var(--font-mono);
    font-size: 9px;
    line-height: 1;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--fg-2);
  }
  .sys-h {
    font-family: var(--font-sans);
    font-weight: 300;
    font-size: 17px;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--fg-1);
  }
</style>
