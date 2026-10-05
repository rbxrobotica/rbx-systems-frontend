<script lang="ts">
  import { productEvidence } from '$lib/content/product-evidence';
  import type { Locale } from '$types/content';

  let { locale }: { locale: Locale } = $props();
  let selected = $state('robson');
  const item = $derived(
    productEvidence.find((entry) => entry.id === selected) ?? productEvidence[0]
  );
  const copy = $derived(
    locale === 'pt-BR'
      ? {
          eyebrow: 'Interfaces e implementação',
          title: 'Por dentro dos produtos.',
          lead: 'Explore as interfaces e algumas decisões de engenharia no código. Capturas locais e trechos selecionados da main, com a versão de origem identificada.',
          choose: 'Escolher produto para explorar',
          expand: 'Ampliar captura em nova aba',
          code: 'Ver trecho de código',
          source: 'Arquivo na main',
          revision: 'Versão do trecho',
          capture: 'Versão da captura',
          lines: 'Linhas',
          selected: 'Produto selecionado'
        }
      : {
          eyebrow: 'Interfaces and implementation',
          title: 'Inside the products.',
          lead: 'Explore the interfaces and engineering decisions in the code. Local captures and selected excerpts from main, with their source revision identified.',
          choose: 'Choose a product to explore',
          expand: 'Enlarge capture in a new tab',
          code: 'View code excerpt',
          source: 'File on main',
          revision: 'Excerpt revision',
          capture: 'Capture revision',
          lines: 'Lines',
          selected: 'Selected product'
        }
  );
</script>

<section class="evidence" aria-labelledby="evidence-title">
  <header>
    <p class="eyebrow">{copy.eyebrow}</p>
    <h2 id="evidence-title">{copy.title}</h2>
    <p class="lead">{copy.lead}</p>
  </header>
  <div class="product-selector" role="group" aria-label={copy.choose}>
    {#each productEvidence as entry}
      <button
        type="button"
        aria-pressed={selected === entry.id}
        aria-controls="product-evidence-panel"
        onclick={() => (selected = entry.id)}>{entry.name}</button
      >
    {/each}
  </div>
  {#if item}
    <p class="sr-only" aria-live="polite">{copy.selected}: {item.name}</p>
    {#key item.id}
      <article id="product-evidence-panel" aria-labelledby="evidence-product-title">
        <div class="evidence-heading">
          <h3 id="evidence-product-title">{item.name}</h3>
          <span class="branch">main · {item.commit.slice(0, 7)}</span>
        </div>
        <p class="description">{item.description[locale]}</p>
        <figure>
          <a class="capture-link" href={item.capture.src} target="_blank" rel="noreferrer">
            <img
              src={item.capture.src}
              alt={item.capture.alt[locale]}
              width={item.capture.width}
              height={item.capture.height}
              loading="lazy"
              decoding="async"
            />
            <span>{copy.expand}</span>
          </a>
          <figcaption>
            <p>{item.capture.caption[locale]}</p>
            <small
              >{copy.capture}: {item.capture.repository} · main · {item.capture.commit.slice(
                0,
                7
              )}</small
            >
          </figcaption>
        </figure>
        <details>
          <summary>{copy.code} <span>{item.language}</span></summary>
          <div class="code-heading">
            <span class="source-path">{item.path}</span>
            <span
              >{copy.lines}
              {item.startLine}–{item.startLine + item.code.split('\n').length - 1}</span
            >
          </div>
          <!-- Keyboard users must be able to focus and scroll this overflowing code region. -->
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <pre role="region" tabindex="0" aria-label={`${copy.code}: ${item.name}`}><code
              >{item.code}</code
            ></pre>
          <div class="source-footer">
            <span>{copy.revision}: main · {item.commit.slice(0, 7)}</span>
            {#if item.sourceUrl}<a href={item.sourceUrl}>{copy.source}</a>{/if}
            {#if item.permalinkUrl}<a href={item.permalinkUrl}>{item.commit.slice(0, 7)}</a>{/if}
          </div>
        </details>
      </article>
    {/key}
  {/if}
</section>

<style>
  .evidence {
    margin-top: var(--s-8);
  }
  header {
    max-width: 46rem;
    margin-bottom: var(--s-6);
  }
  .eyebrow,
  .branch {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--cyan-brand);
  }
  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--s-4);
  }
  h2 {
    font-size: clamp(1.6rem, 3vw, 2rem);
    font-weight: 400;
    letter-spacing: var(--track-tight);
    line-height: var(--lead-snug);
  }
  .lead {
    color: var(--fg-1);
    line-height: var(--lead-loose);
    margin-top: var(--s-3);
  }
  .product-selector {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2);
    margin-bottom: var(--s-5);
  }
  button {
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--bg-1);
    color: var(--fg-1);
    padding: var(--s-3) var(--s-4);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  button:hover {
    color: var(--fg-0);
    border-color: var(--fg-2);
  }
  button[aria-pressed='true'] {
    color: var(--cyan-brand);
    border-color: var(--cyan-muted);
    background: var(--cyan-subtle);
  }
  button:focus-visible,
  a:focus-visible,
  summary:focus-visible,
  pre:focus-visible {
    outline: 2px solid var(--cyan-brand);
    outline-offset: 4px;
  }
  article {
    padding: var(--s-5);
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    min-width: 0;
  }
  .evidence-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--s-3);
  }
  h3 {
    font-size: var(--text-2xl);
    font-weight: 500;
    letter-spacing: var(--track-tight);
  }
  .branch {
    white-space: nowrap;
  }
  .description {
    margin-top: var(--s-3);
    max-width: 48rem;
    color: var(--fg-1);
    line-height: var(--lead-loose);
  }
  figure {
    margin: var(--s-5) 0;
  }
  .capture-link {
    display: block;
    border: 1px solid var(--border-strong);
    text-decoration: none;
    background: var(--bg-0);
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
    object-fit: contain;
  }
  .capture-link > span {
    display: block;
    padding: var(--s-2) var(--s-3);
    border-top: 1px solid var(--border);
    font-size: var(--text-xs);
    text-align: right;
  }
  figcaption {
    margin-top: var(--s-3);
    color: var(--fg-1);
    font-size: var(--text-sm);
    line-height: var(--lead-loose);
  }
  figcaption small {
    display: block;
    margin-top: var(--s-1);
    color: var(--fg-2);
    overflow-wrap: anywhere;
  }
  details {
    border-top: 1px solid var(--border-strong);
  }
  summary {
    cursor: pointer;
    padding: var(--s-4) 0;
    color: var(--fg-0);
  }
  summary span {
    margin-left: var(--s-3);
    color: var(--fg-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .code-heading,
  .source-footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-4);
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--fg-1);
  }
  .source-path {
    overflow-wrap: anywhere;
  }
  pre {
    overflow-x: auto;
    max-width: 100%;
    padding: var(--s-5);
    margin: var(--s-3) 0;
    background: var(--bg-0);
    border: 1px solid var(--border);
    color: var(--fg-0);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--lead-loose);
    tab-size: 2;
  }
  .source-footer {
    margin-bottom: var(--s-2);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 600px) {
    article {
      padding: var(--s-4);
    }
    button {
      flex: 1 1 auto;
    }
    pre {
      padding: var(--s-3);
      font-size: var(--text-xs);
    }
  }
</style>
