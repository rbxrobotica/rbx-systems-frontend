<script lang="ts">
  import { formatDate } from '$api/content';
  import PageHeader from '$components/PageHeader.svelte';
  import Seo from '$components/Seo.svelte';
  import { buildGraph } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const title = $derived(t(data.locale, 'journal.metaTitle'));
  const description = $derived(t(data.locale, 'journal.metaDescription'));
  const pageUrl = $derived(
    data.locale === 'pt-BR' ? 'https://rbx.ia.br/journal' : 'https://rbxsystems.ch/journal'
  );
  const schema = $derived(buildGraph(data.locale, pageUrl, title, description));
</script>

<Seo {title} {description} locale={data.locale} canonical={pageUrl} {schema} />

<PageHeader title={t(data.locale, 'journal.headline')} lead={t(data.locale, 'journal.body')} />

<p class="rss-cta">
  <span class="rss-badge">{t(data.locale, 'journal.rssNew')}</span>
  <a href="/rss.xml" type="application/rss+xml">{t(data.locale, 'journal.rssCta')}</a>
</p>

{#if data.posts.length === 0}
  <p class="rbx-caption">{t(data.locale, 'common.empty')}</p>
{:else}
  <ul class="post-list">
    {#each data.posts as post}
      <li class="post-item">
        <a href="/blog/{post.publicSlug}">
          <span class="post-date">{formatDate(post.date, data.locale)}</span>
          <h2 class="post-title">{post.title}</h2>
          <p class="rbx-caption">{post.excerpt}</p>
        </a>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .rss-cta {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    margin: calc(-1 * var(--s-3)) 0 var(--s-5);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
  }
  .rss-badge {
    color: var(--cyan-brand);
    border: 1px solid var(--cyan-brand);
    border-radius: var(--radius-sm);
    padding: 0 var(--s-1);
  }
  .rss-cta a {
    color: var(--fg-2);
    transition: color var(--dur) var(--ease);
  }
  .rss-cta a:hover {
    color: var(--cyan-brand);
  }
  .post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s-5);
  }
  .post-item a {
    display: block;
    padding: var(--s-4) 0;
    border-bottom: 1px solid var(--border);
  }
  .post-item a:hover .post-title {
    color: var(--cyan-brand);
  }
  .post-date {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--fg-2);
    text-transform: uppercase;
    letter-spacing: var(--track-label);
  }
  .post-title {
    font-size: var(--text-xl);
    font-weight: 500;
    margin: var(--s-1) 0 var(--s-2);
    transition: color var(--dur) var(--ease);
  }
</style>
