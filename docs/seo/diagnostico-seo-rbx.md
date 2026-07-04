# Diagnóstico Estratégico de SEO — RBX Systems / Leandro Damasio

> Data do diagnóstico: 2026-07-03  
> Agente: Kimi CLI / RBX Agent Orchestration  
> Escopo: presença pública de RBX Systems, Leandro Damasio, Merovelis e Strategos.

---

## 1. Resumo executivo

A RBX Systems já possui uma infraestrutura digital soberana funcional (k3s, Contabo, S3, GitOps, domínios `.ia.br` e `.ch`), mas a **camada de SEO técnico, descoberta por LLMs e autoridade de entidade está incompleta**. O maior risco imediato é a ausência de `robots.txt` e `sitemap.xml` nos domínios principais, combinada a páginas em inglês retornando 404 e à falta de dados estruturados conectando Leandro Damasio → RBX → produtos → serviços.

Nenhuma área sensível está exposta acidentalmente, mas vários subdomínios internos são publicamente resolvíveis e carecem de bloqueio explícito de crawlers.

---

## 2. Inventário de domínios e subdomínios

| Domínio | Tipo | IP principal | Observação |
|---|---|---|---|
| `rbx.ia.br` | Institucional BR | `158.220.116.31` | SvelteKit SSR (adapter-node). Sem robots/sitemap. |
| `rbxsystems.ch` | Institucional EN | `158.220.116.31` | Mesmo app. `/solutions` e `/products` retornam **404**. |
| `merovelis.com` | Marca de produto | `158.220.116.31` | SvelteKit static. Metadados OK (canonical, OG, Twitter). Sem robots/sitemap. |
| `strategos.gr` | Produto próprio | `158.220.116.31` | Next.js 15 static export. Title/description bons. Sem OG canônico, sem JSON-LD, sem robots/sitemap. |
| `www.rbxsystems.ch` | Alias | CNAME → rbxsystems.ch | Redirecionamento implícito não testado. |
| `www.merovelis.com` | Alias | CNAME → merovelis.com | Redirecionamento implícito não testado. |
| `mail.rbxsystems.ch` | MX/Servidor de e-mail | `5.182.33.93` | Aponta para infra de e-mail. |
| `console.rbx.ia.br` | App privado | `158.220.116.31` | Deve ser bloqueado em robots.txt. |
| `console.rbxsystems.ch` | App privado | `158.220.116.31` | Deve ser bloqueado em robots.txt. |
| `console.merovelis.com` | App privado | `158.220.116.31` | Deve ser bloqueado em robots.txt. |
| `app.rbxsystems.ch` | App privado | `158.220.116.31` | Deve ser bloqueado em robots.txt. |
| `app.merovelis.com` | App privado | `158.220.116.31` | Deve ser bloqueado em robots.txt. |
| `cms.rbxsystems.ch` | CMS privado | `158.220.116.31` | Deve ser bloqueado em robots.txt. |
| `staging.rbx.ia.br` | Staging | `158.220.116.31` | Deve ser bloqueado em robots.txt e protegido por auth. |

### Achados de DNS

- **rbx.ia.br** não possui registros TXT, MX, SPF, DMARC nem DKIM visíveis. Isso é problemático para entrega de e-mail institucional e verificação de domínio.
- **rbxsystems.ch** possui SPF (`v=spf1 include:spf.mtasv.net ~all`) e DMARC (`v=DMARC1; p=none; rua=mailto:dmarc@rbxsystems.ch; fo=1`).
- **merovelis.com** possui DMARC no nível do domínio (apontando para `dmarc@rbxsystems.ch`), mas não possui SPF/MX próprios.
- **strategos.gr** possui SPF e MX, mas não DMARC.
- Nenhum CAA record encontrado.
- Todos os domínios compartilham o mesmo IP de origem (`158.220.116.31`), o que pode dificultar a diferenciação de autoridade se os sites não se linkarem explicitamente.

---

## 3. Aplicações públicas e privadas

### Públicas

| Aplicação | Framework | Deploy | Observação |
|---|---|---|---|
| `rbx-robotica-frontend` | SvelteKit 5 + adapter-node | k3s / nginx | Site institucional principal. SSR. Conteúdo em S3 privado via Content Gateway. |
| `merovelis-site` | SvelteKit 5 + adapter-static | k3s / nginx | Site de marca. Bem estruturado, mas carece de sitemap/robots. |
| `strategos-site` | Next.js 15 + static export | k3s / nginx | Landing do produto. Bem escrito, mas sem schema/robots/sitemap. |

### Privadas (requerem `Disallow` + noindex/auth)

- `console.*`
- `app.*`
- `cms.rbxsystems.ch`
- `staging.rbx.ia.br`
- Futuros: `auth.merovelis.com`, APIs internas.

---

## 4. Repositórios e presença GitHub

### Organização
- **rbxrobotica**: https://github.com/rbxrobotica
- Repositórios públicos relevantes: `rbx-systems-frontend`, `rbx-infra`, `eden`, `thalamus-core`, `truthmetal`, `rbx-harness`, `rbx-vps-grid-pulumi`, `rbx-k8s-cluster`.
- Repositórios privados relevantes: `rbx-agent-layer`, `rbx-governance`, `rbx-security`, `rbx-comms`, `rbx-console`, `rbx-comms-console`, `rbx-identity`, `rbx-maestro`, `rbx-commerce`, `rbx-data`, `rbx-memory`, `rbx-observability`, `strategos-ui`, `strategos-site`, `merovelis-site`, `rbx-cms`, `rbx-ledger`, `verentir`, `rbx-market-briefing`, etc.

### Perfil pessoal
- **Leandro Damasio**: https://github.com/ldamasio
- Bio: "AI Engineer • Platform & Backend Systems • Technical Leadership | Production AI • Cloud-Native • Governance & Reliability | Founder and CEO of RBX Robótica"
- LinkedIn: https://www.linkedin.com/in/ldamasio/
- E-mail público: ldamasio@gmail.com
- Repositórios públicos de autoridade pessoal:
  - `ldamasio/robson` — open-source trading execution engine (8 stars, 4 forks)
  - `ldamasio/strategos-agents` — agentes de IA para decisão estratégica
  - `ldamasio/rbx-infra` — GitOps do cluster RBX
  - `ldamasio/lda-front` — site pessoal
  - `ldamasio/playlist-fs`, `ldamasio/wt`, `ldamasio/x.sh` — ferramentas técnicas
  - Repositórios de ML/IA: CNN handwritten digits, Financial Fraud Detection, Sentiment Analysis BERT, Intelligent OCR, Stable Diffusion, Whisper, GPT4 LangChain Chatbot.

### Outro perfil
- https://github.com/leandrodamasio — perfil secundário/inativo (apenas 3 repos, 2 de estudo React). **Não deve ser promovido como principal.**

---

## 5. Estado de metadados e dados estruturados

### rbx.ia.br / rbxsystems.ch

| Página | Title | Description | Canonical | OG | Twitter | JSON-LD | H1 |
|---|---|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/solucoes` | ✅ (genérico) | ✅ (genérico) | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/produtos` | ✅ (genérico) | ✅ (genérico) | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/journal` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/cases` | ✅ (genérico) | ✅ (genérico) | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/blog/[slug]` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/newsroom`, `/trust`, `/atelier`, `/changelog` | ✅ | ✅ (se houver conteúdo) | ❌ | ❌ | ❌ | ❌ | ✅ |

### rbxsystems.ch (problemas de roteamento)

| Rota | Status |
|---|---|
| `/solutions` | **404** |
| `/products` | **404** |
| `/journal` | 200 |
| `/cases` | 200 |

O app SvelteKit não possui rotas em inglês para soluções e produtos; o conteúdo é carregado via S3 com chaves `site/en/{page}/index.md`, mas a rota da URL permanece em português. Isso quebra a experiência e o SEO internacional.

### merovelis.com

| Página | Title | Description | Canonical | OG | Twitter | JSON-LD |
|---|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/about` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/product` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/contact` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/legal` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### strategos.gr

| Página | Title | Description | Canonical | OG | Twitter | JSON-LD |
|---|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. robots.txt e sitemap.xml

| Domínio | robots.txt | sitemap.xml |
|---|---|---|
| `rbx.ia.br` | ❌ 404 | ❌ 404 |
| `rbxsystems.ch` | ❌ 404 | ❌ 404 |
| `merovelis.com` | ❌ retorna HTML | ❌ retorna HTML |
| `strategos.gr` | ❌ retorna HTML | ❌ retorna HTML |

**Impacto:** motores de busca rastreiam todas as URLs que encontrarem, incluindo páginas de erro, parâmetros e potencialmente áreas privadas. Não há diretriz de descoberta de conteúdo.

---

## 7. E-mail e reputação de envio

| Domínio | MX | SPF | DKIM | DMARC | Risco |
|---|---|---|---|---|---|
| `rbx.ia.br` | ❌ | ❌ | ❌ | ❌ | **Alto** — sem infra de e-mail configurada |
| `rbxsystems.ch` | ✅ | ✅ (Postmark) | Não verificado | ✅ `p=none` | Médio — DMARC em modo none |
| `merovelis.com` | Herda? | ❌ | ❌ | ✅ `p=none` | Médio/Alto |
| `strategos.gr` | ✅ | ✅ | ❌ | ❌ | Médio/Alto |

### Observações
- `spf.mtasv.net` indica uso do Postmark.
- DMARC `p=none` é apenas monitoração; recomenda-se evoluir para `p=quarantine` após validação.
- `rbx.ia.br` precisa de MX + SPF + DKIM + DMARC se for usado para e-mail institucional.

---

## 8. Certificados e HTTPS

Todos os domínios testados respondem em HTTPS com HTTP/2 e certificados válidos (provavelmente Let's Encrypt via cert-manager). Não foram detectados problemas de TLS. HSTS não verificado explicitamente.

---

## 9. Cluster e deploy

- Cluster: k3s na Contabo.
- Ingress: Traefik.
- Certificados: cert-manager.
- GitOps: ArgoCD (app-of-apps em `rbx-infra`).
- CI/CD: GitHub Actions (build + push de imagens, image-updater).
- Aplicações em SSR (rbx-robotica-frontend) não são prerenderizadas; conteúdo é legível por crawlers graças ao SSR.

---

## 10. Diagnóstico por categoria

### ✅ O que existe
- Domínios institucionais principais registrados e no ar.
- Site SSR funcional com conteúdo carregado de S3.
- Blog/journal operacional com workflow de publicação documentado.
- Marca de produto (Merovelis) e produto (Strategos) com sites separados.
- Presença no GitHub com repositórios públicos de autoridade.
- LinkedIn do fundador ativo e bem descrito.
- Infraestrutura GitOps madura (k3s, ArgoCD, cert-manager, Traefik).
- Componente `Seo.svelte` no merovelis-site que pode ser reaproveitado.

### ❌ O que está ausente
- Open Graph e Twitter Cards em strategos.gr.
- Canonical URLs em strategos.gr.
- JSON-LD / schema.org em strategos.gr.
- Sitemap dinâmico que inclua posts do journal/blog automaticamente.
- CSP e HSTS (parcial: X-Frame-Options, X-Content-Type-Options, Referrer-Policy e Permissions-Policy já estão ativos).
- Registros DNS de e-mail para rbx.ia.br.
- Verificação do Search Console para `merovelis.com` e `strategos.gr`.

### ✅ O que foi implementado
- `robots.txt` e `sitemap.xml` funcionais em `rbx.ia.br` e `rbxsystems.ch`.
- Open Graph, Twitter Cards, canonical URLs, hreflang e JSON-LD em `rbx.ia.br` e `rbxsystems.ch`.
- Páginas `/sobre`, `/leandro-damasio`, `/solucoes`, `/produtos` e equivalentes em inglês (`/about`, `/solutions`, `/products`, `/contact`, `/contato`).
- Componente `Seo.svelte` com suporte a verificação do Search Console via meta tag.
- Verificação das propriedades `https://rbx.ia.br/` e `https://rbxsystems.ch/` no Google Search Console.

### ⚠️ O que está incorreto
- `/solutions` e `/products` retornam 404 em `rbxsystems.ch`.
- URLs em inglês do site RBX apontam para rotas em português.
- `robots.txt` e `sitemap.xml` não existem — retornam 404/HTML.
- README do `rbx-robotica-frontend` está desatualizado (fala em Next.js).
- `rbxsystems.ch` não tem conteúdo de produto/serviço em inglês servido.

### 🔄 O que está duplicado
- Similaridade de conteúdo entre `rbx.ia.br` e `rbxsystems.ch` sem canonicalização clara por idioma.
- `Merovelis` e `Strategos` têm mensagens sobre "Situation Room" que podem parecer concorrentes se não forem explicitamente conectadas (RBX → Merovelis → Strategos).

### 🔴 O que está perigoso
- Subdomínios privados (`console.*`, `app.*`, `cms.*`, `staging.*`) são publicamente resolvíveis e não têm `Disallow` em robots.txt (que nem existe).
- Ausência de DMARC/DKIM/SPF em `rbx.ia.br` e `strategos.gr` pode comprometer entrega de e-mail.
- `rbx-robotica-frontend` em branch ativa (`feat/glass-nav-pill`) com modificações não commitadas; qualquer deploy deve considerar merge/integração.

### ⚡ O que pode melhorar rápido
1. Criar componente SEO reutilizável no `rbx-robotica-frontend`.
2. Adicionar `robots.txt` e `sitemap.xml` estáticos/dinâmicos.
3. Adicionar Open Graph, Twitter Card e canonical em todas as páginas.
4. Corrigir rotas `/solutions` e `/products` para rbxsystems.ch.
5. Adicionar JSON-LD nas páginas principais.
6. Criar páginas `/sobre` e `/leandro-damasio`.
7. Atualizar README do rbx-robotica-frontend.

### 🤔 O que exige decisão estratégica
1. **Arquitetura de domínios**: RBX Systems deve continuar com `rbx.ia.br` (BR) e `rbxsystems.ch` (EN) ou consolidar em um domínio principal com subdiretórios de idioma?
2. **Página do fundador**: criar `/leandro-damasio` em RBX ou manter site pessoal em `lda-front`?
3. **Merovelis vs Strategos**: como balancear SEO para que Merovelis e Strategos se fortaleçam mutuamente sem canibalização?
4. **CMS centralizado**: o conteúdo do blog/page continua em S3 ou migra para o novo `rbx-cms`?
5. **Idioma padrão**: `rbx.ia.br` → pt-BR e `rbxsystems.ch` → en é a estratégia correta, mas precisa de `hreflang`.

---

## 11. Mapa de prioridades

### Alta prioridade
- [ ] Implementar `robots.txt` e `sitemap.xml` em rbx.ia.br/rbxsystems.ch.
- [ ] Corrigir 404 de `/solutions` e `/products` em rbxsystems.ch.
- [ ] Adicionar canonical, OG, Twitter Card e JSON-LD em todas as páginas RBX.
- [ ] Criar páginas `/sobre` e `/leandro-damasio`.
- [ ] Configurar DNS de e-mail para rbx.ia.br (MX + SPF + DKIM + DMARC).

### Média prioridade
- [ ] Adicionar `hreflang` entre rbx.ia.br e rbxsystems.ch.
- [ ] Implementar JSON-LD em merovelis.com e strategos.gr.
- [ ] Criar sitemap dinâmico incluindo posts do journal.
- [ ] Adicionar headers de segurança no Traefik/ingress.
- [ ] Verificar/otimizar velocidade (Core Web Vitals).

### Baixa prioridade
- [ ] Implementar log de crawler/SEO.
- [ ] Criar template de post com schema `BlogPosting`.
- [ ] Automatizar validação de metadados no CI.
- [ ] Criar calendário editorial e agentes de publicação.
