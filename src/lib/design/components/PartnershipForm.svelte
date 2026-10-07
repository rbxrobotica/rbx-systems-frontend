<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { getCommsBaseUrl } from '$lib/api/comms';
  import { trackPartnershipEvent, getPartnershipAttribution } from '$lib/analytics/partnership';
  import { partnershipTerms, formatPartnershipPrice } from '$lib/content/partnership';
  import {
    buildQualificationSubmission,
    qualificationLimits,
    type QualificationError
  } from '$lib/partnership/qualification';
  import type { Locale } from '$types/content';
  import AltchaWidget from './AltchaWidget.svelte';

  let { locale }: { locale: Locale } = $props();

  const copy = $derived(
    locale === 'en'
      ? {
          title: 'Tell us about your product',
          required: 'All fields are required unless marked optional.',
          name: 'Your name',
          email: 'Work email',
          company: 'Company or product',
          url: 'Public product URL (optional)',
          stage: 'Product stage',
          production: 'In production',
          pilot: 'Pilot or MVP',
          planning: 'Planning',
          objective: 'What do you need to move forward?',
          objectiveHint:
            'Describe your priority and the outcome you want. If devices are involved, mention the platform if known. Do not include passwords, customer data or confidential code.',
          timeframe: 'When would you like to start?',
          nextMonth: 'Within the next month',
          nextQuarter: 'Within the next three months',
          exploring: 'Still exploring',
          budget: 'Does the monthly reference price fit your budget?',
          priceFits: 'Yes, it fits',
          reviewBudget: 'I need to evaluate it',
          select: 'Select an option',
          consent:
            'I authorize RBX Systems to use these details to assess this request and contact me by email about this engineering partnership.',
          submit: 'Send partnership brief',
          submitting: 'Sending brief…',
          next: 'RBX will review scope and availability and reply by email. Sending this brief does not reserve capacity or create a contract.',
          successTitle: 'Brief received',
          success:
            'Your request has been recorded. RBX will review fit and availability and contact you by email. No meeting is scheduled automatically.',
          verifyIdle: 'Verify you are not a robot',
          verifyLoading: 'Verifying…',
          verifySuccess: 'Verified',
          verifyError: 'Verification failed. Please try again.',
          errors: {
            required: 'Complete the required fields and check your email address.',
            length: 'One of the fields exceeds the supported length. Please shorten your brief.',
            url: 'Use a public http:// or https:// URL without login credentials.',
            consent: 'Authorize contact about this request before sending.',
            verification: 'Complete the anti-abuse verification before sending.',
            rejected: 'Your brief could not be accepted. Review your details and try again.',
            expired:
              'Verification expired. Verify again before resending. Your answers are preserved.',
            limited: 'Too many attempts. Please wait a few minutes before trying again.',
            uncertain:
              'We could not confirm receipt. Your brief may have arrived. Check your email before resending to avoid a duplicate. Your answers are preserved.'
          }
        }
      : {
          title: 'Conte sobre seu produto',
          required: 'Todos os campos são obrigatórios, exceto os indicados como opcionais.',
          name: 'Seu nome',
          email: 'E-mail profissional',
          company: 'Empresa ou produto',
          url: 'URL pública do produto (opcional)',
          stage: 'Estágio do produto',
          production: 'Em produção',
          pilot: 'Piloto ou MVP',
          planning: 'Em planejamento',
          objective: 'O que você precisa fazer avançar?',
          objectiveHint:
            'Descreva sua prioridade e o resultado esperado. Se houver dispositivos envolvidos, mencione a plataforma, se souber. Não inclua senhas, dados de clientes ou código confidencial.',
          timeframe: 'Quando gostaria de começar?',
          nextMonth: 'No próximo mês',
          nextQuarter: 'Nos próximos três meses',
          exploring: 'Ainda estou avaliando',
          budget: 'O preço mensal de referência cabe no seu orçamento?',
          priceFits: 'Sim, cabe no orçamento',
          reviewBudget: 'Preciso avaliar',
          select: 'Selecione uma opção',
          consent:
            'Autorizo a RBX Systems a usar estes dados para avaliar esta solicitação e entrar em contato comigo por e-mail sobre esta parceria de engenharia.',
          submit: 'Enviar contexto da parceria',
          submitting: 'Enviando contexto…',
          next: 'A RBX revisará escopo e disponibilidade e responderá por e-mail. O envio não reserva capacidade nem constitui contratação.',
          successTitle: 'Contexto recebido',
          success:
            'Sua solicitação foi registrada. A RBX avaliará aderência e disponibilidade e entrará em contato por e-mail. Nenhuma reunião é agendada automaticamente.',
          verifyIdle: 'Verificar que não sou um robô',
          verifyLoading: 'Verificando…',
          verifySuccess: 'Verificado',
          verifyError: 'A verificação falhou. Tente novamente.',
          errors: {
            required: 'Preencha os campos obrigatórios e confira seu e-mail.',
            length: 'Um dos campos excede o tamanho permitido. Reduza o texto antes de enviar.',
            url: 'Use uma URL pública http:// ou https://, sem credenciais de acesso.',
            consent: 'Autorize o contato sobre esta solicitação antes de enviar.',
            verification: 'Conclua a verificação contra abuso antes de enviar.',
            rejected: 'Não foi possível aceitar o envio. Confira os dados e tente novamente.',
            expired:
              'A verificação expirou. Verifique novamente antes de reenviar. Suas respostas foram preservadas.',
            limited: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
            uncertain:
              'Não conseguimos confirmar o recebimento. Seu contexto pode ter chegado. Confira seu e-mail antes de reenviar para evitar duplicidade. Suas respostas foram preservadas.'
          }
        }
  );

  let name = $state('');
  let email = $state('');
  let company = $state('');
  let productUrl = $state('');
  let stage = $state('');
  let objective = $state('');
  let timeframe = $state('');
  let budget = $state('');
  let commercialConsent = $state(false);
  let ready = $state(false);
  let website = $state('');
  let altchaPayload = $state<string | null>(null);
  let altchaWidget: AltchaWidget | undefined = $state();
  let form: HTMLFormElement | undefined = $state();
  let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
  let error = $state<QualificationError | 'rejected' | 'expired' | 'limited' | 'uncertain'>(
    'required'
  );
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  let started = false;

  const commsBase = getCommsBaseUrl();
  const challengeUrl = `${commsBase}/api/altcha-challenge`;
  const analytics = $derived({ locale, surface: 'partnership' as const, entry: 'form' as const });

  onMount(() => {
    ready = true;
  });

  onDestroy(() => {
    destroyed = true;
    controller?.abort();
    clearTimeout(timer);
  });

  function resetVerification() {
    altchaPayload = null;
    altchaWidget?.reset();
  }

  function markStarted() {
    if (started) return;
    started = true;
    trackPartnershipEvent('form_start', analytics);
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (status === 'submitting' || status === 'success' || !form?.reportValidity()) return;

    const submission = buildQualificationSubmission(
      {
        name,
        email,
        company,
        productUrl,
        stage,
        objective,
        timeframe,
        budget,
        commercialConsent,
        website
      },
      locale,
      partnershipTerms,
      altchaWidget?.getValue() ?? altchaPayload,
      getPartnershipAttribution()
    );
    if (!submission.ok) {
      error = submission.error;
      status = 'error';
      trackPartnershipEvent('form_error', {
        ...analytics,
        error: submission.error === 'verification' ? 'challenge' : 'validation'
      });
      return;
    }

    // Lock before the first await. One POST per explicit submit, no auto retry.
    status = 'submitting';
    trackPartnershipEvent('form_submit', analytics);
    const requestController = new AbortController();
    controller = requestController;
    timer = setTimeout(() => requestController.abort(), 18_000);

    try {
      const response = await fetch(`${commsBase}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission.payload),
        signal: requestController.signal
      });

      if (destroyed) return;
      if (!response.ok) {
        error =
          response.status === 403
            ? 'expired'
            : response.status === 429
              ? 'limited'
              : response.status >= 500
                ? 'uncertain'
                : 'rejected';
        status = 'error';
        resetVerification();
        trackPartnershipEvent('form_error', {
          ...analytics,
          error: response.status === 403 ? 'challenge' : 'http'
        });
        return;
      }

      const result: unknown = await response.json();
      if (destroyed) return;
      if (
        !result ||
        typeof result !== 'object' ||
        !('success' in result) ||
        result.success !== true
      ) {
        throw new Error('Unconfirmed submission');
      }

      status = 'success';
      trackPartnershipEvent('form_success', analytics);
    } catch {
      if (destroyed) return;
      // A timeout cannot prove that Comms did not persist the request.
      error = 'uncertain';
      status = 'error';
      resetVerification();
      trackPartnershipEvent('form_error', {
        ...analytics,
        error: requestController.signal.aborted ? 'timeout' : 'network'
      });
    } finally {
      clearTimeout(timer);
      controller = undefined;
    }
  }
</script>

{#if status === 'success'}
  <div class="form-card success" role="status" aria-live="polite">
    <h3>{copy.successTitle}</h3>
    <p>{copy.success}</p>
  </div>
{:else}
  <form
    method="POST"
    class="form-card"
    aria-label={copy.title}
    aria-busy={status === 'submitting'}
    bind:this={form}
    onsubmit={handleSubmit}
    oninput={markStarted}
    onchange={markStarted}
  >
    <p class="hint">{copy.required}</p>
    <noscript>
      <p>
        {locale === 'pt-BR'
          ? 'Ative o JavaScript para usar este formulário ou escreva para'
          : 'Enable JavaScript to use this form or write to'}
        <a href="mailto:contact@rbxsystems.ch">contact@rbxsystems.ch</a>.
      </p>
    </noscript>

    <fieldset disabled={!ready || status === 'submitting'}>
      <div class="honeypot" aria-hidden="true">
        <label for="partnership-website">Website</label>
        <input
          id="partnership-website"
          name="website"
          tabindex="-1"
          autocomplete="off"
          bind:value={website}
        />
      </div>

      <div class="row">
        <div class="field">
          <label for="partnership-name">{copy.name}</label>
          <input
            id="partnership-name"
            name="name"
            autocomplete="name"
            required
            maxlength={qualificationLimits.name}
            bind:value={name}
          />
        </div>
        <div class="field">
          <label for="partnership-email">{copy.email}</label>
          <input
            id="partnership-email"
            name="email"
            type="email"
            autocomplete="email"
            required
            maxlength={qualificationLimits.email}
            bind:value={email}
          />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="partnership-company">{copy.company}</label>
          <input
            id="partnership-company"
            name="company"
            autocomplete="organization"
            required
            maxlength={qualificationLimits.company}
            bind:value={company}
          />
        </div>
        <div class="field">
          <label for="partnership-stage">{copy.stage}</label>
          <select id="partnership-stage" name="stage" required bind:value={stage}>
            <option value="" disabled>{copy.select}</option>
            <option value="production">{copy.production}</option>
            <option value="pilot">{copy.pilot}</option>
            <option value="planning">{copy.planning}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="partnership-product-url">{copy.url}</label>
        <input
          id="partnership-product-url"
          name="product_url"
          type="url"
          placeholder="https://"
          maxlength={qualificationLimits.productUrl}
          bind:value={productUrl}
        />
      </div>

      <div class="field">
        <label for="partnership-objective">{copy.objective}</label>
        <textarea
          id="partnership-objective"
          name="objective"
          required
          rows="4"
          maxlength={qualificationLimits.objective}
          aria-describedby="partnership-objective-hint"
          bind:value={objective}
        ></textarea>
        <p class="hint" id="partnership-objective-hint">{copy.objectiveHint}</p>
      </div>

      <div class="row">
        <div class="field">
          <label for="partnership-timeframe">{copy.timeframe}</label>
          <select id="partnership-timeframe" name="timeframe" required bind:value={timeframe}>
            <option value="" disabled>{copy.select}</option>
            <option value="next-month">{copy.nextMonth}</option>
            <option value="next-quarter">{copy.nextQuarter}</option>
            <option value="exploring">{copy.exploring}</option>
          </select>
        </div>
        <div class="field">
          <label for="partnership-budget">{copy.budget}</label>
          <p class="price-reference">
            {formatPartnershipPrice(locale)} / {locale === 'en' ? 'month' : 'mês'}
          </p>
          <select id="partnership-budget" name="budget" required bind:value={budget}>
            <option value="" disabled>{copy.select}</option>
            <option value="yes">{copy.priceFits}</option>
            <option value="review">{copy.reviewBudget}</option>
          </select>
        </div>
      </div>

      <div class="consent">
        <input
          id="partnership-consent"
          name="commercial_consent"
          type="checkbox"
          required
          bind:checked={commercialConsent}
        />
        <label for="partnership-consent">{copy.consent}</label>
      </div>

      <AltchaWidget
        bind:this={altchaWidget}
        challengeurl={challengeUrl}
        onstatechange={(payload) => (altchaPayload = payload)}
        disabled={status === 'submitting'}
        labels={{
          idle: copy.verifyIdle,
          loading: copy.verifyLoading,
          verified: copy.verifySuccess,
          error: copy.verifyError
        }}
      />

      {#if status === 'error'}
        <p class="error" role="alert">{copy.errors[error]}</p>
      {/if}

      <button class="submit" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? copy.submitting : copy.submit}
      </button>
      <p class="hint">{copy.next}</p>
    </fieldset>
  </form>
{/if}

<style>
  .form-card {
    position: relative;
    padding: var(--s-6);
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  h3 {
    margin: 0 0 var(--s-3);
    color: var(--fg-0);
    font-size: var(--text-xl);
  }

  p {
    margin: 0;
    line-height: 1.6;
  }

  fieldset {
    min-width: 0;
    margin: var(--s-5) 0 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s-5);
  }

  fieldset:disabled {
    opacity: 0.65;
    cursor: wait;
  }

  .row {
    display: grid;
    gap: var(--s-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    min-width: 0;
  }

  .field label {
    font-size: var(--text-sm);
    color: var(--fg-1);
    font-weight: 500;
  }

  input,
  select,
  textarea {
    box-sizing: border-box;
    min-width: 0;
    padding: var(--s-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg-0);
    color: var(--fg-0);
    font: inherit;
  }

  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--cyan-brand);
    outline-offset: 3px;
  }

  textarea {
    resize: vertical;
  }

  .hint {
    font-size: var(--text-xs);
    color: var(--fg-2);
  }

  .price-reference {
    color: var(--cyan-brand);
    font-size: var(--text-sm);
    font-family: var(--font-mono);
  }

  .consent {
    display: flex;
    align-items: flex-start;
    gap: var(--s-3);
    color: var(--fg-1);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .consent input {
    flex-shrink: 0;
    width: 1.125rem;
    height: 1.125rem;
    margin-top: 0.25rem;
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
    border: 1px solid var(--err);
    border-radius: var(--radius-sm);
    color: var(--err);
    padding: var(--s-3);
    font-size: var(--text-sm);
  }

  .submit {
    padding: var(--s-3) var(--s-5);
    border: 1px solid var(--cyan-brand);
    border-radius: var(--radius-sm);
    background: var(--cyan-brand);
    color: var(--bg-0);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .submit:disabled {
    cursor: wait;
  }

  .success {
    border-color: var(--cyan-brand);
    color: var(--fg-1);
  }

  @media (min-width: 640px) {
    .row {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }

  @media (max-width: 480px) {
    .form-card {
      padding: var(--s-4);
    }
  }
</style>
