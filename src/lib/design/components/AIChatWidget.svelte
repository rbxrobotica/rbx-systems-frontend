<script lang="ts">
  import { locale } from 'svelte-i18n';
  import { tick } from 'svelte';
  import { trackPartnershipEvent } from '$lib/analytics/partnership';
  import { siteHref } from '$lib/seo/alternates';

  interface Props {
    onclose: () => void;
    /** Hands the visitor over to the WhatsApp drawer. CTA is hidden when absent. */
    onwhatsapp?: () => void;
  }

  let { onclose, onwhatsapp }: Props = $props();

  type Role = 'user' | 'assistant';
  interface Message {
    role: Role;
    content: string;
  }

  function welcomeMessage(): string {
    return $locale?.startsWith('en')
      ? "Hello, I'm the Merovelis AI assistant. I can explain our products, AI platform and Engineering Partnership. How can I help?"
      : 'Olá, sou o assistente da Merovelis IA. Posso explicar nossos produtos, a plataforma de IA e a Engineering Partnership. Como posso ajudar?';
  }

  let messages = $state<Message[]>([{ role: 'assistant', content: welcomeMessage() }]);
  let input = $state('');
  let loading = $state(false);
  // Why the last request got no answer. The visitor's message stays in the
  // conversation, so a retry asks again without typing it again.
  let failure = $state<'timeout' | 'unavailable' | null>(null);
  let showCta = $state(false);
  let showBriefingCta = $state(false);
  let showPartnershipCta = $state(false);
  let messagesEl = $state<HTMLDivElement | undefined>();

  async function scrollBottom() {
    await tick();
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    input = '';
    messages = [...messages, { role: 'user', content: text }];
    await request();
  }

  /** Ask for the answer to the conversation as it stands. A retry calls it again. */
  async function request() {
    // Set before the first await: a second click finds the surface frozen.
    if (loading) return;
    loading = true;
    failure = null;
    showCta = false;
    showBriefingCta = false;
    showPartnershipCta = false;
    await scrollBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The API has one address for both languages: the page says which
          // language section the visitor is in.
          locale: partnershipLocale,
          messages: messages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (res.status === 429) {
        const tooMany = $locale?.startsWith('en')
          ? 'You are sending messages a bit too fast. Please wait a moment and try again.'
          : 'Você está enviando mensagens rápido demais. Aguarde um instante e tente de novo.';
        messages = [...messages, { role: 'assistant', content: tooMany }];
        return;
      }

      if (!res.ok) {
        // 504 is the server's deadline for the gateway. Anything else is an
        // assistant that cannot answer now.
        failure = res.status === 504 ? 'timeout' : 'unavailable';
        return;
      }

      const data: {
        content: string;
        showCta: boolean;
        showBriefingCta?: boolean;
        showPartnershipCta?: boolean;
      } = await res.json();
      messages = [...messages, { role: 'assistant', content: data.content }];
      showCta = data.showCta;
      showBriefingCta = data.showBriefingCta ?? false;
      showPartnershipCta = data.showPartnershipCta ?? false;
    } catch {
      failure = 'unavailable';
    } finally {
      loading = false;
      await scrollBottom();
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const label = $derived(
    $locale?.startsWith('en') ? 'Merovelis Assistant' : 'Assistente Merovelis'
  );
  const placeholder = $derived(
    $locale?.startsWith('en') ? 'Ask about our platform…' : 'Pergunte sobre nossa plataforma…'
  );
  const sendLabel = $derived($locale?.startsWith('en') ? 'Send' : 'Enviar');
  const closeLabel = $derived($locale?.startsWith('en') ? 'Close' : 'Fechar');
  const failureText = $derived(
    failure === 'timeout'
      ? $locale?.startsWith('en')
        ? 'The answer took too long and was stopped. Please try again.'
        : 'A resposta demorou demais e foi interrompida. Tente novamente.'
      : $locale?.startsWith('en')
        ? 'Sorry, I could not connect right now. Please try again in a moment.'
        : 'Desculpe, não consegui conectar agora. Tente novamente em instantes.'
  );
  const retryLabel = $derived($locale?.startsWith('en') ? 'Try again' : 'Tentar novamente');
  const ctaWhatsApp = $derived(
    $locale?.startsWith('en') ? 'Talk on WhatsApp' : 'Falar no WhatsApp'
  );
  const ctaForm = $derived($locale?.startsWith('en') ? 'Send a message' : 'Enviar mensagem');
  const ctaBriefing = $derived(
    $locale?.startsWith('en') ? 'Subscribe to the BTC Briefing' : 'Assinar o Briefing BTC'
  );
  const partnershipLocale = $derived($locale?.startsWith('en') ? 'en' : 'pt-BR');
  const partnershipHref = $derived(siteHref(partnershipLocale, '/parceria#qualificacao'));
  const contactHref = $derived(siteHref(partnershipLocale, '/contato'));
  const ctaPartnership = $derived(
    partnershipLocale === 'en'
      ? 'Check fit and availability'
      : 'Verificar adequação e disponibilidade'
  );

  function openPartnership() {
    trackPartnershipEvent('cta_click', {
      locale: partnershipLocale,
      surface: 'partnership',
      entry: 'chat',
      destination: 'qualification'
    });
    onclose();
  }
</script>

<div class="panel" class:pending={loading} role="dialog" aria-modal="true" aria-label={label}>
  <div class="hairline"></div>

  <div class="header">
    <div class="header-brand">
      <div class="avatar" aria-hidden="true">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="avatar-icon"
        >
          <circle cx="10" cy="10" r="8" />
          <path d="M7 10h6M10 7v6" />
        </svg>
      </div>
      <div>
        <span class="header-title">{label}</span>
        <span class="header-sub">{$locale?.startsWith('en') ? 'Merovelis AI' : 'Merovelis IA'}</span
        >
      </div>
    </div>
    <button
      type="button"
      class="close-btn"
      onclick={onclose}
      disabled={loading}
      aria-label={closeLabel}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>

  <div class="messages" bind:this={messagesEl}>
    {#each messages as msg (msg)}
      <div class="bubble-wrap {msg.role}">
        <div class="bubble {msg.role}">
          {msg.content}
        </div>
      </div>
    {/each}

    {#if loading}
      <div class="bubble-wrap assistant">
        <div class="bubble assistant typing">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    {/if}

    {#if failure && !loading}
      <div class="failure" role="alert">
        <p class="failure-text">{failureText}</p>
        <button type="button" class="cta-btn secondary" disabled={loading} onclick={request}>
          {retryLabel}
        </button>
      </div>
    {/if}

    {#if showBriefingCta && !loading}
      <div class="cta-row">
        <!-- Subscription lives on the landing page, not in the contact funnel;
             ?subscribe=1 opens the plan modal on arrival. -->
        <a href="https://briefingbtc.merovelis.com" class="cta-btn primary" onclick={onclose}
          >{ctaBriefing}</a
        >
      </div>
    {:else if showPartnershipCta && !loading}
      <div class="cta-row">
        <a href={partnershipHref} class="cta-btn primary" onclick={openPartnership}
          >{ctaPartnership}</a
        >
      </div>
    {:else if showCta && !loading}
      <div class="cta-row">
        <!-- /contato, not /#contact: the home page no longer carries the contact section. -->
        <a href={contactHref} class="cta-btn primary" onclick={onclose}>{ctaForm}</a>
        {#if onwhatsapp}
          <button type="button" class="cta-btn secondary" disabled={loading} onclick={onwhatsapp}>
            {ctaWhatsApp}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <div class="input-row">
    <textarea
      class="input"
      rows="1"
      bind:value={input}
      onkeydown={handleKey}
      {placeholder}
      disabled={loading}
    ></textarea>
    <button
      type="button"
      class="send-btn"
      onclick={send}
      disabled={loading || !input.trim()}
      aria-label={sendLabel}
    >
      {#if loading}
        <span class="spinner"></span>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      {/if}
    </button>
  </div>
</div>

<style>
  .panel {
    position: fixed;
    bottom: 7rem;
    right: 1.5rem;
    width: 360px;
    height: 480px;
    max-height: calc(100dvh - 9rem);
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-panel);
    display: flex;
    flex-direction: column;
    z-index: 110;
    animation: slideUp 0.18s var(--ease-out) both;
    overflow: hidden;
    transition: opacity var(--dur) var(--ease);
  }

  .panel.pending {
    opacity: 0.75;
  }

  .panel.pending .messages,
  .panel.pending .input-row,
  .panel.pending .close-btn:not(:disabled),
  .panel.pending .cta-row {
    pointer-events: none;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(0.75rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    .panel {
      inset: 0;
      width: 100%;
      height: 100%;
      max-height: 100%;
      bottom: auto;
      right: auto;
      border-radius: 0;
    }
  }

  .hairline {
    flex-shrink: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent-line), transparent);
  }

  .header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--s-3) var(--s-4);
    border-bottom: 1px solid var(--border);
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: var(--s-3);
  }

  .avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--accent-subtle);
    border: 1px solid var(--accent-line);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-text);
    flex-shrink: 0;
  }

  .avatar-icon {
    width: 1rem;
    height: 1rem;
  }

  .header-title {
    display: block;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--accent-text);
    font-weight: 600;
  }

  .header-sub {
    display: block;
    font-size: var(--text-xs);
    color: var(--fg-3);
    margin-top: 1px;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--fg-2);
    cursor: pointer;
    padding: var(--s-1);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--dur) var(--ease);
  }

  .close-btn:hover {
    color: var(--fg-0);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--s-4);
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar {
    width: 4px;
  }
  .messages::-webkit-scrollbar-track {
    background: transparent;
  }
  .messages::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: 2px;
  }

  .bubble-wrap {
    display: flex;
  }

  .bubble-wrap.user {
    justify-content: flex-end;
  }
  .bubble-wrap.assistant {
    justify-content: flex-start;
  }

  .bubble {
    max-width: 80%;
    padding: var(--s-3) var(--s-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    line-height: var(--lead-body);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .bubble.user {
    background: var(--accent-solid);
    color: var(--on-accent-solid);
    border-bottom-right-radius: var(--radius-sm);
  }

  .bubble.assistant {
    background: var(--bg-2);
    color: var(--fg-1);
    border: 1px solid var(--border);
    border-left: 2px solid var(--accent-label);
    border-bottom-left-radius: var(--radius-sm);
  }

  .bubble.typing {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: var(--s-3) var(--s-4);
    min-width: 3.5rem;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-label);
    animation: blink 1.2s ease-in-out infinite;
  }

  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0.2;
      transform: scale(0.8);
    }
    40% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .failure {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s-2);
    padding: var(--s-3) var(--s-4);
    border: 1px solid var(--err-subtle);
    border-radius: var(--radius-md);
    background: var(--err-subtle);
  }

  .failure-text {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--lead-body);
    color: var(--err);
  }

  .failure .cta-btn {
    flex: none;
  }

  .cta-row {
    display: flex;
    gap: var(--s-2);
    flex-wrap: wrap;
    padding: 0 var(--s-2);
  }

  .cta-btn {
    flex: 1;
    min-width: 120px;
    padding: var(--s-2) var(--s-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--track-wide);
    text-align: center;
    cursor: pointer;
    border: none;
    text-decoration: none;
    transition: filter var(--dur) var(--ease);
  }

  .cta-btn.primary {
    background: linear-gradient(90deg, var(--cta-hover), var(--cta));
    color: var(--on-cta);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cta-btn.secondary {
    background: transparent;
    color: var(--accent-text);
    border: 1px solid var(--accent-line);
  }

  .cta-btn:hover {
    filter: brightness(1.12);
  }

  .input-row {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    gap: var(--s-2);
    padding: var(--s-3) var(--s-4);
    border-top: 1px solid var(--border);
  }

  .input {
    flex: 1;
    resize: none;
    background: var(--field-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--fg-0);
    font-size: var(--text-sm);
    padding: var(--s-2) var(--s-3);
    line-height: 1.5;
    max-height: 6rem;
    overflow-y: auto;
    font-family: var(--font-sans);
    transition: border-color var(--dur) var(--ease);
  }

  .input::placeholder {
    color: var(--fg-3);
  }

  .input:focus {
    outline: none;
    border-color: var(--accent-focus);
    box-shadow: 0 0 0 2px var(--accent-halo);
  }

  .input:disabled {
    opacity: 0.5;
  }

  .send-btn {
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--cta-hover), var(--cta));
    color: var(--on-cta);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      filter var(--dur) var(--ease),
      opacity var(--dur) var(--ease);
  }

  .send-btn:hover:not(:disabled) {
    filter: brightness(1.12);
  }
  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spinner {
    width: 0.875rem;
    height: 0.875rem;
    border: 2px solid var(--on-cta-track);
    border-top-color: var(--on-cta);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .icon-sm {
    width: 1rem;
    height: 1rem;
  }
</style>
