<script lang="ts">
  import { page } from '$app/stores';
  import { locale } from 'svelte-i18n';
  import WhatsAppDrawer from './WhatsAppDrawer.svelte';
  import AIChatWidget from './AIChatWidget.svelte';

  const contextMessages: Record<string, { pt: string; en: string }> = {
    '/solucoes': {
      pt: 'Olá, tenho interesse nas soluções da RBX Systems.',
      en: 'Hello, I am interested in RBX Systems solutions.'
    },
    '/produtos': {
      pt: 'Olá, quero saber mais sobre os produtos da RBX Systems.',
      en: 'Hello, I would like to learn more about RBX Systems products.'
    },
    '/cases': {
      pt: 'Olá, quero entender como a RBX pode ajudar minha empresa.',
      en: 'Hello, I would like to understand how RBX can help my company.'
    },
    '/trust': {
      pt: 'Olá, tenho interesse na proposta de governança e confiança da RBX.',
      en: 'Hello, I am interested in RBX governance and trust framework.'
    },
    '/atelier': {
      pt: 'Olá, quero conhecer mais sobre o Atelier da RBX.',
      en: 'Hello, I would like to know more about the RBX Atelier.'
    },
    '/blog': {
      pt: 'Olá, li o blog da RBX e gostaria de conversar.',
      en: 'Hello, I read the RBX blog and would like to chat.'
    },
    '/journal': {
      pt: 'Olá, li o conteúdo da RBX e gostaria de conversar.',
      en: 'Hello, I read RBX content and would like to chat.'
    },
    '/newsroom': {
      pt: 'Olá, vim pela sala de imprensa da RBX e gostaria de conversar.',
      en: 'Hello, I visited the RBX newsroom and would like to connect.'
    }
  };

  function getContextMessage(path: string, loc: string | null | undefined): string {
    const isEn = loc?.startsWith('en');
    const entry = Object.entries(contextMessages).find(([key]) => path.startsWith(key));
    if (entry) return isEn ? entry[1].en : entry[1].pt;
    return isEn
      ? 'Hello, I visited the RBX Systems website and would like to chat.'
      : 'Olá, vim pelo site da RBX Systems e gostaria de conversar.';
  }

  const initialMessage = $derived(getContextMessage($page.url.pathname, $locale));

  let expanded = $state(false);
  let aiChatOpen = $state(false);
  let whatsappOpen = $state(false);

  function toggleMenu() {
    expanded = !expanded;
  }

  function openRobson() {
    expanded = false;
    aiChatOpen = true;
  }

  function openOuvidoria() {
    expanded = false;
    whatsappOpen = true;
  }

  function closeMenu() {
    expanded = false;
  }
</script>

<!-- AI Chat Drawer -->
{#if aiChatOpen}
  <AIChatWidget onclose={() => (aiChatOpen = false)} />
{/if}

<!-- WhatsApp Drawer -->
{#snippet whatsappTrigger(open: () => void)}
  <button style="display: contents;" onclick={open}></button>
{/snippet}

{#if whatsappOpen}
  <WhatsAppDrawer trigger={whatsappTrigger} {initialMessage} />
{/if}

<!-- Contact Menu -->
<div class="contact-menu" class:expanded>
  <!-- Primary button -->
  <button
    type="button"
    class="menu-toggle"
    aria-label="Communication menu"
    aria-expanded={expanded}
    onclick={toggleMenu}
  >
    <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
      <g class="icon-envelope">
        <path
          d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
        />
      </g>
    </svg>
  </button>

  <!-- Expanded menu items -->
  {#if expanded}
    <!-- Robson (AI) -->
    <button
      type="button"
      class="menu-item robson"
      aria-label="Talk to Robson AI Assistant"
      onclick={openRobson}
    >
      <div class="item-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
          <text x="12" y="15" text-anchor="middle" font-size="10" font-weight="bold" fill="white"
            >R</text
          >
        </svg>
      </div>
      <div class="item-label">
        <span class="item-name">Robson</span>
        <span class="item-desc">AI Assistant</span>
      </div>
    </button>

    <!-- Ouvidoria (WhatsApp) -->
    <button
      type="button"
      class="menu-item ouvidoria"
      aria-label="Contact RBX via WhatsApp"
      onclick={openOuvidoria}
    >
      <div class="item-icon whatsapp">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M17.6 6.32A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.88 12.15l-1.08 3.94 4.03-1.06A7.93 7.93 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.68ZM12 17.5a5.46 5.46 0 0 1-2.8-.77l-.2-.12-1.66.44.44-1.62-.14-.22a5.5 5.5 0 1 1 4.36 2.29Z"
          />
        </svg>
      </div>
      <div class="item-label">
        <span class="item-name">Ouvidoria</span>
        <span class="item-desc">WhatsApp Institucional</span>
      </div>
    </button>

    <!-- Close overlay -->
    <div class="menu-overlay" onclick={closeMenu}></div>
  {/if}
</div>

<style>
  .contact-menu {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 40;
    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  }

  /* Primary toggle button */
  .menu-toggle {
    position: relative;
    z-index: 41;
    width: 3.5rem;
    height: 3.5rem;
    border: 1px solid var(--border-accent, #22e5e5);
    border-radius: 50%;
    background: var(--bg-1, #0f1117);
    color: var(--cyan-brand, #22e5e5);
    box-shadow:
      0 4px 16px rgba(34, 229, 229, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--dur, 200ms) var(--ease, ease-out),
      box-shadow var(--dur, 200ms) var(--ease, ease-out),
      transform var(--dur, 200ms) var(--ease, ease-out);
  }

  .menu-toggle:hover {
    background: var(--bg-2, #161b22);
    box-shadow:
      0 6px 24px rgba(34, 229, 229, 0.25),
      0 2px 8px rgba(0, 0, 0, 0.4);
    transform: scale(1.08);
  }

  .menu-toggle:active {
    transform: scale(0.96);
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  /* Expanded menu items */
  .contact-menu.expanded .menu-toggle {
    background: var(--bg-2, #161b22);
    box-shadow:
      0 6px 24px rgba(34, 229, 229, 0.25),
      0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 39;
  }

  .menu-item {
    position: absolute;
    right: 0;
    width: auto;
    padding: 0.75rem 1rem 0.75rem 0.75rem;
    border: 1px solid var(--border, #30363d);
    border-radius: 0.5rem;
    background: var(--bg-1, #0f1117);
    color: var(--fg-0, #e6edf3);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition:
      all var(--dur, 200ms) var(--ease, ease-out),
      background var(--dur, 200ms) var(--ease, ease-out);
    animation: slideUp 0.3s var(--ease-out, ease-out);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item:hover {
    background: var(--bg-2, #161b22);
    border-color: var(--cyan-brand, #22e5e5);
  }

  .menu-item:active {
    transform: scale(0.98);
  }

  .robson {
    bottom: 4.5rem;
  }

  .ouvidoria {
    bottom: 1.5rem;
  }

  .item-icon {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cyan-signal, #0dd9ff), var(--cyan-brand, #22e5e5));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bg-0, #010409);
    font-weight: 700;
  }

  .item-icon.whatsapp {
    background: #25d366;
  }

  .item-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .item-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: left;
  }

  .item-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--fg-0, #e6edf3);
  }

  .item-desc {
    font-size: 0.75rem;
    color: var(--fg-2, #8b949e);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (max-width: 640px) {
    .contact-menu {
      bottom: 1rem;
      right: 1rem;
    }

    .menu-item {
      padding: 0.625rem 0.875rem 0.625rem 0.625rem;
      border-radius: 0.375rem;
    }

    .item-icon {
      width: 2rem;
      height: 2rem;
    }

    .item-icon svg {
      width: 1rem;
      height: 1rem;
    }

    .item-name {
      font-size: 0.8rem;
    }

    .item-desc {
      font-size: 0.65rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .menu-toggle,
    .menu-item {
      transition: none;
    }

    @keyframes slideUp {
      from,
      to {
        opacity: 1;
        transform: none;
      }
    }
  }
</style>
