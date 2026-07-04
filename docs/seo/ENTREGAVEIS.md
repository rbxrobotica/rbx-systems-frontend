# Entregáveis — Estratégia de SEO e Presença Digital RBX Systems / Leandro Damasio

> Resumo executivo do trabalho realizado, mudanças implementadas e pendências que exigem decisão humana.

---

## 1. Arquivos entregues

| Entregável | Caminho | Status |
|---|---|---|
| Diagnóstico estratégico | `docs/seo/diagnostico-seo-rbx.md` | ✅ Entregue |
| Arquitetura de entidade | `docs/seo/arquitetura-entidade-rbx-leandro.md` | ✅ Entregue |
| Plano técnico | `docs/seo/plano-tecnico-seo.md` | ✅ Entregue |
| Plano editorial | `docs/seo/plano-editorial-rbx.md` | ✅ Entregue |
| Checklist de publicação | `docs/seo/checklist-publicacao.md` | ✅ Entregue |
| Inventário DNS/e-mail | `docs/infra/dns-email-seo-inventory.md` | ✅ Entregue |
| Templates de conteúdo | `docs/seo/templates/` | ✅ Entregue |
| Comando de novo conteúdo | `scripts/new-content.sh` | ✅ Entregue |
| Validação de SEO no CI | `scripts/seo-check.js` + CI step | ✅ Entregue |

---

## 2. Mudanças implementadas em código

### Componentes e bibliotecas
- **Novo `src/lib/design/components/Seo.svelte`** — componente reutilizável que gera title, description, canonical, Open Graph, Twitter Card, hreflang e JSON-LD.
- **Novo `src/lib/seo/schema.ts`** — geradores de schema.org (`Organization`, `Person`, `WebSite`, `WebPage`, `Service`, `SoftwareApplication`, `BlogPosting`).
- **Novo `src/lib/seo/alternates.ts`** — mapa de hreflang entre `rbx.ia.br` (pt-BR) e `rbxsystems.ch` (en).

### Metadados em todas as páginas
- `ContentPage.svelte` atualizado para usar `Seo` automaticamente.
- Páginas que não usavam `ContentPage` (`/`, `/journal`, `/blog/[slug]`, `/contato`, `/contact`) atualizadas.
- `i18n/pt-BR.json` e `i18n/en.json` expandidos com títulos/descrições otimizados por página.

### Novas páginas
- `/sobre` (pt-BR) e `/about` (en)
- `/leandro-damasio` (ambos os idiomas)
- `/contato` (pt-BR) e `/contact` (en)

### Correção de rotas quebradas em inglês
- `/solutions` e `/products` criadas para `rbxsystems.ch` (antes retornavam 404).

### robots.txt e sitemap.xml
- `static/robots.txt` com `Allow: /`, `Disallow` para áreas privadas e apontando para sitemap.
- `static/sitemap.xml` com URLs canônicas de pt-BR e en, prioridades e lastmod.

### Navegação
- `NavBar.svelte` atualizado com links para Sobre e Contato.
- `Footer.svelte` atualizado com links para Sobre, Leandro Damasio, Contato, LinkedIn e GitHub.

### Segurança e headers
- `hooks.server.ts` atualizado com:
  - Redirect 301 `www` → apex
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - HSTS comentado/documentado (requer autorização para ativar)

### Correção de SSR i18n
- Novo `src/lib/i18n/translate.ts` — helper server-safe que resolve traduções por locale explicitamente.
- Todas as rotas migradas de `$_()` (store global do `svelte-i18n`) para `t(data.locale, key)`, corrigindo title/description em inglês renderizados em português no servidor.

### Search Console
- `Seo.svelte` atualizado com meta tags `google-site-verification` por domínio.
- Propriedades `https://rbx.ia.br/` e `https://rbxsystems.ch/` verificadas no Google Search Console via tag HTML.

### CI/Automação
- `.github/workflows/ci.yml` atualizado com job `verify` que roda `pnpm seo-check` e `pnpm check` antes do deploy.
- `package.json` com script `seo-check`.
- `scripts/seo-check.js` valida que páginas têm SEO, robots.txt e sitemap.xml.
- `scripts/new-content.sh` cria esqueleto de artigo, serviço, produto ou página.

### Documentação
- `README.md` atualizado (antes falava Next.js; agora SvelteKit).
- `docs/AGENT-BLOG-PUBLISHING.md` atualizado com checklist SEO.

---

## 3. Validação

```bash
pnpm check        # 0 errors, 0 warnings
pnpm build        # success
node scripts/seo-check.js   # all checks passed
```

---

## 4. Pendências que exigem decisão humana

### Alta prioridade
1. **Configurar DNS/e-mail para `rbx.ia.br`**
   - MX, SPF, DKIM, DMARC
   - Risco: quebrar entrega de e-mail
   - Requer acesso ao painel do Registro.br e ao Postmark

2. **Verificar propriedades no Google Search Console**
   - ✅ `rbx.ia.br` e `rbxsystems.ch` verificados via meta tag HTML (`google-site-verification`).
   - ⬜ Submeter sitemaps em `https://rbx.ia.br/sitemap.xml` e `https://rbxsystems.ch/sitemap.xml`.
   - ⬜ Avaliar Bing Webmaster Tools para os mesmos domínios.

3. **Criar conteúdo no S3 para `/sobre`, `/leandro-damasio`, `/about`, `/solutions`, `/products`, `/contact`, `/contato`**
   - ✅ Conteúdo publicado para as páginas institucionais principais.

### Média prioridade
4. **Criar páginas de serviço individuais**
   - `/servicos/engenharia-de-ia`, `/servicos/llmops`, etc.
   - Requer conteúdo em S3 e rotas correspondentes.

5. **Criar páginas de produto individuais**
   - `/produtos/strategos`, `/produtos/rbx-ledger`, etc.

6. **Implementar sitemap dinâmico**
   - Incluir posts do blog/journal automaticamente.

7. **Criar imagem OG padrão**
   - `static/brand/rbx-og.jpg` (1200×630 px) para Open Graph/Twitter.

8. **Ativar HSTS**
   - Requer confirmação de que todos os subdomínios usam HTTPS.

### Baixa prioridade
9. **Implementar CSP**
10. **Criar log de crawler**
11. **Aplicar SEO ao `merovelis-site` e `strategos-site`**
12. **Criar company page no LinkedIn para RBX Systems**

---

## 5. Roadmap recomendado

### 30 dias
- [x] Publicar conteúdo para `/sobre`, `/leandro-damasio`, `/solutions`, `/products`.
- [ ] Criar páginas de serviço e produto individuais.
- [x] Configurar Search Console (`rbx.ia.br` e `rbxsystems.ch`).
- [ ] Submeter sitemaps no Search Console.
- [ ] Publicar 8–10 artigos do plano editorial.
- [ ] Criar imagem OG padrão.

### 60 dias
- [ ] Implementar sitemap dinâmico.
- [ ] Configurar DNS/e-mail para `rbx.ia.br`.
- [ ] Evoluir DMARC para `p=quarantine`.
- [ ] Publicar 15–20 artigos adicionais.
- [ ] Aplicar SEO a Merovelis e Strategos.

### 90 dias
- [ ] Monitorar posicionamento e tráfego orgânico.
- [ ] Refinar keywords e metadados com base no Search Console.
- [ ] Ativar HSTS e CSP.
- [ ] Criar calendário editorial e agentes de publicação.

---

## 6. Como fazer deploy

1. Revisar as mudanças localmente:
   ```bash
   git diff --stat
   pnpm check
   pnpm build
   pnpm seo-check
   ```

2. Commitar e fazer merge para `main`:
   ```bash
   git add .
   git commit -m "feat(seo): componente Seo, schemas, robots/sitemap, páginas novas"
   git push origin feat/glass-nav-pill
   # abrir PR para main
   ```

3. O CI executa verificação SEO, build e deploy automático via ArgoCD.

---

## 7. Riscos e rollback

| Mudança | Risco | Rollback |
|---|---|---|
| Seo component | Baixo | Remover importações |
| robots.txt | Baixo | Deletar arquivo |
| sitemap.xml | Baixo | Deletar arquivo |
| Novas rotas | Médio | Remover pastas em `src/routes/` |
| hooks.server.ts headers | Médio | Reverter arquivo |
| HSTS (não ativado) | Alto se ativado | Esperar expiração ou remover header |
| DNS/e-mail | Alto | Restaurar registros anteriores |

---

## 8. Notas operacionais

- O trabalho foi realizado na branch `feat/glass-nav-pill` porque era a branch atual.
- Nenhum commit foi feito automaticamente; o usuário deve revisar e commitar.
- Nenhuma mudança de DNS, MX, SPF, DKIM, DMARC ou Search Console foi aplicada.
- Nenhum secret foi exposto.
