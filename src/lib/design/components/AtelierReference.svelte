<script lang="ts">
  import { t } from '$lib/i18n/translate';
  import type { Locale } from '$types/content';

  interface Props {
    locale?: Locale;
  }

  let { locale = 'pt-BR' }: Props = $props();

  const repo = {
    name: 'rbx-atelier',
    fullName: 'rbxrobotica/rbx-atelier',
    url: 'https://github.com/rbxrobotica/rbx-atelier',
    description: {
      'pt-BR': 'Identidade Visual (Brand Voltage) e Design Systems para produtos RBX.',
      en: 'Visual Identity (Brand Voltage) and Design Systems for RBX products.'
    },
    language: 'HTML / Design Tokens',
    updated: '2026-07-07',
    branch: 'main'
  };
</script>

<aside class="atelier-ref" aria-labelledby="atelier-ref-title">
  <div class="ref-grid">
    <div class="ref-index">
      <span class="ref-index-num">01</span>
      <span class="ref-index-label">{t(locale, 'atelier.ref.indexLabel')}</span>
    </div>

    <div class="ref-body">
      <span class="ref-eyebrow">{t(locale, 'atelier.ref.eyebrow')}</span>
      <h2 id="atelier-ref-title" class="ref-title">{repo.name}</h2>
      <p class="ref-description">{repo.description[locale]}</p>

      <div class="ref-meta">
        <div class="meta-cell">
          <span class="meta-label">{t(locale, 'atelier.ref.fullName')}</span>
          <span class="meta-value">{repo.fullName}</span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">{t(locale, 'atelier.ref.branch')}</span>
          <span class="meta-value">{repo.branch}</span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">{t(locale, 'atelier.ref.language')}</span>
          <span class="meta-value">{repo.language}</span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">{t(locale, 'atelier.ref.updated')}</span>
          <span class="meta-value">{repo.updated}</span>
        </div>
      </div>

      <a class="ref-cta" href={repo.url} target="_blank" rel="noopener noreferrer">
        <span>{t(locale, 'atelier.ref.cta')}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  </div>
</aside>

<style>
  .atelier-ref {
    margin-top: var(--s-9);
    padding-top: var(--s-7);
    border-top: 1px solid var(--border);
  }

  .ref-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--s-5);
  }

  @media (min-width: 768px) {
    .ref-grid {
      grid-template-columns: minmax(6rem, 1fr) minmax(0, 3fr);
      gap: var(--s-7);
    }
  }

  .ref-index {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  .ref-index-num {
    font-family: var(--font-mono);
    font-size: var(--text-3xl);
    font-weight: 300;
    line-height: 1;
    color: var(--fg-3);
    letter-spacing: var(--track-tight);
  }

  .ref-index-label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-2);
  }

  .ref-body {
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
  }

  .ref-eyebrow {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--cyan-brand);
  }

  .ref-title {
    font-family: var(--font-sans);
    font-size: var(--text-3xl);
    font-weight: 300;
    line-height: var(--lead-tight);
    letter-spacing: var(--track-tight);
    color: var(--fg-0);
    margin: 0;
  }

  .ref-description {
    font-size: var(--text-lg);
    font-weight: 300;
    line-height: var(--lead-body);
    color: var(--fg-1);
    max-width: var(--prose-w);
    margin: 0;
  }

  .ref-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--s-4);
    margin-top: var(--s-3);
    padding: var(--s-4) 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  @media (min-width: 640px) {
    .ref-meta {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .meta-cell {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
  }

  .meta-label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-2);
  }

  .meta-value {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--fg-0);
    letter-spacing: var(--track-wide);
  }

  .ref-cta {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    margin-top: var(--s-2);
    padding: var(--s-2) var(--s-4);
    background: transparent;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    color: var(--fg-0);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    text-decoration: none;
    transition:
      border-color var(--dur) var(--ease),
      color var(--dur) var(--ease);
  }

  .ref-cta:hover {
    border-color: var(--cyan-brand);
    color: var(--cyan-brand);
  }

  .ref-cta svg {
    flex-shrink: 0;
  }
</style>
