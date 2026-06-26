<script lang="ts">
  import { page } from '$app/stores';
  import { locale } from 'svelte-i18n';
  import WhatsAppDrawer from './WhatsAppDrawer.svelte';

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

<WhatsAppDrawer {trigger} {initialMessage} />

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
