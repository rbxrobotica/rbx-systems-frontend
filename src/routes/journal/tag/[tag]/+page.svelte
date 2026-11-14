<script lang="ts">
  import { formatDate } from '$api/content';
  import PageHeader from '$components/PageHeader.svelte';
  import Seo from '$components/Seo.svelte';
  import { localizedUrl, siteHref } from '$lib/seo/alternates';
  import { buildGraph, breadcrumbSchema, collectionPageSchema } from '$lib/seo/schema';
  import { breadcrumbItems, leafTitle } from '$design/nav';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const pageUrl = $derived(localizedUrl(data.locale, `/journal/tag/${data.tag}`));
  const metaTitle = $derived(
    `${t(data.locale, 'journal.headline')} · ${t(data.locale, 'journal.tagTitle')}: ${data.tag}`
  );
  const metaDescription = $derived(`${t(data.locale, 'journal.tagMetaDescription')} (${data.tag})`);
  const schema = $derived(
    buildGraph(data.locale, pageUrl, metaTitle, metaDescription, [
      collectionPageSchema(
        data.locale,
        pageUrl,
        metaTitle,
        metaDescription,
        data.posts.map((post) => ({
          name: post.title,
          url: localizedUrl(data.locale, `/blog/${post.publicSlug}`)
        }))
      ),
      breadcrumbSchema(
        pageUrl,
        breadcrumbItems(data.locale, `/journal/tag/${data.tag}`, leafTitle(data))
      )
    ])
  );
</script>

<Seo
  title={metaTitle}
  description={metaDescription}
  locale={data.locale}
  canonical={pageUrl}
  {schema}
/>

<PageHeader
  eyebrow={t(data.locale, 'journal.headline')}
  title="{t(data.locale, 'journal.tagTitle')}: {data.tag}"
  lead={t(data.locale, 'journal.tagMetaDescription')}
/>

{#if data.posts.length === 0}
  <p class="rbx-caption">{t(data.locale, 'common.empty')}</p>
{:else}
  <ul class="post-list">
    {#each data.posts as post}
      <li class="post-item">
        <a href={siteHref(data.locale, `/blog/${post.publicSlug}`)}>
          <span class="post-date">{formatDate(post.date, data.locale)}</span>
          <h2 class="post-title">{post.title}</h2>
          <p class="rbx-caption">{post.excerpt}</p>
        </a>
      </li>
    {/each}
  </ul>
{/if}

<a href={siteHref(data.locale, '/journal')} class="back">{t(data.locale, 'common.back')}</a>

<style>
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
  .back {
    display: inline-block;
    margin-top: var(--s-6);
  }
</style>
