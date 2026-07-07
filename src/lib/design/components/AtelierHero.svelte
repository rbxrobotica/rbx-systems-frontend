<script lang="ts">
  import type { Locale } from '$types/content';

  interface Props {
    locale?: Locale;
  }

  let { locale = 'pt-BR' }: Props = $props();

  const copy = $derived(
    {
      'pt-BR': {
        chapter: 'Capítulo',
        label: 'RBX Atelier',
        title: 'Criatividade, narrativa e marca',
        body: 'Um espaço de experimentação onde a engenharia encontra a arte, o design e a identidade. Aqui construímos o sistema visual que traduz a RBX em linguagem, forma e cor.',
        cta: 'Explorar o repositório',
        quote: 'L’atelier où la précision rencontre l’imaginaire.'
      },
      en: {
        chapter: 'Chapter',
        label: 'RBX Atelier',
        title: 'Creativity, narrative and brand',
        body: 'A space of experimentation where engineering meets art, design and identity. Here we build the visual system that translates RBX into language, form and color.',
        cta: 'Explore the repository',
        quote: 'L’atelier où la précision rencontre l’imaginaire.'
      }
    }[locale]
  );
</script>

<section class="atelier-hero" aria-label="RBX Atelier">
  <div class="hero-frame">
    <div class="hero-top">
      <span class="hero-line" aria-hidden="true"></span>
      <span class="hero-chapter">{copy.chapter} · 01</span>
    </div>

    <div class="hero-grid">
      <div class="hero-mark">
        <svg viewBox="0 0 300 300" width="96" height="96" aria-hidden="true" class="mark-svg">
          <rect width="300" height="300" fill="var(--bg-0)" />
          <path
            fill="var(--cyan-brand)"
            d="M 151.64585,16.458239 A 135.45542,135.45542 0 0 0 16.190435,151.91367 a 135.45542,135.45542 0 0 0 2.31227,23.5724 L 98.558973,95.429806 H 129.51793 L 25.259609,199.68817 a 135.45542,135.45542 0 0 0 35.324226,51.75876 l 61.198345,-61.19832 h 30.95896 l -74.780929,74.78093 a 135.45542,135.45542 0 0 0 73.685639,22.33954 135.45542,135.45542 0 0 0 135.45541,-135.45541 135.45542,135.45542 0 0 0 -0.0271,-1.17996 l -80.15088,80.15153 H 175.96435 L 283.92126,122.92832 A 135.45542,135.45542 0 0 0 246.63396,55.719146 L 152.74114,149.61199 H 121.78218 L 229.74437,41.649772 A 135.45542,135.45542 0 0 0 151.64585,16.458239 Z"
          />
        </svg>
      </div>

      <div class="hero-content">
        <span class="hero-label">{copy.label}</span>
        <h1 class="hero-title">{copy.title}</h1>
        <p class="hero-quote">{copy.quote}</p>
        <p class="hero-body">{copy.body}</p>

        <div class="hero-actions">
          <a
            class="hero-cta"
            href="https://github.com/rbxrobotica/rbx-atelier"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{copy.cta}</span>
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
    </div>

    <div class="hero-footer">
      <span class="footer-cell">Brand Voltage</span>
      <span class="footer-cell">Design Systems</span>
      <span class="footer-cell">Visual Identity</span>
      <span class="footer-cell">Zürich · Brasil</span>
    </div>
  </div>
</section>

<style>
  .atelier-hero {
    --hero-accent: var(--cyan-brand);
    --hero-muted: var(--cyan-dim);
    padding: var(--s-8) 0 var(--s-9);
  }

  .hero-frame {
    border: 1px solid var(--border);
    background: linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%);
  }

  .hero-top {
    display: flex;
    align-items: center;
    gap: var(--s-4);
    padding: var(--s-4) var(--s-5);
    border-bottom: 1px solid var(--border);
  }

  .hero-line {
    flex: 1;
    height: 1px;
    background: var(--hero-accent);
    opacity: 0.8;
  }

  .hero-chapter {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-2);
    white-space: nowrap;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--s-6);
    padding: var(--s-6) var(--s-5);
  }

  @media (min-width: 768px) {
    .hero-grid {
      grid-template-columns: auto 1fr;
      gap: var(--s-8);
      padding: var(--s-8) var(--s-7);
    }
  }

  .hero-mark {
    display: flex;
    align-items: flex-start;
  }

  .mark-svg {
    width: 72px;
    height: 72px;
    border: 1px solid var(--border);
  }

  @media (min-width: 768px) {
    .mark-svg {
      width: 96px;
      height: 96px;
    }
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
  }

  .hero-label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--hero-accent);
  }

  .hero-title {
    font-family: var(--font-sans);
    font-size: var(--text-3xl);
    font-weight: 300;
    line-height: var(--lead-tight);
    letter-spacing: var(--track-tight);
    color: var(--fg-0);
    margin: 0;
  }

  @media (min-width: 768px) {
    .hero-title {
      font-size: var(--text-4xl);
    }
  }

  .hero-quote {
    font-family: var(--font-sans);
    font-size: var(--text-xl);
    font-weight: 300;
    font-style: italic;
    line-height: var(--lead-snug);
    letter-spacing: var(--track-tight);
    color: var(--fg-1);
    margin: 0;
    padding-left: var(--s-4);
    border-left: 2px solid var(--hero-muted);
  }

  @media (min-width: 768px) {
    .hero-quote {
      font-size: var(--text-2xl);
      padding-left: var(--s-5);
    }
  }

  .hero-body {
    font-size: var(--text-base);
    line-height: var(--lead-body);
    color: var(--fg-1);
    max-width: var(--prose-w);
    margin: 0;
  }

  .hero-actions {
    margin-top: var(--s-2);
  }

  .hero-cta {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
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

  .hero-cta:hover {
    border-color: var(--hero-accent);
    color: var(--hero-accent);
  }

  .hero-footer {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--border);
    border-top: 1px solid var(--border);
  }

  @media (min-width: 640px) {
    .hero-footer {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .footer-cell {
    padding: var(--s-3) var(--s-4);
    background: var(--bg-1);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
    color: var(--fg-2);
    text-align: center;
  }
</style>
