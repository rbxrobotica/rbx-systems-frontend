<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { getCommsBaseUrl } from '$lib/api/comms';
  import AltchaWidget from './AltchaWidget.svelte';

  interface Props {
    source?: string;
  }

  let { source = 'site' }: Props = $props();

  type Status = 'idle' | 'submitting' | 'success' | 'error';

  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let message = $state('');
  let whatsappOptIn = $state(false);
  let website = $state(''); // honeypot
  let altchaPayload = $state<string | null>(null);
  let status = $state<Status>('idle');
  let altchaWidget: AltchaWidget | undefined = $state();

  const commsBase = getCommsBaseUrl();
  const challengeUrl = `${commsBase}/api/altcha-challenge`;

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
          email,
          phone: phone || undefined,
          message,
          whatsapp_opt_in: whatsappOptIn,
          altcha: payload,
          website,
          source,
          language: $_('common.languageCode') ?? 'pt'
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      status = 'success';
      name = '';
      email = '';
      phone = '';
      message = '';
      whatsappOptIn = false;
      altchaPayload = null;
    } catch {
      status = 'error';
    }
  }
</script>

{#if status === 'success'}
  <div class="success-card">
    <div class="hairline"></div>
    <div class="corners" aria-hidden="true"></div>
    <div class="content">
      <div class="icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <p>{$_('contact.form.success')}</p>
      <button type="button" class="rbx-cta" onclick={() => (status = 'idle')}>
        {$_('contact.form.submit')}
      </button>
    </div>
  </div>
{:else}
  <form class="form" class:pending={status === 'submitting'} onsubmit={handleSubmit}>
    <div class="hairline"></div>
    <div class="corners" aria-hidden="true"></div>

    <!-- Honeypot — hidden from humans -->
    <div class="honeypot" aria-hidden="true">
      <label for="website">Website</label>
      <input
        type="text"
        id="website"
        name="website"
        tabindex="-1"
        autocomplete="off"
        bind:value={website}
        disabled={status === 'submitting'}
      />
    </div>

    <div class="row">
      <div class="field">
        <label for="contact-name">{$_('contact.form.name')} *</label>
        <input
          id="contact-name"
          type="text"
          required
          bind:value={name}
          placeholder={$_('contact.form.namePlaceholder')}
          disabled={status === 'submitting'}
        />
      </div>
      <div class="field">
        <label for="contact-email">{$_('contact.form.email')} *</label>
        <input
          id="contact-email"
          type="email"
          required
          bind:value={email}
          placeholder={$_('contact.form.emailPlaceholder')}
          disabled={status === 'submitting'}
        />
      </div>
    </div>

    <div class="field">
      <label for="contact-phone">{$_('contact.form.phone')}</label>
      <input
        id="contact-phone"
        type="tel"
        bind:value={phone}
        placeholder={$_('contact.form.phonePlaceholder')}
        disabled={status === 'submitting'}
      />
    </div>

    <div class="field">
      <label for="contact-message">{$_('contact.form.message')} *</label>
      <textarea
        id="contact-message"
        rows="4"
        required
        bind:value={message}
        placeholder={$_('contact.form.messagePlaceholder')}
        disabled={status === 'submitting'}
      ></textarea>
    </div>

    <div class="checkbox">
      <input
        id="contact-whatsapp"
        type="checkbox"
        bind:checked={whatsappOptIn}
        disabled={status === 'submitting'}
      />
      <label for="contact-whatsapp">{$_('contact.form.whatsappOptIn')}</label>
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

<style>
  .form,
  .success-card {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-1);
    backdrop-filter: blur(8px);
  }

  .hairline {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-brand), transparent);
    opacity: 0.8;
  }

  .corners {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .corners::before,
  .corners::after {
    content: '';
    position: absolute;
    width: 1rem;
    height: 1rem;
    border-color: rgba(0, 255, 255, 0.3);
    border-style: solid;
  }
  .corners::before {
    top: 0;
    left: 0;
    border-width: 1px 0 0 1px;
  }
  .corners::after {
    bottom: 0;
    right: 0;
    border-width: 0 1px 1px 0;
  }

  .form {
    padding: var(--s-6);
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

  .row {
    display: grid;
    gap: var(--s-4);
  }

  @media (min-width: 640px) {
    .row {
      grid-template-columns: 1fr 1fr;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  .field label,
  .checkbox label {
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
    min-height: 6rem;
  }

  .checkbox {
    display: flex;
    align-items: flex-start;
    gap: var(--s-2);
  }

  .checkbox input {
    margin-top: 0.15rem;
    width: 1rem;
    height: 1rem;
    accent-color: var(--cyan-brand);
  }

  .honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
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

  .success-card {
    padding: var(--s-7);
  }

  .success-card .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s-4);
    text-align: center;
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

  .icon,
  .icon-small {
    width: 1.25rem;
    height: 1.25rem;
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
  }
</style>
