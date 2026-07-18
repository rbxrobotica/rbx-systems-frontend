<script lang="ts">
  import { _ } from 'svelte-i18n';
  import ContactForm from './ContactForm.svelte';
  import WhatsAppDrawer from './WhatsAppDrawer.svelte';

  interface Props {
    source?: string;
    heading?: string;
    body?: string;
  }

  let { source = 'site', heading, body }: Props = $props();
</script>

<section id="contact" class="contact">
  <div class="intro">
    <h2>{heading ?? $_('contact.heading')}</h2>
    <p>{body ?? $_('contact.body')}</p>
  </div>

  <div class="grid">
    <div class="info">
      <div class="card">
        <div class="hairline"></div>
        <div class="corners" aria-hidden="true"></div>
        <div class="body">
          <div>
            <h3>{$_('contact.whatsappLabel')}</h3>
            <p class="note">{body ?? $_('contact.body')}</p>
            {#snippet waTrigger(open: () => void)}
              <button type="button" class="wa-button" onclick={open}>
                <svg viewBox="0 0 24 24" fill="currentColor" class="icon-small">
                  <path
                    d="M17.6 6.32A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.88 12.15l-1.08 3.94 4.03-1.06A7.93 7.93 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.68ZM12 17.5a5.46 5.46 0 0 1-2.8-.77l-.2-.12-1.66.44.44-1.62-.14-.22a5.5 5.5 0 1 1 4.36 2.29Z"
                  />
                </svg>
                {$_('contact.whatsappCta')}
              </button>
            {/snippet}
            <WhatsAppDrawer trigger={waTrigger} {source} />
          </div>
        </div>
      </div>
    </div>

    <div class="form-col">
      <ContactForm {source} />
    </div>
  </div>
</section>

<style>
  .contact {
    padding: var(--s-9) 0;
  }

  .intro {
    text-align: center;
    margin-bottom: var(--s-7);
  }

  .intro h2 {
    font-size: var(--text-2xl);
    font-weight: 400;
    letter-spacing: var(--track-tight);
  }

  .intro p {
    color: var(--fg-2);
    margin-top: var(--s-3);
  }

  .grid {
    display: grid;
    gap: var(--s-7);
  }

  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: 2fr 3fr;
      gap: var(--s-8);
    }
  }

  .card {
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
    opacity: 0.6;
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
    width: 0.75rem;
    height: 0.75rem;
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

  .body {
    position: relative;
    padding: var(--s-6);
    display: flex;
    flex-direction: column;
    gap: var(--s-6);
  }

  .body h3 {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-muted);
    font-weight: 500;
  }

  .wa-button {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    margin-top: var(--s-2);
    padding: var(--s-2) var(--s-4);
    background: transparent;
    border: 1px solid var(--cyan-dim);
    border-radius: var(--radius-sm);
    color: var(--cyan-brand);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    cursor: pointer;
    transition:
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }

  .wa-button:hover {
    background: var(--cyan-subtle);
    border-color: var(--cyan-brand);
    color: var(--cyan-signal);
  }

  .icon-small {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }
</style>
