<script lang="ts">
  import { locale } from 'svelte-i18n';
  import { tick } from 'svelte';

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();

  type Role = 'user' | 'assistant';
  interface Message {
    role: Role;
    content: string;
  }

  function welcomeMessage(): string {
    return $locale?.startsWith('en')
      ? "Hello! I'm the RBX Systems assistant. How can I help you today? I can tell you about our AI platform (TruthMetal, Thalamus, Orchestration, Governance), solutions and how we work with high-demand enterprises."
      : 'Olá! Sou o assistente da RBX Systems. Como posso ajudar? Posso falar sobre nossa plataforma de IA (TruthMetal, Thalamus, Orquestração, Governança), soluções e como trabalhamos com empresas de alta exigência.';
  }

  let messages = $state<Message[]>([{ role: 'assistant', content: welcomeMessage() }]);
  let input = $state('');
  let loading = $state(false);
  let showCta = $state(false);
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
    loading = true;
    showCta = false;
    await scrollBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { content: string; showCta: boolean } = await res.json();
      messages = [...messages, { role: 'assistant', content: data.content }];
      showCta = data.showCta;
    } catch {
      const errMsg = $locale?.startsWith('en')
        ? 'Sorry, I could not connect right now. Please try again in a moment.'
        : 'Desculpe, não consegui conectar agora. Tente novamente em instantes.';
      messages = [...messages, { role: 'assistant', content: errMsg }];
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

  const label = $derived($locale?.startsWith('en') ? 'RBX Assistant' : 'Assistente RBX');
  const placeholder = $derived(
    $locale?.startsWith('en') ? 'Ask about our platform…' : 'Pergunte sobre nossa plataforma…'
  );
  const sendLabel = $derived($locale?.startsWith('en') ? 'Send' : 'Enviar');
  const closeLabel = $derived($locale?.startsWith('en') ? 'Close' : 'Fechar');
  const ctaWhatsApp = $derived(
    $locale?.startsWith('en') ? 'Talk on WhatsApp' : 'Falar no WhatsApp'
  );
  const ctaForm = $derived($locale?.startsWith('en') ? 'Send a message' : 'Enviar mensagem');
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
        <span class="header-sub">RBX Systems</span>
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

    {#if showCta && !loading}
      <div class="cta-row">
        <a href="/#contact" class="cta-btn primary" onclick={onclose}>{ctaForm}</a>
        <button
          type="button"
          class="cta-btn secondary"
          disabled={loading}
          onclick={() => {
            onclose();
            document.querySelector<HTMLButtonElement>('.float[aria-label="WhatsApp"]')?.click();
          }}
        >
          {ctaWhatsApp}
        </button>
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
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
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
    background: linear-gradient(90deg, transparent, var(--cyan-brand), transparent);
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
    background: var(--cyan-subtle);
    border: 1px solid var(--border-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cyan-brand);
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
    color: var(--cyan-brand);
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
    background: var(--cyan-dim);
    color: var(--fg-0);
    border-bottom-right-radius: var(--radius-sm);
  }

  .bubble.assistant {
    background: var(--bg-2);
    color: var(--fg-1);
    border: 1px solid var(--border);
    border-left: 2px solid var(--cyan-muted);
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
    background: var(--cyan-muted);
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
    background: linear-gradient(90deg, var(--cyan-signal), var(--cyan-brand));
    color: var(--bg-0);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cta-btn.secondary {
    background: transparent;
    color: var(--cyan-brand);
    border: 1px solid var(--border-accent);
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
    background: rgba(255, 255, 255, 0.03);
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
    border-color: var(--cyan-brand);
    box-shadow: 0 0 0 2px rgba(34, 229, 229, 0.12);
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
    background: linear-gradient(135deg, var(--cyan-signal), var(--cyan-brand));
    color: var(--bg-0);
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
    border: 2px solid rgba(7, 8, 10, 0.3);
    border-top-color: var(--bg-0);
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
