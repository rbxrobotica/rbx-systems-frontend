<script lang="ts">
  import { page } from '$app/stores';
  import { getAlternates } from '$lib/seo/alternates';
  import { serializeJsonLd } from '$lib/seo/schema';
  import { SITE_ORIGIN } from '$lib/seo/site';
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

  // The path already carries the locale segment, so it is the whole address.
  const pageUrl = $derived(canonical ?? `${SITE_ORIGIN}${$page.url.pathname}`);
  const fullTitle = $derived(`${title} · ${locale === 'pt-BR' ? 'RBX Systems' : 'RBX Systems'}`);
  // Crawlers require an absolute og:image; covers arrive as site-relative
  // proxy paths (/api/blog/cover/...), same absolutization as the schema.
  const ogImage = $derived(
    image
      ? image.startsWith('http')
        ? image
        : `${SITE_ORIGIN}${image}`
      : `${SITE_ORIGIN}/brand/rbx-og.jpg`
  );
  const ogLocale = $derived(locale === 'pt-BR' ? 'pt_BR' : 'en_US');

  const inferredAlternate = $derived(alternate ?? getAlternates(locale, $page.url.pathname));

  const structuredData = $derived(schema ? serializeJsonLd(schema) : undefined);

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
  <!-- WhatsApp/Facebook render previews faster (and more reliably) when
       dimensions are declared; all covers and the brand og image are 1200x630. -->
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

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
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- a script element cannot be written in the template; serializeJsonLd escapes "<" so the JSON cannot close it -->
    {@html '\u003cscript type="application/ld+json"\u003e' + structuredData + '\u003c/script\u003e'}
  {/if}
</svelte:head>
