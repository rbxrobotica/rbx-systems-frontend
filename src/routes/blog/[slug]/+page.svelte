<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { formatDate } from '$api/content';
  import Prose from '$components/Prose.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let pageTitle = $derived(data.post?.title ?? $_('common.empty'));
  let pageDescription = $derived(data.post?.excerpt ?? '');
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

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

  <a href="/journal" class="back">{$_('common.back')}</a>
{:else}
  <p class="rbx-caption">{$_('common.empty')}</p>
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
