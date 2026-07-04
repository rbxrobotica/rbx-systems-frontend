<script lang="ts">
  import { page } from '$app/stores';
  import { _ } from 'svelte-i18n';

  let currentPath = $derived($page.url.pathname);

  function isActive(href: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }

  const navItems = [
    { href: '/', label: 'nav.home' },
    { href: '/solucoes', label: 'nav.solutions' },
    { href: '/produtos', label: 'nav.products' },
    { href: '/journal', label: 'nav.journal' },
    { href: '/cases', label: 'nav.cases' },
    { href: '/newsroom', label: 'nav.newsroom' },
    { href: '/trust', label: 'nav.trust' }
  ];
</script>

<nav class="navbar">
  <div class="nav-inner">
    <a href="/" class="brand" aria-label={$_('nav.home')}>
      <img src="/brand/rbx-mark.svg" alt="" width="28" height="28" />
      <span class="brand-text">RBX</span>
    </a>

    <div class="nav-links">
      {#each navItems as item}
        <a href={item.href} class="nav-link" class:active={isActive(item.href)}>
          {$_(item.label)}
        </a>
      {/each}
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: sticky;
    top: var(--s-3);
    z-index: 100;
    margin: var(--s-3) 0 var(--s-4);
    padding: 0 var(--gutter);
  }
  .nav-inner {
    max-width: var(--nav-w);
    margin: 0 auto;
    height: calc(var(--header-h) - var(--s-2));
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-4);
    background: var(--bg-nav-glass);
    border: 1px solid var(--border-nav-glass);
    border-radius: var(--radius-pill);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: var(--shadow-nav);
    padding: 0 var(--s-3);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    padding: var(--s-1) var(--s-2);
    border-bottom: none;
    border-radius: var(--radius-pill);
  }
  .brand:hover {
    border-bottom: none;
    background: rgba(255, 255, 255, 0.04);
  }
  .brand-text {
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--fg-0);
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--s-1);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nav-links::-webkit-scrollbar {
    display: none;
  }
  .nav-link {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-2);
    padding: var(--s-1) var(--s-3);
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    white-space: nowrap;
    transition:
      color var(--dur) var(--ease),
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }
  .nav-link:hover {
    color: var(--cyan-brand);
    background: rgba(0, 255, 255, 0.06);
    border-color: var(--cyan-dim);
  }
  .nav-link.active {
    color: var(--cyan-brand);
    background: var(--cyan-subtle);
    border-color: var(--cyan-dim);
  }
</style>
