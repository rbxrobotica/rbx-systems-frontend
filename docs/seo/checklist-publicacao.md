# Checklist Operacional de Publicação — RBX Systems

> Use este checklist para todo artigo, journal, case, landing page ou atualização de página antes de publicar.

---

## Antes de escrever

- [ ] A pauta está alinhada a um cluster editorial?
- [ ] A pauta reforça uma entidade (Leandro, RBX, produto, serviço)?
- [ ] A intenção de busca está clara?
- [ ] A página alvo está definida?
- [ ] Palavras-chave principais foram escolhidas?

---

## Conteúdo

- [ ] Título ≤ 60 caracteres.
- [ ] H1 único e claro.
- [ ] Estrutura de headings lógica (H2, H3).
- [ ] Meta description única, ≤ 160 caracteres.
- [ ] Conteúdo técnico, não genérico.
- [ ] Exemplos, dados ou modelos concretos.
- [ ] Nenhuma informação sensível (IPs, credenciais, topologia interna).
- [ ] Tom institucional, direto, sem emojis excessivos.
- [ ] CTA clara no final.
- [ ] 3–5 links internos para páginas relevantes.
- [ ] 1–2 links externos de autoridade (quando fizer sentido).

---

## Metadados técnicos

- [ ] `<title>` único.
- [ ] `<meta name="description">` única.
- [ ] `<link rel="canonical">` auto-referencial.
- [ ] Open Graph tags (`og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:image`, `og:locale`).
- [ ] Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
- [ ] `hreflang` configurado se houver versão em outro idioma.
- [ ] Imagem OG 1200×630 px, JPEG, < 200 KB.

---

## Dados estruturados (JSON-LD)

- [ ] Schema apropriado: `BlogPosting`, `Article`, `Service`, `SoftwareApplication`, `Person`, `Organization`, etc.
- [ ] `@graph` conectando entidades quando aplicável.
- [ ] `@id` canônico por entidade.
- [ ] `author` definido (Person ou Organization).
- [ ] `publisher` apontando para RBX Systems.
- [ ] `datePublished` e `dateModified` preenchidos.
- [ ] JSON-LD é parseável (sem erros de sintaxe).

---

## robots.txt e sitemap

- [ ] Se a página é pública: garantir que não está em `Disallow`.
- [ ] Se a página é privada/admin/staging: garantir `Disallow` + `noindex` + auth.
- [ ] Atualizar `sitemap.xml` para incluir a nova URL.
- [ ] `lastmod` atualizado no sitemap.

---

## Blog / Journal

- [ ] Arquivo Markdown salvo em `blog-posts/YYYY-MM-DD-slug.pt-BR.md` e `.en.md`.
- [ ] Frontmatter completo: title, date, author, authorRole, tags, excerpt, cover.
- [ ] Cover image 1200×630 JPEG enviada para S3.
- [ ] Post publicado via `./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug`.
- [ ] URL acessível em `rbx.ia.br/blog/YYYY-MM-DD-slug` e `rbxsystems.ch/blog/YYYY-MM-DD-slug`.
- [ ] Commits dos arquivos Markdown feitos localmente.

---

## LinkedIn

- [ ] Versão curta do conteúdo preparada.
- [ ] Gancho forte na primeira frase.
- [ ] Link para o artigo completo.
- [ ] Hashtags relevantes incluídas.

---

## Validação pós-publicação

- [ ] Página carrega sem erro 404.
- [ ] Title e meta description aparecem no HTML.
- [ ] Canonical URL correta.
- [ ] JSON-LD aparece no HTML e é válido.
- [ ] Open Graph validado (OpenGraph.xyz ou ferramenta similar).
- [ ] Twitter Card validado.
- [ ] Sitemap inclui a URL.
- [ ] robots.txt permite a URL.
- [ ] H1 presente e único.
- [ ] Links internos funcionam.
- [ ] Imagem OG carrega corretamente.
- [ ] Versão móvel está legível.

---

## CI / Automação

- [ ] `npm run check` passa.
- [ ] `npm run build` passa.
- [x] Script `seo-check` passa (`pnpm seo-check`).
- [ ] Nenhum secret vazado no diff.

---

## Pós-deploy

- [ ] Verificar URL em produção.
- [ ] Submeter URL no Search Console (Request Indexing) — após verificação da propriedade.
- [ ] Garantir que o sitemap do domínio esteja submetido no Search Console.
- [ ] Publicar versão LinkedIn.
- [ ] Registrar publicação no calendário editorial.
- [ ] Monitorar indexação em 7 dias.
