<script lang="ts">
  import { page } from '$app/stores';
  import { getAlternates } from '$lib/seo/alternates';
  import type { Locale } from '$types/content';

  interface Props {
    title: string;
    description: string;
    locale: Locale;
    canonical?: string;
    type?: 'website' | 'article' | 'profile' | 'service' | 'product';
    image?: string;
    alternate?: { hreflang: string; href: string }[];
    schema?: Record<string, unknown>;
  }

  let {
    title,
    description,
    locale,
    canonical,
    type = 'website',
    image,
    alternate,
    schema
  }: Props = $props();

  const siteUrl = $derived(locale === 'pt-BR' ? 'https://rbx.ia.br' : 'https://rbxsystems.ch');
  const pageUrl = $derived(canonical ?? `${siteUrl}${$page.url.pathname}`);
  const fullTitle = $derived(`${title} · ${locale === 'pt-BR' ? 'RBX Systems' : 'RBX Systems'}`);
  const ogImage = $derived(image ?? `${siteUrl}/brand/rbx-og.jpg`);
  const ogLocale = $derived(locale === 'pt-BR' ? 'pt_BR' : 'en_US');

  const inferredAlternate = $derived(
    alternate ?? getAlternates(locale, $page.url.pathname)
  );

  const structuredData = $derived(
    schema
      ? JSON.stringify({
          '@context': 'https://schema.org',
          ...schema
        })
      : undefined
  );

  const searchConsoleToken = $derived(
    locale === 'pt-BR'
      ? 'XOJy4RQxx2FSdQPIjHPwmjzYpxzbswFTNTS4NP9xrgM'
      : 'QVnadKK8ypVbGXcK9MGhw59ux69hT8gOaC7EeKUbAK4'
  );
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <meta name="google-site-verification" content={searchConsoleToken} />
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph -->
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content="RBX Systems" />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:locale" content={ogLocale} />
  <meta property="og:image" content={ogImage} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />

  <!-- Hreflang -->
  {#if inferredAlternate}
    {#each inferredAlternate as alt}
      <link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
    {/each}
  {/if}

  <!-- JSON-LD -->
  {#if structuredData}
    {@html `<script type="application/ld+json">${structuredData}</script>`}
  {/if}
</svelte:head>
