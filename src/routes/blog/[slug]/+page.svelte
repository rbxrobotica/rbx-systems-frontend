<script lang="ts">
  import { formatDate } from '$api/content';
  import Prose from '$components/Prose.svelte';
  import Seo from '$components/Seo.svelte';
  import { buildGraph, blogPostingSchema } from '$lib/seo/schema';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const siteUrl = $derived(data.locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(
    data.post ? `${siteUrl}/blog/${data.publicSlug ?? data.post.slug}` : `${siteUrl}/journal`
  );
  const pageTitle = $derived(data.post?.title ?? t(data.locale, 'common.empty'));
  const pageDescription = $derived(data.post?.excerpt ?? '');

  const localeBase: Record<string, string> = {
    'pt-BR': 'https://rbx.ia.br',
    en: 'https://rbxsystems.ch'
  };
  const alternate = $derived.by(() => {
    if (!data.alternates || data.alternates.length === 0) return undefined;
    const links = data.alternates.map((alt) => ({
      hreflang: alt.locale,
      href: `${localeBase[alt.locale]}/blog/${alt.publicSlug}`
    }));
    const xDefault = links.find((l) => l.hreflang === 'en') ?? links[0];
    return [...links, { hreflang: 'x-default', href: xDefault.href }];
  });

  const schema = $derived(
    data.post
      ? buildGraph(
          data.locale,
          pageUrl,
          pageTitle,
          pageDescription,
          [
            blogPostingSchema(data.locale, pageUrl, {
              title: data.post.title,
              excerpt: data.post.excerpt,
              date: data.post.date,
              author: data.post.author,
              authorRole: data.post.authorRole,
              cover: data.post.cover
            })
          ],
          `${pageUrl}#article`
        )
      : undefined
  );
</script>

<Seo
  title={pageTitle}
  description={pageDescription}
  locale={data.locale}
  canonical={pageUrl}
  type="article"
  image={data.post?.cover}
  {alternate}
  {schema}
/>

{#if data.post}
  <article>
    <header class="post-header">
      <span class="rbx-eyebrow">{formatDate(data.post.date, data.locale)}</span>
      <h1>{data.post.title}</h1>
      {#if data.post.excerpt}
        <p class="rbx-lead">{data.post.excerpt}</p>
      {/if}
      {#if data.post.author}
        <p class="rbx-caption">
          {data.post.author}{data.post.authorRole ? ` | ${data.post.authorRole}` : ''}
        </p>
      {/if}
    </header>

    {#if data.post.cover}
      <img src={data.post.cover} alt={data.post.title} class="cover" />
    {/if}

    <Prose html={data.post.html} />
  </article>

  <a href="/journal" class="back">{t(data.locale, 'common.back')}</a>
{:else}
  <p class="rbx-caption">{t(data.locale, 'common.empty')}</p>
{/if}

<style>
  .post-header {
    margin-bottom: var(--s-6);
  }
  .post-header h1 {
    margin: var(--s-2) 0 var(--s-3);
  }
  .cover {
    width: 100%;
    max-height: 24rem;
    object-fit: cover;
    border-radius: var(--radius-md);
    margin-bottom: var(--s-6);
    border: 1px solid var(--border);
  }
  .back {
    display: inline-block;
    margin-top: var(--s-6);
  }
</style>
