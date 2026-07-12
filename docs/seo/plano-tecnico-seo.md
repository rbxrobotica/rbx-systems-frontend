# Plano Técnico de Implementação de SEO — RBX Systems

> Ações técnicas ordenadas por prioridade, com risco, rollback e validação.

---

## 1. Componente SEO reutilizável

### Onde

`src/lib/design/components/Seo.svelte` no `rbx-robotica-frontend`.

### O que faz

- Gera `<title>` e `<meta name="description">`.
- Injeta `<link rel="canonical">`.
- Injeta Open Graph (`og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`).
- Injeta Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`).
- Injeta JSON-LD via `<script type="application/ld+json">`.
- Suporta `hreflang` alternates.
- Detecta idioma e domínio automaticamente.

### Props

```ts
interface SeoProps {
  title: string;
  description: string;
  type?: 'website' | 'article' | 'profile' | 'service' | 'product';
  image?: string;
  canonical?: string;
  alternate?: { hreflang: string; href: string }[];
  schema?: Record<string, unknown>;
}
```

### Risco

**Baixo**. Apenas metadados HTML.

### Rollback

Remover importação do componente nas páginas; restaurar `svelte:head` anterior.

### Validação

- `curl -s https://rbx.ia.br/ | grep -E '<title|<meta|ld+json'`
- Google Rich Results Test
- OpenGraph.xyz

---

## 2. robots.txt seguro

### Onde

`static/robots.txt` no `rbx-robotica-frontend`.

### Conteúdo proposto

```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /console
Disallow: /app
Disallow: /admin
Disallow: /staging
Disallow: /healthz
Disallow: /blog/*?*
Disallow: /solucoes/*?*
Disallow: /produtos/*?*
Disallow: /atelier

Sitemap: https://rbx.ia.br/sitemap.xml
```

Para `rbxsystems.ch`, `merovelis.com` e `strategos.gr`, versões equivalentes com seus respectivos domínios.

### Observação

`robots.txt` **não é segurança**. Áreas privadas devem usar autenticação e/ou `noindex`.

### Risco

**Baixo**. Apenas diretriz de rastreamento.

### Rollback

Remover arquivo `static/robots.txt`.

### Validação

- `curl https://rbx.ia.br/robots.txt`
- Google Search Console → robots.txt Tester

---

## 3. sitemap.xml

### Opção A — sitemap estático (rápido)

Criar `static/sitemap.xml` com URLs fixas.

### Opção B — sitemap dinâmico (recomendado)

Criar rota `src/routes/sitemap.xml/+server.ts` que:

- Lista páginas institucionais.
- Lista serviços e produtos.
- Consulta `loadAllPosts()` para incluir posts do journal.
- Gera XML com `<lastmod>`, `<changefreq>`, `<priority>`.

### Estrutura do sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://rbx.ia.br/</loc>
    <lastmod>2026-07-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- ... -->
</urlset>
```

### Risco

**Baixo** (estático) a **médio** (dinâmico — precisa de S3 disponível).

### Rollback

Remover rota/arquivo.

### Validação

- `curl https://rbx.ia.br/sitemap.xml`
- Google Search Console → Sitemaps

---

## 4. Correção de rotas em inglês no rbxsystems.ch

### Problema

`/solutions` e `/products` retornam 404.

### Solução

Criar aliases de rota no SvelteKit ou rotas dedicadas:

- `src/routes/solutions/+page.svelte` → reutiliza componente `/solucoes`.
- `src/routes/products/+page.svelte` → reutiliza componente `/produtos`.
- `src/routes/about/+page.svelte` → `/sobre`.
- `src/routes/contact/+page.svelte` → `/contato`.

Ou, preferencialmente, configurar redirecionamentos no `hooks.server.ts` ou no Traefik.

### Risco

**Médio**. Mudança de URL visível. Requer validação de links internos.

### Rollback

Remover aliases ou redirecionamentos.

### Validação

- `curl -I https://rbxsystems.ch/solutions` → 200
- `curl -I https://rbxsystems.ch/products` → 200

---

## 5. Páginas novas: `/sobre`, `/leandro-damasio`, `/contato`

### `/sobre`

- Conteúdo carregado de S3: `site/{locale}/about/index.md`.
- Schema: `Organization`, `AboutPage`.
- CTA: contato, serviços, produtos.

### `/leandro-damasio`

- Página do fundador.
- Schema: `Person`, `ProfilePage`.
- Links para LinkedIn, GitHub, outros projetos.
- Foto otimizada.

### `/contato`

- Página de contato.
- Schema: `ContactPage`, `Organization`.
- Formulário integrado ao `rbx-comms`.

### Risco

**Baixo**. Novas páginas, nenhuma URL existente é quebrada.

### Rollback

Remover rotas e conteúdo S3.

### Validação

- Acessar as URLs em pt-BR e en.
- Verificar schemas no Rich Results Test.

---

## 6. JSON-LD em todas as páginas

### Página inicial

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "..." },
    { "@type": "WebSite", "@id": "..." },
    { "@type": "WebPage", "@id": "..." }
  ]
}
```

### Página de serviço

Incluir `Service` + `WebPage`.

### Página de produto

Incluir `SoftwareApplication` + `WebPage`.

### Post de blog

Incluir `BlogPosting` + `WebPage`.

### Risco

**Baixo**.

### Rollback

Remover script JSON-LD do componente Seo.

### Validação

- Rich Results Test
- Schema Markup Validator

---

## 7. Open Graph e Twitter Cards

Adicionar no componente Seo:

- `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:image`, `og:locale`.
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.

Imagem padrão OG: 1200×630 JPEG, armazenada em S3 e servida via `/api/assets/`.

### Risco

**Baixo**.

### Rollback

Remover meta tags.

### Validação

- OpenGraph.xyz
- Twitter Card Validator

---

## 8. Headers de segurança e performance

Adicionar via `hooks.server.ts` ou Traefik middleware:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (avançado, testar antes)

Cache:

- HTML: `public, max-age=60` (já existe)
- Assets: `public, max-age=31536000, immutable` (já existe)

### Risco

**Médio** (HSTS irreversível por 2 anos; CSP pode quebrar scripts).

### Rollback

Remover headers no Traefik ou hooks.

### Validação

- `curl -I https://rbx.ia.br/`
- securityheaders.com

---

## 9. DNS, e-mail e Search Console

### rbx.ia.br

Ações que exigem confirmação humana:

- Adicionar MX para `mail.rbxsystems.ch` ou provedor de e-mail.
- Adicionar SPF: `v=spf1 include:spf.mtasv.net ~all`.
- Configurar DKIM com chave do Postmark.
- Adicionar DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@rbxsystems.ch; fo=1`.
- Adicionar TXT de verificação do Google Search Console.

### Search Console

- ✅ Verificar `rbx.ia.br` e `rbxsystems.ch` via meta tag HTML (`google-site-verification`).
- ✅ Sitemaps dinâmicos por domínio implementados (`/src/routes/sitemap.xml/+server.ts`).
- ⬜ Confirmar submissão dos sitemaps no Search Console:
  - `https://rbx.ia.br/sitemap.xml`
  - `https://rbxsystems.ch/sitemap.xml`
- ⬜ Verificar `merovelis.com` e `strategos.gr` (quando priorizado).
- Nota: optamos por propriedades de **prefixo de URL** para evitar alterações de DNS nos domínios principais.

### Risco

**Alto** (e-mail). Qualquer erro pode quebrar entrega.

### Rollback

Restaurar registros DNS anteriores (requer backup).

### Validação

- `dig TXT rbx.ia.br`
- Teste de envio/recebimento de e-mail.
- Search Console confirmando propriedade.

---

## 10. Validação contínua no CI

Adicionar script `scripts/seo-check.js` que:

- Valida que cada página tem title, description, canonical, H1.
- Valida que não há title/description duplicados.
- Valida que robots.txt e sitemap.xml existem.
- Valida JSON-LD parseável.

Executar no GitHub Actions em PRs.

### Risco

**Baixo**.

### Rollback

Remover step do workflow.

### Validação

- CI passando.

---

## 11. Ordem de execução recomendada

1. Criar componente `Seo.svelte`.
2. Atualizar `i18n` com títulos/descriptions otimizados.
3. Adicionar `robots.txt` e `sitemap.xml`.
4. Aplicar componente Seo nas páginas existentes.
5. Criar páginas `/sobre`, `/leandro-damasio`, `/contato`.
6. Corrigir rotas `/solutions`, `/products`, `/about`, `/contact` para rbxsystems.ch.
7. Adicionar JSON-LD schemas.
8. Adicionar headers de segurança.
9. Configurar DNS/Search Console (com autorização humana).
10. Implementar validação de SEO no CI.
