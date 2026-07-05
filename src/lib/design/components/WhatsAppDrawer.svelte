<script lang="ts">
  import { untrack } from 'svelte';
  import { _ } from 'svelte-i18n';
  import type { Snippet } from 'svelte';
  import { getCommsBaseUrl } from '$lib/api/comms';
  import AltchaWidget from './AltchaWidget.svelte';

  interface Props {
    trigger: Snippet<[() => void]>;
    initialMessage?: string;
  }

  let { trigger, initialMessage = '' }: Props = $props();

  type Status = 'idle' | 'submitting' | 'success' | 'error';

  let open = $state(false);
  let name = $state('');
  let phone = $state('');
  let message = $state(untrack(() => initialMessage));
  let altchaPayload = $state<string | null>(null);
  let status = $state<Status>('idle');
  let altchaWidget: AltchaWidget | undefined = $state();

  const commsBase = getCommsBaseUrl();
  const challengeUrl = `${commsBase}/api/altcha-challenge`;

  function reset() {
    name = '';
    phone = '';
    message = '';
    altchaPayload = null;
    status = 'idle';
  }

  function close() {
    open = false;
    reset();
  }

  async function handleSubmit(ev: SubmitEvent) {
    ev.preventDefault();
    if (status === 'submitting') return;

    const payload = altchaWidget?.getValue() ?? altchaPayload;
    if (!payload) {
      status = 'error';
      return;
    }

    status = 'submitting';

    try {
      const res = await fetch(`${commsBase}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: '',
          phone: phone || undefined,
          message: message || 'Contato solicitado via WhatsApp',
          whatsapp_opt_in: true,
          altcha: payload,
          source: 'whatsapp',
          language: $_('common.languageCode') ?? 'pt'
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      status = 'success';
    } catch {
      status = 'error';
    }
  }
</script>

{@render trigger(() => (open = true))}

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="overlay"
    role="presentation"
    tabindex="-1"
    onclick={close}
    onkeydown={(e) => e.key === 'Escape' && close()}
  >
    <div
      class="drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="hairline"></div>

      <div class="header">
        <div>
          <h2 id="wa-title">{$_('contact.whatsappLabel')}</h2>
          <p>{$_('contact.body')}</p>
        </div>
        <button type="button" class="close" onclick={close} aria-label={$_('common.close')}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="icon-small"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {#if status === 'success'}
        <div class="success">
          <div class="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="icon"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p>{$_('contact.form.success')}</p>
          <button type="button" class="rbx-cta" onclick={close}>{$_('common.close')}</button>
        </div>
      {:else}
        <form class="form" class:pending={status === 'submitting'} onsubmit={handleSubmit}>
          <div class="field">
            <label for="wa-name">{$_('contact.form.name')} *</label>
            <input
              id="wa-name"
              type="text"
              required
              bind:value={name}
              placeholder={$_('contact.form.namePlaceholder')}
              disabled={status === 'submitting'}
            />
          </div>

          <div class="field">
            <label for="wa-phone">WhatsApp *</label>
            <input
              id="wa-phone"
              type="tel"
              required
              bind:value={phone}
              placeholder={$_('contact.form.phonePlaceholder')}
              disabled={status === 'submitting'}
            />
          </div>

          <div class="field">
            <label for="wa-message">{$_('contact.form.message')}</label>
            <textarea
              id="wa-message"
              rows="3"
              bind:value={message}
              placeholder={$_('contact.form.messagePlaceholder')}
              disabled={status === 'submitting'}
            ></textarea>
          </div>

          <AltchaWidget
            bind:this={altchaWidget}
            challengeurl={challengeUrl}
            onstatechange={(payload) => (altchaPayload = payload)}
            disabled={status === 'submitting'}
          />

          {#if status === 'error'}
            <div class="error" role="alert">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="icon-small"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{$_('contact.form.error')}</span>
            </div>
          {/if}

          <button type="submit" class="submit" disabled={status === 'submitting'}>
            {#if status === 'submitting'}
              <span class="spinner"></span>
              <span>{$_('contact.form.submitting')}</span>
            {:else}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="icon-small"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>{$_('contact.form.submit')}</span>
            {/if}
          </button>
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(7, 8, 10, 0.72);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: flex-end;
  }

  .drawer {
    position: relative;
    width: 100%;
    max-width: 28rem;
    height: 100%;
    background: var(--bg-1);
    border-left: 1px solid var(--border);
    box-shadow: var(--shadow-overlay);
    overflow-y: auto;
    animation: slideIn var(--dur-slow) var(--ease-out);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .hairline {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-brand), transparent);
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: var(--s-4);
    padding: var(--s-5);
    border-bottom: 1px solid var(--border);
  }

  .header h2 {
    font-size: var(--text-xl);
    font-weight: 500;
  }

  .header p {
    font-size: var(--text-sm);
    color: var(--fg-2);
    margin-top: var(--s-1);
  }

  .close {
    align-self: flex-start;
    padding: var(--s-2);
    background: transparent;
    border: none;
    color: var(--fg-2);
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .close:hover {
    color: var(--fg-0);
  }

  .form,
  .success {
    padding: var(--s-5);
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
    transition: opacity var(--dur) var(--ease);
  }

  .form.pending {
    opacity: 0.7;
    pointer-events: none;
  }

  .form :global(.altcha-box) {
    transition: opacity var(--dur) var(--ease);
  }

  .form.pending :global(.altcha-box) {
    opacity: 0.6;
    pointer-events: none;
  }

  .success {
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 20rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  .field label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-muted);
    font-weight: 500;
  }

  .field input,
  .field textarea {
    padding: var(--s-3) var(--s-4);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--fg-0);
    font-size: var(--text-base);
    transition:
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .field input::placeholder,
  .field textarea::placeholder {
    color: var(--fg-3);
  }

  .field input:focus,
  .field textarea:focus {
    outline: none;
    border-color: var(--cyan-brand);
    box-shadow: 0 0 0 2px rgba(34, 229, 229, 0.15);
  }

  .field textarea {
    resize: vertical;
    min-height: 5rem;
  }

  .error {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    padding: var(--s-3) var(--s-4);
    border: 1px solid var(--err-subtle);
    border-radius: var(--radius-sm);
    background: var(--err-subtle);
    color: var(--err);
    font-size: var(--text-sm);
  }

  .submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-2);
    padding: var(--s-3) var(--s-5);
    border: none;
    border-radius: var(--radius-sm);
    background: linear-gradient(90deg, var(--cyan-signal), var(--cyan-brand));
    color: var(--bg-0);
    font-weight: 600;
    letter-spacing: var(--track-wide);
    cursor: pointer;
    transition:
      filter var(--dur) var(--ease),
      opacity var(--dur) var(--ease);
  }

  .submit:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(7, 8, 10, 0.3);
    border-top-color: var(--bg-0);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .icon,
  .icon-small {
    width: 1.25rem;
    height: 1.25rem;
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: var(--cyan-subtle);
    color: var(--cyan-brand);
  }
</style>
