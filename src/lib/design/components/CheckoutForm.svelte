<script lang="ts">
  import { getCommerceBaseUrl } from '$lib/api/commerce';
  import { trackEvent, FORM_SUBMIT, FORM_SUCCESS, FORM_ERROR } from '$lib/analytics/events';
  import AltchaWidget from './AltchaWidget.svelte';
  import type { Locale } from '$types/content';

  interface Props {
    locale: Locale;
  }

  let { locale }: Props = $props();

  // svelte-ignore state_referenced_locally
  const isPtBR = locale === 'pt-BR';

  // Mirrors rbx-commerce/internal/checkout/handler.go's briefingBTCCatalog —
  // this component never sends amount/currency, only plan_id. The server is
  // the source of truth for pricing; these labels are display-only.
  const plans = [
    {
      id: 'briefing-daily',
      name: isPtBR ? 'Briefing Diário BTC' : 'Daily BTC Briefing',
      priceLabel: isPtBR ? 'R$ 39/mês · Pix' : 'R$39/mo · Pix',
      description: isPtBR
        ? 'Leitura diária de mercado direto no seu WhatsApp.'
        : 'Daily market read delivered straight to your WhatsApp.'
    },
    {
      id: 'briefing-monthly',
      name: isPtBR ? 'Briefing Mensal BTC' : 'Monthly BTC Briefing',
      priceLabel: isPtBR ? 'R$ 299/mês · Cartão' : 'R$299/mo · Card',
      description: isPtBR
        ? 'Plano completo, cobrança mensal recorrente no cartão.'
        : 'Full plan, recurring monthly card billing.'
    }
  ];

  const labels = isPtBR
    ? {
        title: 'Assinar agora',
        name: 'Nome completo',
        email: 'E-mail',
        doc: 'CPF/CNPJ',
        docPlaceholder: 'Necessário para Pix/cartão',
        phone: 'WhatsApp',
        phonePlaceholder: '+55 11 91234-5678',
        submit: 'Ir para pagamento',
        submitting: 'Criando assinatura...',
        error: 'Não foi possível criar a assinatura. Tente novamente.',
        successNoUrl:
          'Assinatura criada. Enviaremos o link de pagamento pelo WhatsApp em instantes.',
        redirecting: 'Redirecionando para o pagamento...'
      }
    : {
        title: 'Subscribe now',
        name: 'Full name',
        email: 'Email',
        doc: 'Tax ID (CPF/CNPJ)',
        docPlaceholder: 'Required for Pix/card',
        phone: 'WhatsApp number',
        phonePlaceholder: '+55 11 91234-5678',
        submit: 'Go to payment',
        submitting: 'Creating subscription...',
        error: 'Could not create the subscription. Please try again.',
        successNoUrl: 'Subscription created. We will send the payment link over WhatsApp shortly.',
        redirecting: 'Redirecting to payment...'
      };

  type Status = 'idle' | 'submitting' | 'success-no-url' | 'error';

  let planId = $state(plans[0].id);
  let name = $state('');
  let email = $state('');
  let doc = $state('');
  let phone = $state('');
  let website = $state(''); // honeypot
  let altchaPayload = $state<string | null>(null);
  let status = $state<Status>('idle');
  let altchaWidget: AltchaWidget | undefined = $state();

  const commerceBase = getCommerceBaseUrl();
  const challengeUrl = `${commerceBase}/api/public/altcha-challenge`;
  const source = 'briefing-btc-checkout';

  async function handleSubmit(ev: SubmitEvent) {
    ev.preventDefault();
    if (status === 'submitting') return;

    const payload = altchaWidget?.getValue() ?? altchaPayload;
    if (!payload) {
      status = 'error';
      return;
    }

    status = 'submitting';
    trackEvent(FORM_SUBMIT, { source, offer: planId });

    try {
      const res = await fetch(`${commerceBase}/api/public/briefing-btc/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          customer_name: name,
          customer_email: email,
          customer_doc: doc,
          customer_phone: phone,
          altcha: payload,
          website
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      trackEvent(FORM_SUCCESS, { source, offer: planId });

      if (data.checkout_url) {
        status = 'submitting';
        window.location.href = data.checkout_url;
        return;
      }

      status = 'success-no-url';
    } catch {
      status = 'error';
      trackEvent(FORM_ERROR, { source, offer: planId });
    }
  }
</script>

{#if status === 'success-no-url'}
  <div class="success-card">
    <div class="hairline"></div>
    <p>{labels.successNoUrl}</p>
  </div>
{:else}
  <form class="form" class:pending={status === 'submitting'} onsubmit={handleSubmit}>
    <div class="hairline"></div>

    <!-- Honeypot — hidden from humans -->
    <div class="honeypot" aria-hidden="true">
      <label for="checkout-website">Website</label>
      <input
        type="text"
        id="checkout-website"
        tabindex="-1"
        autocomplete="off"
        bind:value={website}
        disabled={status === 'submitting'}
      />
    </div>

    <h3>{labels.title}</h3>

    <div class="plans">
      {#each plans as plan}
        <button
          type="button"
          class="plan"
          class:selected={planId === plan.id}
          onclick={() => (planId = plan.id)}
          disabled={status === 'submitting'}
        >
          <span class="plan-name">{plan.name}</span>
          <span class="plan-price">{plan.priceLabel}</span>
          <span class="plan-desc">{plan.description}</span>
        </button>
      {/each}
    </div>

    <div class="row">
      <div class="field">
        <label for="checkout-name">{labels.name} *</label>
        <input
          id="checkout-name"
          type="text"
          required
          bind:value={name}
          disabled={status === 'submitting'}
        />
      </div>
      <div class="field">
        <label for="checkout-email">{labels.email} *</label>
        <input
          id="checkout-email"
          type="email"
          required
          bind:value={email}
          disabled={status === 'submitting'}
        />
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label for="checkout-doc">{labels.doc} *</label>
        <input
          id="checkout-doc"
          type="text"
          required
          placeholder={labels.docPlaceholder}
          bind:value={doc}
          disabled={status === 'submitting'}
        />
      </div>
      <div class="field">
        <label for="checkout-phone">{labels.phone} *</label>
        <input
          id="checkout-phone"
          type="tel"
          required
          placeholder={labels.phonePlaceholder}
          bind:value={phone}
          disabled={status === 'submitting'}
        />
      </div>
    </div>

    <AltchaWidget
      bind:this={altchaWidget}
      challengeurl={challengeUrl}
      onstatechange={(payload) => (altchaPayload = payload)}
      disabled={status === 'submitting'}
    />

    {#if status === 'error'}
      <div class="error" role="alert">{labels.error}</div>
    {/if}

    <button type="submit" class="submit" disabled={status === 'submitting'}>
      {#if status === 'submitting'}
        <span class="spinner"></span>
        <span>{labels.submitting}</span>
      {:else}
        <span>{labels.submit}</span>
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
    padding: var(--s-6);
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
  }

  .form.pending {
    opacity: 0.7;
    pointer-events: none;
  }

  .hairline {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-brand), transparent);
    opacity: 0.8;
  }

  h3 {
    font-size: var(--text-lg);
    font-weight: 400;
    letter-spacing: var(--track-tight);
  }

  .plans {
    display: grid;
    gap: var(--s-3);
  }

  @media (min-width: 480px) {
    .plans {
      grid-template-columns: 1fr 1fr;
    }
  }

  .plan {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    text-align: left;
    padding: var(--s-4);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--fg-0);
    transition:
      border-color var(--dur) var(--ease),
      background var(--dur) var(--ease);
  }

  .plan:hover:not(:disabled) {
    border-color: var(--cyan-dim);
  }

  .plan.selected {
    border-color: var(--cyan-brand);
    background: var(--cyan-subtle);
  }

  .plan-name {
    font-weight: 600;
  }

  .plan-price {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--cyan-brand);
  }

  .plan-desc {
    font-size: var(--text-sm);
    color: var(--fg-2);
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

  .field label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-muted);
    font-weight: 500;
  }

  .field input {
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

  .field input:focus {
    outline: none;
    border-color: var(--cyan-brand);
    box-shadow: 0 0 0 2px rgba(34, 229, 229, 0.15);
  }

  .honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .error {
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
</style>
