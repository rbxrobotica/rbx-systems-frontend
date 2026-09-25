<script lang="ts">
  import { untrack } from 'svelte';
  import { t, tl } from '$lib/i18n/translate';
  import { getCommerceBaseUrl } from '$lib/api/commerce';
  import {
    trackEvent,
    FORM_SUBMIT,
    FORM_SUCCESS,
    FORM_ERROR,
    SUBSCRIBE_OPEN,
    SUBSCRIBE_STEP,
    PLAN_SELECT,
    BILLING_TOGGLE,
    AUDIENCE_TOGGLE
  } from '$lib/analytics/events';
  import { getAttributionPayload } from '$lib/analytics/utm';
  import { checkoutAttemptID, clearCheckoutAttempt } from '$lib/briefing/checkout-attempt';
  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import {
    BRIEFING_HUB_URL,
    PAYMENT_METHODS,
    SHOW_LIST_PRICE,
    TEAM_MIN_SEATS,
    TEAM_MAX_SEATS,
    clampSeats,
    currencyForLocale,
    findPlan,
    formatAmount,
    formatPhoneDisplay,
    normalizePhone,
    perMonthAmount,
    totalAmount
  } from '$lib/briefing/catalog.js';
  import type { Audience, Billing, PaymentMethod } from '$lib/briefing/catalog.js';
  import AltchaWidget from './AltchaWidget.svelte';
  import type { Locale } from '$types/content';

  type Tier = 'free' | 'pro' | 'team';
  type Step = 1 | 2 | 3;
  type Status = 'idle' | 'submitting' | 'redirecting' | 'done';
  type Outcome =
    | 'paid-redirect'
    | 'paid-confirmed'
    | 'paid-ended'
    | 'paid-price-review'
    | 'paid-no-url'
    | null;
  type Problem =
    | 'duplicate'
    | 'rate-limit'
    | 'error'
    | 'invalid-fields'
    | 'invalid-name'
    | 'invalid-email'
    | 'invalid-doc'
    | 'invalid-phone'
    | 'anti-abuse'
    | 'provider-failed'
    | null;

  interface Props {
    locale: Locale;
    /** Bindable. The parent decides when the modal opens (hero CTA, deep link). */
    open?: boolean;
    initialAudience?: Audience;
    initialBilling?: Billing;
    /** Attribution source recorded on the checkout and on analytics events. */
    source?: string;
    /** True when the page opened the modal from a ?subscribe=1 deep link. */
    deepLink?: boolean;
    onclose?: () => void;
  }

  let {
    locale,
    open = $bindable(false),
    initialAudience = 'individual',
    initialBilling = 'annual',
    source = 'briefing-btc-modal',
    deepLink = false,
    onclose
  }: Props = $props();

  // The first open of a deep-linked page is attributed to the URL; every
  // later open comes from a CTA on the page.
  let firstOpen = true;

  // Selection state. Initial values come from props once (deep links); after
  // that the modal owns them, which is why they are read under untrack.
  let audience = $state<Audience>(untrack(() => initialAudience));
  let billing = $state<Billing>(untrack(() => initialBilling));
  let tier = $state<Tier>(untrack(() => (initialAudience === 'team' ? 'team' : 'pro')));
  let step = $state<Step>(1);
  let seats = $state(TEAM_MIN_SEATS);

  // Details form.
  let name = $state('');
  let email = $state('');
  let doc = $state('');
  let phone = $state('');
  let company = $state('');
  // Payment method for the selected currency; the first entry is the default
  // (Pix on BRL, USDT through BTCPay on USD, card through Payrexx second).
  let method = $state<PaymentMethod>(untrack(() => PAYMENT_METHODS[currencyForLocale(locale)][0]));
  let website = $state(''); // honeypot
  let altchaPayload = $state<string | null>(null);
  let altchaWidget: AltchaWidget | undefined = $state();

  let status = $state<Status>('idle');
  let outcome = $state<Outcome>(null);
  let problem = $state<Problem>(null);
  let dialogEl: HTMLDivElement | undefined = $state();
  let opener: HTMLElement | null = null;

  const currency = $derived(currencyForLocale(locale));
  const isBRL = $derived(currency === 'BRL');
  const proPlan = $derived(findPlan('individual', billing, currency));
  const teamPlan = $derived(findPlan('team', billing, currency));
  const selectedPlan = $derived(tier === 'team' ? teamPlan : tier === 'pro' ? proPlan : null);
  const total = $derived(selectedPlan ? totalAmount(selectedPlan, seats) : 0);
  const busy = $derived(status === 'submitting' || status === 'redirecting');
  const normalizedPhone = $derived(normalizePhone(phone, locale));
  const phoneDisplay = $derived(normalizedPhone ? formatPhoneDisplay(normalizedPhone) : '');
  const steps = $derived(tl(locale, 'briefing.subscribe.steps'));

  const tr = (key: string) => t(locale, `briefing.subscribe.${key}`);
  const list = (key: string) => tl(locale, `briefing.subscribe.${key}`);
  const fmt = (amount: number) => formatAmount(amount, currency, locale);
  const fill = (text: string, values: Record<string, string>) =>
    Object.entries(values).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), text);

  const seatsHint = $derived(
    fill(tr('team.seatsHint'), { min: String(TEAM_MIN_SEATS), max: String(TEAM_MAX_SEATS) })
  );
  const moreSeats = $derived(fill(tr('team.moreSeats'), { max: String(TEAM_MAX_SEATS) }));
  const discountBadge = $derived(
    billing === 'annual' ? tr('billing.annualBadge') : tr('billing.monthlyBadge')
  );
  const monthlyListLabel = $derived(
    `${fmt(proPlan.listAmount / (billing === 'annual' ? 12 : 1))}${tr('pro.perMonth')}`
  );
  const billedNote = (amount: number) =>
    billing === 'annual'
      ? fill(tr('pro.billedAnnually'), { total: fmt(amount) })
      : tr('pro.billedMonthly');

  const heading = $derived(
    step === 3
      ? tr('done.title')
      : step === 2
        ? tr('details.title')
        : audience === 'team'
          ? tr('teamTitle')
          : tr('title')
  );

  const methods = $derived(PAYMENT_METHODS[currency]);
  const methodText = (m: PaymentMethod) =>
    m === 'pix'
      ? tr('details.methodPix')
      : m === 'usdt'
        ? tr('details.methodUsdt')
        : tr('details.methodCard');

  const altchaLabels = $derived({
    idle: t(locale, 'altcha.idle'),
    loading: t(locale, 'altcha.loading'),
    verified: t(locale, 'altcha.verified'),
    error: t(locale, 'altcha.error')
  });

  const commerceBase = getCommerceBaseUrl();
  const challengeUrl = `${commerceBase}/api/public/altcha-challenge`;

  // Scroll lock, focus and the open event. Cleanup restores the page and the
  // element that opened the modal.
  $effect(() => {
    if (!open) return;
    opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => dialogEl?.focus());
    trackEvent(SUBSCRIBE_OPEN, {
      source,
      audience,
      billing,
      entry: firstOpen && deepLink ? 'url' : 'cta'
    });
    firstOpen = false;
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  });

  function close() {
    if (busy) return;
    open = false;
    // Every reopen starts at the plan chooser with a fresh anti-abuse token
    // (payloads are single use); typed details are kept as a convenience.
    if (status === 'done') reset();
    else {
      step = 1;
      status = 'idle';
      problem = null;
      resetAntiAbuse();
    }
    stripDeepLink();
    onclose?.();
  }

  // Once closed, a reload must not reopen the modal: drop the deep-link
  // parameters from the address bar without a navigation.
  function stripDeepLink() {
    if (!browser) return;
    const url = new URL(window.location.href);
    const keys = ['subscribe', 'assinar', 'audience', 'billing'];
    if (!keys.some((k) => url.searchParams.has(k))) return;
    for (const k of keys) url.searchParams.delete(k);
    replaceState(url, {});
  }

  // Coming back from the payment page with the browser's back button restores
  // the page from the bfcache, still frozen in the redirecting state.
  function onPageShow(e: PageTransitionEvent) {
    if (!e.persisted || status !== 'redirecting') return;
    status = 'idle';
    step = 2;
    outcome = null;
    resetAntiAbuse();
  }

  // Altcha payloads are single-use: after any server round trip the visitor
  // has to verify again.
  function resetAntiAbuse() {
    altchaWidget?.reset();
    altchaPayload = null;
  }

  function reset() {
    step = 1;
    status = 'idle';
    outcome = null;
    problem = null;
    altchaPayload = null;
  }

  function onOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab' || !dialogEl) return;
    const focusables = Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.matches(':disabled') && el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogEl)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function setAudience(next: Audience) {
    if (audience === next) return;
    audience = next;
    tier = next === 'team' ? 'team' : 'pro';
    trackEvent(AUDIENCE_TOGGLE, { source, audience: next });
  }

  function setBilling(next: Billing) {
    if (billing === next) return;
    billing = next;
    trackEvent(BILLING_TOGGLE, { source, billing: next });
  }

  function goToStep(next: Step) {
    step = next;
    problem = null;
    trackEvent(SUBSCRIBE_STEP, { source, step: next });
    queueMicrotask(() => dialogEl?.focus());
  }

  function selectTier(next: Tier) {
    tier = next;
    trackEvent(PLAN_SELECT, {
      source,
      plan: next === 'free' ? 'free' : (selectedPlanFor(next)?.id ?? next),
      billing,
      audience,
      seats: next === 'team' ? seats : 1
    });
    // Free is not a checkout: reading happens in the logged-in area, and the
    // Google sign-in there is the whole signup (ADR-0014, ADR-0007 baseline grant).
    if (next === 'free') {
      window.location.assign(BRIEFING_HUB_URL);
      return;
    }
    goToStep(2);
  }

  function selectedPlanFor(candidate: Tier) {
    return candidate === 'team' ? teamPlan : candidate === 'pro' ? proPlan : null;
  }

  function adjustSeats(delta: number) {
    seats = clampSeats(seats + delta);
  }

  function normalizeSeats() {
    seats = clampSeats(Number(seats));
  }

  function digits(value: string): string {
    return value.replace(/\D/g, '');
  }

  const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Which field a validation problem points at, so focus can move there.
  const problemField: Partial<Record<NonNullable<Problem>, string>> = {
    'invalid-name': 'bsm-name',
    'invalid-email': 'bsm-email',
    'invalid-doc': 'bsm-doc',
    'invalid-phone': 'bsm-phone'
  };

  function validate(): Problem {
    if (name.trim().length < 2) return 'invalid-name';
    if (!emailRE.test(email.trim())) return 'invalid-email';
    if (isBRL && ![11, 14].includes(digits(doc).length)) return 'invalid-doc';
    if (!normalizedPhone) return 'invalid-phone';
    const payload = altchaWidget?.getValue() ?? altchaPayload;
    if (!payload) return 'anti-abuse';
    return null;
  }

  function focusProblem(p: Problem) {
    const id = p ? problemField[p] : undefined;
    if (!id) return;
    queueMicrotask(() => document.getElementById(id)?.focus());
  }

  async function submit(ev: SubmitEvent) {
    ev.preventDefault();
    if (busy) return;
    problem = validate();
    if (problem) {
      focusProblem(problem);
      return;
    }

    const payload = altchaWidget?.getValue() ?? altchaPayload ?? '';
    const offer = selectedPlan?.id ?? tier;
    status = 'submitting';
    trackEvent(FORM_SUBMIT, { source, offer, method });

    try {
      outcome = await submitPaid(payload);
      trackEvent(FORM_SUCCESS, { source, offer, method });
      if (outcome === 'paid-redirect') {
        status = 'redirecting';
        step = 3;
        return;
      }
      status = 'done';
      step = 3;
    } catch (err) {
      status = 'idle';
      problem = err instanceof CheckoutError ? err.problem : 'error';
      resetAntiAbuse();
      trackEvent(FORM_ERROR, { source, offer, reason: problem ?? 'error' });
    }
  }

  class CheckoutError extends Error {
    problem: Problem;
    constructor(problem: Problem) {
      super(problem ?? 'error');
      this.problem = problem;
    }
  }

  async function submitPaid(altcha: string): Promise<Outcome> {
    const plan = selectedPlan;
    if (!plan) throw new CheckoutError('error');
    const normalizedDoc = doc.replace(/\D/g, '');
    const body: Record<string, unknown> = {
      plan_id: plan.id,
      checkout_attempt_id: await checkoutAttemptID({
        email: email.trim(),
        name: name.trim(),
        doc: isBRL ? normalizedDoc : '',
        phone: normalizedPhone ?? '',
        company: plan.audience === 'team' ? company.trim() : '',
        planID: plan.id,
        method,
        seats: plan.audience === 'team' ? clampSeats(seats) : 1
      }),
      customer_name: name,
      customer_email: email,
      customer_phone: normalizedPhone,
      payment_method: method,
      altcha,
      website,
      source,
      ...getAttributionPayload()
    };
    if (isBRL) body.customer_doc = normalizedDoc;
    if (plan.audience === 'team') {
      body.seats = clampSeats(seats);
      if (company.trim()) body.company_name = company.trim();
    }
    const res = await fetch(`${commerceBase}/api/public/briefing-btc/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.status === 409) throw new CheckoutError('duplicate');
    if (res.status === 429) throw new CheckoutError('rate-limit');
    if (res.status === 403) throw new CheckoutError('anti-abuse');
    if (res.status === 400) throw new CheckoutError('invalid-fields');
    if (!res.ok) throw new CheckoutError('error');
    const data = (await res.json()) as {
      checkout_url?: string;
      provisioning?: string;
      status_token?: string;
      plan_id?: string;
      amount?: number;
      currency?: string;
    };
    if (data.checkout_url) {
      let paymentURL: URL;
      try {
        paymentURL = new URL(data.checkout_url);
      } catch {
        return 'paid-no-url';
      }
      if (paymentURL.protocol !== 'https:') return 'paid-no-url';
      const expectedAmount = totalAmount(plan, plan.audience === 'team' ? clampSeats(seats) : 1);
      if (
        data.plan_id !== plan.id ||
        data.amount !== expectedAmount ||
        data.currency !== plan.currency
      ) {
        return 'paid-price-review';
      }
      window.location.assign(paymentURL.toString());
      return 'paid-redirect';
    }
    // The provider refused the request: the subscription exists locally but
    // no invoice was produced, so the visitor is told to try again rather
    // than to wait for a link that will not come.
    if (data.provisioning === 'failed') {
      // Support must resolve the failed pending row before a fresh attempt.
      clearCheckoutAttempt();
      throw new CheckoutError('provider-failed');
    }
    if (data.status_token) {
      try {
        const statusRes = await fetch(`${commerceBase}/api/public/briefing-btc/checkout/status`, {
          headers: { Authorization: `Bearer ${data.status_token}` },
          cache: 'no-store'
        });
        if (statusRes.ok) {
          const checkoutStatus = (await statusRes.json()) as { payment_status?: string };
          if (checkoutStatus.payment_status === 'confirmed') return 'paid-confirmed';
          if (checkoutStatus.payment_status === 'ended') {
            clearCheckoutAttempt();
            return 'paid-ended';
          }
        }
      } catch {
        // The status service may be temporarily unavailable; show support.
      }
    }
    return 'paid-no-url';
  }

  const problemText = $derived(
    problem === 'duplicate'
      ? tr('done.duplicate')
      : problem === 'rate-limit'
        ? tr('done.rateLimit')
        : problem === 'invalid-name'
          ? tr('details.invalidName')
          : problem === 'invalid-email'
            ? tr('details.invalidEmail')
            : problem === 'invalid-doc'
              ? tr('details.invalidDoc')
              : problem === 'invalid-phone'
                ? tr('details.invalidPhone')
                : problem === 'anti-abuse'
                  ? tr('details.antiAbuse')
                  : problem === 'invalid-fields'
                    ? tr('details.invalidFields')
                    : problem === 'provider-failed'
                      ? tr('details.providerFailed')
                      : problem === 'error'
                        ? tr('done.error')
                        : ''
  );

  const doneText = $derived(
    outcome === 'paid-redirect'
      ? tr('done.paidRedirect')
      : outcome === 'paid-confirmed'
        ? tr('done.paidConfirmed')
        : outcome === 'paid-ended'
          ? tr('done.paidEnded')
          : outcome === 'paid-price-review'
            ? tr('done.paidPriceReview')
            : outcome === 'paid-no-url'
              ? tr('done.paidNoUrl')
              : ''
  );

  const submitLabel = $derived(tr('details.submitPay'));
</script>

<svelte:window onkeydown={onKeydown} onpageshow={onPageShow} />

{#if open}
  <div class="overlay" role="presentation" onclick={onOverlayClick}>
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bsm-title"
      tabindex="-1"
      bind:this={dialogEl}
    >
      <div class="hairline"></div>

      <header class="head">
        <div class="head-text">
          <span class="eyebrow">{tr('eyebrow')}</span>
          <h2 id="bsm-title">{heading}</h2>
        </div>
        <button
          type="button"
          class="close"
          onclick={close}
          aria-label={tr('close')}
          disabled={busy}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <ol class="stepper" aria-label={tr('stepLabel')}>
        {#each steps as label, i (label)}
          <li
            class:current={step === i + 1}
            class:done={step > i + 1}
            aria-current={step === i + 1 ? 'step' : undefined}
          >
            <span class="num">0{i + 1}</span>
            <span class="label">{label}</span>
          </li>
        {/each}
      </ol>

      <div class="body">
        {#if step === 1}
          <div class="controls">
            <div class="segmented" role="group" aria-label={tr('audience.label')}>
              <button
                type="button"
                class:active={audience === 'individual'}
                aria-pressed={audience === 'individual'}
                onclick={() => setAudience('individual')}
              >
                {tr('audience.individual')}
              </button>
              <button
                type="button"
                class:active={audience === 'team'}
                aria-pressed={audience === 'team'}
                onclick={() => setAudience('team')}
              >
                {tr('audience.team')}
              </button>
            </div>
            <div class="segmented" role="group" aria-label={tr('billing.label')}>
              <button
                type="button"
                class:active={billing === 'monthly'}
                aria-pressed={billing === 'monthly'}
                onclick={() => setBilling('monthly')}
              >
                {tr('billing.monthly')}
                <span class="chip">{tr('billing.monthlyBadge')}</span>
              </button>
              <button
                type="button"
                class:active={billing === 'annual'}
                aria-pressed={billing === 'annual'}
                onclick={() => setBilling('annual')}
              >
                {tr('billing.annual')}
                <span class="chip">{tr('billing.annualBadge')}</span>
              </button>
            </div>
          </div>

          {#if audience === 'individual'}
            <div class="cards">
              <article class="card" aria-labelledby="bsm-free-name">
                <div class="card-head">
                  <h3 id="bsm-free-name">{tr('free.name')}</h3>
                  <p class="tagline">{tr('free.tagline')}</p>
                </div>
                <div class="price">
                  <div class="amount">
                    <span class="value"
                      >{formatAmount(0, currency, locale, { alwaysDecimals: true })}</span
                    >
                  </div>
                  <span class="billed">{tr('free.priceNote')}</span>
                </div>
                <button type="button" class="btn secondary" onclick={() => selectTier('free')}>
                  {tr('free.cta')}
                </button>
                <ul class="features">
                  {#each list('free.features') as feature (feature)}
                    <li>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="check"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  {/each}
                </ul>
              </article>

              <article class="card featured" aria-labelledby="bsm-pro-name">
                <span class="badge">{tr('pro.badge')}</span>
                <div class="card-head">
                  <h3 id="bsm-pro-name">{tr('pro.name')}</h3>
                  <p class="tagline">{tr('pro.tagline')}</p>
                </div>
                <div class="price">
                  <div class="list-row">
                    {#if SHOW_LIST_PRICE}
                      <s class="list-price"
                        ><span class="sr-only">{tr('pro.listLabel')}: </span>{monthlyListLabel}</s
                      >
                    {/if}
                    <span class="chip discount">{discountBadge}</span>
                  </div>
                  <div class="amount">
                    <span class="value">{fmt(perMonthAmount(proPlan))}</span>
                    <span class="unit">{tr('pro.perMonth')}</span>
                  </div>
                  <span class="billed">{billedNote(proPlan.amount)}</span>
                </div>
                <button type="button" class="btn primary" onclick={() => selectTier('pro')}>
                  {tr('pro.cta')}
                </button>
                <p class="everything">{tr('pro.everythingInFree')}</p>
                <ul class="features">
                  {#each list('pro.features') as feature (feature)}
                    <li>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="check"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  {/each}
                </ul>
              </article>
            </div>
            <p class="switch-hint">
              {tr('audience.teamHint')}
              <button type="button" class="linkish" onclick={() => setAudience('team')}
                >{tr('audience.teamLink')}</button
              >
            </p>
          {:else}
            <div class="cards team">
              <article class="card featured" aria-labelledby="bsm-team-name">
                <div class="card-head">
                  <h3 id="bsm-team-name">{tr('team.name')}</h3>
                  <p class="tagline">{tr('team.tagline')}</p>
                </div>

                <div class="seats">
                  <label for="bsm-seats">{tr('team.seatsLabel')}</label>
                  <div class="seat-control">
                    <button
                      type="button"
                      onclick={() => adjustSeats(-1)}
                      aria-label={tr('team.decrease')}
                      disabled={seats <= TEAM_MIN_SEATS}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /></svg
                      >
                    </button>
                    <input
                      id="bsm-seats"
                      type="number"
                      inputmode="numeric"
                      min={TEAM_MIN_SEATS}
                      max={TEAM_MAX_SEATS}
                      bind:value={seats}
                      onblur={normalizeSeats}
                    />
                    <button
                      type="button"
                      onclick={() => adjustSeats(1)}
                      aria-label={tr('team.increase')}
                      disabled={seats >= TEAM_MAX_SEATS}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                        ><line x1="12" y1="5" x2="12" y2="19" /><line
                          x1="5"
                          y1="12"
                          x2="19"
                          y2="12"
                        /></svg
                      >
                    </button>
                  </div>
                  <span class="hint">{seatsHint}</span>
                </div>

                <div class="price">
                  <div class="list-row">
                    {#if SHOW_LIST_PRICE}
                      <s class="list-price"
                        ><span class="sr-only">{tr('pro.listLabel')}: </span>{monthlyListLabel}
                        {tr('team.perSeat')}</s
                      >
                    {/if}
                    <span class="chip discount">{discountBadge}</span>
                  </div>
                  <div class="amount">
                    <span class="value">{fmt(perMonthAmount(teamPlan))}</span>
                    <span class="unit">{tr('pro.perMonth')} {tr('team.perSeat')}</span>
                  </div>
                  <div class="total-row">
                    <span class="total-label">{tr('team.total')}</span>
                    <span class="total-value">{fmt(totalAmount(teamPlan, seats))}</span>
                    <span class="billed"
                      >{billing === 'annual'
                        ? tr('team.billedAnnually')
                        : tr('team.billedMonthly')}</span
                    >
                  </div>
                </div>
                <button type="button" class="btn primary" onclick={() => selectTier('team')}>
                  {tr('team.cta')}
                </button>
              </article>

              <aside class="card">
                <p class="everything">{tr('team.everythingInPro')}</p>
                <ul class="features">
                  {#each list('team.features') as feature (feature)}
                    <li>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="check"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  {/each}
                </ul>
                <p class="more-seats">{moreSeats}</p>
              </aside>
            </div>
            <p class="switch-hint">
              <button type="button" class="linkish" onclick={() => setAudience('individual')}
                >{tr('audience.backToIndividual')}</button
              >
            </p>
          {/if}
        {:else if step === 2}
          <form class="details" class:pending={busy} aria-busy={busy} onsubmit={submit} novalidate>
            <p class="sr-only" role="status" aria-live="polite">
              {busy ? tr('details.submitting') : ''}
            </p>
            <div class="honeypot" aria-hidden="true">
              <label for="bsm-website">Website</label>
              <input
                id="bsm-website"
                type="text"
                tabindex="-1"
                autocomplete="off"
                bind:value={website}
              />
            </div>

            <fieldset class="fields" disabled={busy}>
              <div class="row">
                <div class="field">
                  <label for="bsm-name">{tr('details.name')} *</label>
                  <input
                    id="bsm-name"
                    type="text"
                    required
                    autocomplete="name"
                    aria-invalid={problem === 'invalid-name' ? 'true' : undefined}
                    bind:value={name}
                  />
                </div>
                <div class="field">
                  <label for="bsm-email">{tr('details.email')} *</label>
                  <input
                    id="bsm-email"
                    type="email"
                    required
                    autocomplete="email"
                    aria-invalid={problem === 'invalid-email' ? 'true' : undefined}
                    bind:value={email}
                  />
                </div>
              </div>

              <div class="row">
                {#if isBRL}
                  <div class="field">
                    <label for="bsm-doc">{tr('details.doc')} *</label>
                    <input
                      id="bsm-doc"
                      type="text"
                      required
                      inputmode="numeric"
                      autocomplete="off"
                      bind:value={doc}
                    />
                    <span class="hint">{tr('details.docHint')}</span>
                  </div>
                {/if}
                <div class="field">
                  <label for="bsm-phone">{tr('details.phone')} *</label>
                  <input
                    id="bsm-phone"
                    type="tel"
                    required
                    autocomplete="tel"
                    placeholder={tr('details.phonePlaceholder')}
                    bind:value={phone}
                  />
                  <span class="hint">
                    {#if phoneDisplay}
                      {fill(tr('details.phoneNormalized'), { phone: phoneDisplay })}
                    {:else}
                      {tr('details.phoneHint')}
                    {/if}
                  </span>
                </div>
              </div>

              {#if tier === 'team'}
                <div class="row">
                  <div class="field">
                    <label for="bsm-company"
                      >{tr('details.company')}
                      <span class="opt">({tr('details.optional')})</span></label
                    >
                    <input
                      id="bsm-company"
                      type="text"
                      autocomplete="organization"
                      bind:value={company}
                    />
                    <span class="hint">{tr('details.adminHint')}</span>
                  </div>
                </div>
              {/if}

              {#if methods.length > 1}
                <fieldset class="methods">
                  <legend>{tr('details.methodLabel')}</legend>
                  {#each methods as m (m)}
                    <label class="method" class:active={method === m}>
                      <input type="radio" name="bsm-method" value={m} bind:group={method} />
                      <span>{methodText(m)}</span>
                    </label>
                  {/each}
                </fieldset>
              {/if}
            </fieldset>

            <aside class="summary" aria-label={tr('details.summary')}>
              <span class="eyebrow">{tr('details.summary')}</span>
              <dl>
                <div>
                  <dt>{tr('details.plan')}</dt>
                  <dd>{tier === 'team' ? tr('team.name') : tr('pro.name')}</dd>
                </div>
                {#if selectedPlan}
                  <div>
                    <dt>{tr('details.cycle')}</dt>
                    <dd>
                      {billing === 'annual'
                        ? tr('details.cycleAnnual')
                        : tr('details.cycleMonthly')}
                    </dd>
                  </div>
                  {#if tier === 'team'}
                    <div>
                      <dt>{tr('details.seats')}</dt>
                      <dd class="mono">{clampSeats(seats)}</dd>
                    </div>
                  {/if}
                  <div>
                    <dt>{tr('details.method')}</dt>
                    <dd>{methodText(method)}</dd>
                  </div>
                  {#if phoneDisplay}
                    <div>
                      <dt>{tr('details.phone')}</dt>
                      <dd class="mono">{phoneDisplay}</dd>
                    </div>
                  {/if}
                  <div class="total">
                    <dt>{tr('team.total')}</dt>
                    <dd class="mono">{fmt(total)}</dd>
                  </div>
                {:else}
                  <div class="total">
                    <dt>{tr('team.total')}</dt>
                    <dd class="mono">
                      {formatAmount(0, currency, locale, { alwaysDecimals: true })}
                    </dd>
                  </div>
                {/if}
              </dl>
              <p class="legal">{tr('details.legal')}</p>
            </aside>

            <div class="verify">
              {#key tier}
                <AltchaWidget
                  bind:this={altchaWidget}
                  challengeurl={challengeUrl}
                  labels={altchaLabels}
                  onstatechange={(payload) => (altchaPayload = payload)}
                  disabled={busy}
                />
              {/key}
            </div>

            {#if problem}
              {#key problem}
                <div class="error" role="alert">{problemText}</div>
              {/key}
            {/if}

            <div class="actions">
              <button type="button" class="btn ghost" onclick={() => goToStep(1)} disabled={busy}>
                {tr('details.back')}
              </button>
              <button type="submit" class="btn primary" disabled={busy}>
                {#if busy}
                  <span class="spinner" aria-hidden="true"></span>
                  <span>{tr('details.submitting')}</span>
                {:else}
                  <span>{submitLabel}</span>
                {/if}
              </button>
            </div>
          </form>
        {:else}
          <div class="confirmation" role="status">
            <div class="icon-wrap" aria-hidden="true">
              {#if status === 'redirecting'}
                <span class="spinner large"></span>
              {:else}
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
              {/if}
            </div>
            <p>{doneText}</p>
            {#if status !== 'redirecting'}
              <button type="button" class="btn secondary" onclick={close}>{tr('done.close')}</button
              >
            {/if}
          </div>
        {/if}
      </div>

      <footer class="foot">
        <span>{tr('footer.note')}</span>
        <span>{tr('footer.governance')} <a href="/legal">{tr('footer.legal')}</a></span>
      </footer>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 120;
    background: var(--bg-overlay);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--s-6) var(--s-4);
    overflow-y: auto;
  }

  .modal {
    position: relative;
    width: min(64rem, 100%);
    max-height: calc(100vh - 2 * var(--s-6));
    display: flex;
    flex-direction: column;
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-overlay);
    animation: rise var(--dur-slow) var(--ease-out);
    outline: none;
  }

  .modal:focus-visible {
    box-shadow: var(--shadow-overlay), var(--ring-focus);
  }

  @keyframes rise {
    from {
      transform: translateY(12px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .modal {
      animation: none;
    }
  }

  .hairline {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-brand), transparent);
    opacity: 0.8;
  }

  .head {
    display: flex;
    justify-content: space-between;
    gap: var(--s-4);
    padding: var(--s-5) var(--s-6) var(--s-4);
  }

  .head-text {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-brand);
    font-weight: 600;
  }

  h2 {
    font-size: var(--text-2xl);
    font-weight: 400;
    letter-spacing: var(--track-tight);
    line-height: var(--lead-snug);
  }

  .close {
    align-self: flex-start;
    width: 2.75rem;
    height: 2.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--fg-2);
    cursor: pointer;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }

  .close svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .close:hover:not(:disabled) {
    color: var(--fg-0);
    border-color: var(--border-strong);
  }

  .close:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .stepper {
    list-style: none;
    margin: 0;
    padding: 0 var(--s-6);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .stepper li {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    padding: var(--s-3) 0;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-3);
    border-bottom: 1px solid transparent;
    margin-bottom: -1px;
  }

  .stepper li .num {
    font-variant-numeric: tabular-nums;
  }

  .stepper li.done {
    color: var(--fg-2);
  }

  .stepper li.current {
    color: var(--cyan-brand);
    border-bottom-color: var(--cyan-brand);
  }

  .body {
    padding: var(--s-5) var(--s-6) var(--s-6);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--s-5);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-3);
    justify-content: space-between;
  }

  .segmented {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-0);
    padding: 2px;
    gap: 2px;
  }

  .segmented button {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    min-height: 2.5rem;
    padding: 0 var(--s-4);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--fg-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    cursor: pointer;
    transition:
      color var(--dur) var(--ease),
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }

  .segmented button:hover {
    color: var(--fg-0);
  }

  .segmented button.active {
    color: var(--cyan-brand);
    background: var(--cyan-subtle);
    border-color: var(--cyan-dim);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--s-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    letter-spacing: var(--track-wide);
    text-transform: uppercase;
    color: var(--fg-1);
    white-space: nowrap;
  }

  .segmented button.active .chip {
    border-color: var(--cyan-dim);
    color: var(--cyan-brand);
  }

  .chip.discount {
    border-color: var(--cyan-dim);
    color: var(--cyan-brand);
    background: var(--cyan-subtle);
  }

  .cards {
    display: grid;
    gap: var(--s-4);
  }

  @media (min-width: 720px) {
    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .cards.team {
      grid-template-columns: 1.2fr 0.8fr;
    }
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
    padding: var(--s-5);
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .card.featured {
    border-color: var(--cyan-dim);
    background: linear-gradient(180deg, rgba(0, 255, 255, 0.05), transparent 40%), var(--bg-2);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-2) var(--s-4);
    padding: var(--s-3) var(--s-6);
    border-top: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--track-wide);
    color: var(--fg-2);
  }

  .foot a {
    color: var(--fg-1);
    border-bottom-color: var(--border-strong);
  }

  .badge {
    position: absolute;
    top: calc(-1 * var(--s-3));
    left: var(--s-5);
    padding: var(--s-1) var(--s-3);
    background: var(--bg-1);
    border: 1px solid var(--cyan-dim);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-brand);
  }

  .card-head {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
  }

  .card h3 {
    font-size: var(--text-xl);
    font-weight: 500;
    line-height: var(--lead-snug);
  }

  .tagline {
    font-size: var(--text-sm);
    color: var(--fg-2);
  }

  .price {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    padding-top: var(--s-3);
    border-top: 1px solid var(--border);
  }

  .list-row {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    flex-wrap: wrap;
  }

  .list-price {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--fg-3);
    text-decoration: line-through;
    text-decoration-color: var(--fg-2);
    font-variant-numeric: tabular-nums;
  }

  .amount {
    display: flex;
    align-items: baseline;
    gap: var(--s-1);
  }

  .amount .value {
    font-family: var(--font-mono);
    font-size: var(--text-3xl);
    font-weight: 400;
    line-height: var(--lead-tight);
    letter-spacing: var(--track-tight);
    color: var(--fg-0);
    font-variant-numeric: tabular-nums;
  }

  .amount .unit {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--fg-2);
  }

  .billed {
    font-size: var(--text-sm);
    color: var(--fg-2);
  }

  .total-row {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--s-3);
    align-items: baseline;
    margin-top: var(--s-2);
    padding-top: var(--s-2);
    border-top: 1px solid var(--border);
  }

  .total-label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-2);
  }

  .total-value {
    font-family: var(--font-mono);
    font-size: var(--text-xl);
    color: var(--fg-0);
    font-variant-numeric: tabular-nums;
  }

  .total-row .billed {
    grid-column: 2;
  }

  .everything {
    font-size: var(--text-sm);
    color: var(--fg-1);
    font-weight: 500;
  }

  .features {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  .features li {
    display: flex;
    align-items: flex-start;
    gap: var(--s-2);
    font-size: var(--text-sm);
    color: var(--fg-1);
    line-height: var(--lead-body);
  }

  .check {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    margin-top: 0.2rem;
    color: var(--cyan-brand);
  }

  .more-seats {
    font-size: var(--text-sm);
    color: var(--fg-2);
    padding-top: var(--s-3);
    border-top: 1px solid var(--border);
  }

  .switch-hint {
    font-size: var(--text-sm);
    color: var(--fg-2);
    display: flex;
    gap: var(--s-2);
    flex-wrap: wrap;
    align-items: center;
  }

  .linkish {
    background: none;
    border: none;
    border-bottom: 1px solid var(--border-strong);
    padding: 0;
    color: var(--fg-0);
    font: inherit;
    cursor: pointer;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }

  .linkish:hover {
    color: var(--cyan-brand);
    border-bottom-color: var(--cyan-brand);
  }

  .seats {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  .seats label,
  .field label,
  .summary .eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-muted);
    font-weight: 500;
  }

  .seat-control {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.03);
    width: fit-content;
  }

  .seat-control button {
    width: 2.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--fg-1);
    cursor: pointer;
  }

  .seat-control button svg {
    width: 1rem;
    height: 1rem;
  }

  .seat-control button:hover:not(:disabled) {
    color: var(--cyan-brand);
  }

  .seat-control button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .seat-control input {
    width: 4.5rem;
    min-height: 2.75rem;
    text-align: center;
    background: transparent;
    border: none;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    color: var(--fg-0);
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-variant-numeric: tabular-nums;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .seat-control input::-webkit-outer-spin-button,
  .seat-control input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .seat-control input:focus {
    outline: none;
    box-shadow: inset 0 0 0 1px var(--cyan-brand);
  }

  .hint {
    font-size: var(--text-xs);
    color: var(--fg-2);
  }

  .details {
    display: grid;
    gap: var(--s-5);
    grid-template-areas:
      'fields'
      'summary'
      'verify'
      'error'
      'actions';
  }

  @media (min-width: 720px) {
    .details {
      grid-template-columns: 1.3fr 0.7fr;
      grid-template-areas:
        'fields summary'
        'verify summary'
        'error summary'
        'actions summary';
      align-items: start;
    }
  }

  .details.pending {
    opacity: 0.7;
    pointer-events: none;
  }

  .fields {
    grid-area: fields;
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
    border: none;
    margin: 0;
    padding: 0;
    min-width: 0;
  }

  .row {
    display: grid;
    gap: var(--s-4);
  }

  @media (min-width: 640px) {
    .row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .row > .field:only-child {
      grid-column: 1 / -1;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    min-width: 0;
  }

  .methods {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    border: none;
    margin: 0;
    padding: 0;
    min-width: 0;
  }

  .methods legend {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-muted);
    font-weight: 500;
    padding: 0;
    margin-bottom: var(--s-2);
  }

  .method {
    display: flex;
    align-items: center;
    gap: var(--s-3);
    min-height: 2.75rem;
    padding: var(--s-2) var(--s-4);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.03);
    color: var(--fg-1);
    cursor: pointer;
    transition:
      border-color var(--dur) var(--ease),
      color var(--dur) var(--ease);
  }

  .method.active {
    border-color: var(--cyan-dim);
    color: var(--fg-0);
    background: var(--cyan-subtle);
  }

  .method input {
    accent-color: var(--cyan-brand);
    width: 1rem;
    height: 1rem;
    margin: 0;
  }

  .field .opt {
    text-transform: none;
    letter-spacing: 0;
    color: var(--fg-3);
  }

  .field input {
    min-height: 2.75rem;
    padding: var(--s-2) var(--s-4);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--fg-0);
    font-size: var(--text-base);
    transition:
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .field input::placeholder {
    color: var(--fg-3);
  }

  .field input:focus {
    outline: none;
    border-color: var(--cyan-brand);
    box-shadow: 0 0 0 2px rgba(34, 229, 229, 0.15);
  }

  .summary {
    grid-area: summary;
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    padding: var(--s-4);
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .summary dl {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  .summary dl > div {
    display: flex;
    justify-content: space-between;
    gap: var(--s-3);
    font-size: var(--text-sm);
  }

  .summary dt {
    color: var(--fg-2);
  }

  .summary dd {
    margin: 0;
    color: var(--fg-0);
    text-align: right;
  }

  .summary dd.mono,
  .mono {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .summary dl > div.total {
    padding-top: var(--s-2);
    border-top: 1px solid var(--border);
    font-size: var(--text-base);
  }

  .summary dl > div.total dd {
    font-size: var(--text-lg);
    color: var(--cyan-brand);
  }

  .legal {
    font-size: var(--text-xs);
    color: var(--fg-2);
    line-height: var(--lead-body);
  }

  .verify {
    grid-area: verify;
  }

  .error {
    grid-area: error;
    padding: var(--s-3) var(--s-4);
    border: 1px solid var(--err-subtle);
    border-radius: var(--radius-sm);
    background: var(--err-subtle);
    color: var(--err);
    font-size: var(--text-sm);
  }

  .actions {
    grid-area: actions;
    display: flex;
    gap: var(--s-3);
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-2);
    min-height: 2.75rem;
    padding: var(--s-2) var(--s-5);
    border-radius: var(--radius-sm);
    font-size: var(--text-base);
    font-weight: 600;
    letter-spacing: var(--track-wide);
    cursor: pointer;
    transition:
      filter var(--dur) var(--ease),
      opacity var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      color var(--dur) var(--ease);
  }

  .btn.primary {
    border: none;
    background: linear-gradient(90deg, var(--cyan-signal), var(--cyan-brand));
    color: var(--bg-0);
  }

  .btn.primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .btn.secondary {
    background: var(--cyan-subtle);
    border: 1px solid var(--cyan-dim);
    color: var(--cyan-brand);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    font-weight: 500;
  }

  .btn.secondary:hover:not(:disabled) {
    background: rgba(0, 255, 255, 0.12);
    border-color: var(--cyan-brand);
    color: var(--cyan-signal);
  }

  .btn.ghost {
    background: transparent;
    border: 1px solid var(--border-strong);
    color: var(--fg-1);
    font-weight: 500;
  }

  .btn.ghost:hover:not(:disabled) {
    color: var(--fg-0);
    border-color: var(--fg-2);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .confirmation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: var(--s-4);
    min-height: 16rem;
    padding: var(--s-6) 0;
  }

  .confirmation p {
    max-width: 32rem;
    color: var(--fg-1);
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background: var(--cyan-subtle);
    color: var(--cyan-brand);
  }

  .icon {
    width: 1.75rem;
    height: 1.75rem;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(7, 8, 10, 0.3);
    border-top-color: var(--bg-0);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner.large {
    width: 1.5rem;
    height: 1.5rem;
    border-color: rgba(34, 229, 229, 0.25);
    border-top-color: var(--cyan-brand);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 639px) {
    .overlay {
      padding: 0;
      align-items: stretch;
    }
    .modal {
      width: 100%;
      max-height: none;
      min-height: 100dvh;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }
    .head,
    .body {
      padding-left: var(--s-4);
      padding-right: var(--s-4);
    }
    .stepper {
      padding: 0 var(--s-4);
    }
    .foot {
      padding: var(--s-3) var(--s-4);
    }
    .stepper .label {
      display: none;
    }
    .stepper li.current .label {
      display: inline;
    }
    .controls {
      flex-direction: column;
    }
    .segmented {
      width: 100%;
    }
    .segmented button {
      flex: 1;
      justify-content: center;
      flex-wrap: wrap;
      padding: var(--s-2);
      min-height: 2.75rem;
    }
    .actions {
      flex-direction: column-reverse;
    }
    .actions .btn {
      width: 100%;
    }
  }
</style>
