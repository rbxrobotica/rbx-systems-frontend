<script lang="ts">
  import { onMount } from 'svelte';
  import { applyTheme, currentTheme, type Theme } from '$design/theme';
  import { t } from '$lib/i18n/translate';
  import type { Locale } from '$types/content';

  interface Props {
    locale: Locale;
    /** icon: square button for the header. row: labelled line for the mobile menu. */
    variant?: 'icon' | 'row';
  }

  let { locale, variant = 'icon' }: Props = $props();

  // The server renders dark. The real value is read on mount, after the script
  // in app.html has applied the stored choice or the theme of the system.
  let theme = $state<Theme>('dark');
  const label = $derived(t(locale, theme === 'dark' ? 'nav.themeToLight' : 'nav.themeToDark'));

  onMount(() => {
    theme = currentTheme();
    // Two toggles exist (header and mobile menu): keep them in step.
    const observer = new MutationObserver(() => (theme = currentTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    return () => observer.disconnect();
  });

  function toggle() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }
</script>

<button
  type="button"
  class="theme-toggle theme-toggle--{variant}"
  aria-label={variant === 'icon' ? label : undefined}
  title={variant === 'icon' ? label : undefined}
  onclick={toggle}
>
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {#if theme === 'dark'}
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
      />
    {:else}
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    {/if}
  </svg>
  {#if variant === 'row'}
    <span>{label}</span>
  {/if}
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-3);
    background: none;
    border: 0;
    padding: 0;
    color: var(--fg-2);
    cursor: pointer;
    transition: color var(--dur) var(--ease);
  }
  .theme-toggle:hover {
    color: var(--accent-text);
  }
  .theme-toggle--icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
  }
  .theme-toggle--row {
    justify-content: flex-start;
    width: 100%;
    min-height: 44px;
    color: var(--fg-1);
    font: 400 var(--text-base) / 1 var(--font-sans);
  }
</style>
