<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { formatDate } from '$api/content';
  import PageHeader from '$components/PageHeader.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>RBX Journal</title>
  <meta name="description" content="Ideas, engineering and field notes from RBX Systems." />
</svelte:head>

<PageHeader title="RBX Journal" lead="Ideias, engenharia e notas de campo da RBX Systems." />

{#if data.posts.length === 0}
  <p class="rbx-caption">{$_('common.empty')}</p>
{:else}
  <ul class="post-list">
    {#each data.posts as post}
      <li class="post-item">
        <a href="/blog/{post.slug}">
          <span class="post-date">{formatDate(post.date, data.locale)}</span>
          <h2 class="post-title">{post.title}</h2>
          <p class="rbx-caption">{post.excerpt}</p>
        </a>
      </li>
    {/each}
  </ul>
{/if}

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
</style>
