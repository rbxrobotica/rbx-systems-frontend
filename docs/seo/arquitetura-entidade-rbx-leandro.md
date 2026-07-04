# Arquitetura de SEO e Entidade — RBX Systems / Leandro Damasio

> Define a estrutura semântica, a hierarquia de URLs e os tipos de schema.org para conectar Leandro Damasio, RBX Systems, produtos, serviços e conteúdo.

---

## 1. Princípios

1. **Uma entidade por página**: cada URL representa uma entidade clara (pessoa, organização, produto, serviço, artigo).
2. **Grafo conectado**: JSON-LD `@graph` liga explicitamente Person ↔ Organization ↔ Product ↔ Service ↔ Article.
3. **Canônico por idioma**: `rbx.ia.br/*` é pt-BR; `rbxsystems.ch/*` é en. Uso de `hreflang` e canonical auto-referencial.
4. **Domínios de marca**: RBX Systems (institucional), Merovelis (marca de produto), Strategos (produto).
5. **Nada de black-hat**: sem keyword stuffing, cloaking, conteúdo artificial ou farms de links.

---

## 2. Arquitetura de domínios

```
rbx.ia.br          → RBX Systems (pt-BR)
rbxsystems.ch      → RBX Systems (en)
merovelis.com      → Marca de produto RBX para logística/operações críticas (en)
strategos.gr       → Produto Strategos (en)
```

**Relações explícitas nos sites:**
- RBX Systems → "Merovelis é uma marca RBX Systems" → link para merovelis.com
- Merovelis → "Strategos by Merovelis" → link para strategos.gr
- Merovelis → "Uma marca RBX Systems" → link para rbxsystems.ch
- Strategos → "Built by Merovelis, a RBX Systems brand" → links para merovelis.com e rbxsystems.ch

---

## 3. Estrutura de URLs — RBX Systems

### Páginas institucionais

| URL pt-BR | URL en | Entidade | Schema |
|---|---|---|---|
| `/` | `/` | WebSite / WebPage | `WebSite`, `Organization`, `WebPage` |
| `/sobre` | `/about` | Sobre a empresa | `AboutPage`, `Organization` |
| `/leandro-damasio` | `/leandro-damasio` | Página do fundador | `ProfilePage`, `Person` |
| `/contato` | `/contact` | Contato | `ContactPage`, `Organization` |

### Serviços

| URL pt-BR | URL en | Entidade | Schema |
|---|---|---|---|
| `/servicos/engenharia-de-ia` | `/services/ai-engineering` | Serviço | `Service` |
| `/servicos/llmops` | `/services/llmops` | Serviço | `Service` |
| `/servicos/agentes-de-ia` | `/services/ai-agents` | Serviço | `Service` |
| `/servicos/devops-cloud` | `/services/devops-cloud` | Serviço | `Service` |
| `/servicos/software-financeiro` | `/services/financial-software` | Serviço | `Service` |
| `/servicos/software-para-logistica` | `/services/logistics-software` | Serviço | `Service` |
| `/servicos/observabilidade` | `/services/observability` | Serviço | `Service` |

### Produtos

| URL pt-BR | URL en | Entidade | Schema |
|---|---|---|---|
| `/produtos` | `/products` | Listagem | `CollectionPage` |
| `/produtos/strategos` | `/products/strategos` | Produto | `SoftwareApplication` |
| `/produtos/rbx-ledger` | `/products/rbx-ledger` | Produto | `SoftwareApplication` |
| `/produtos/rbx-yield` | `/products/rbx-yield` | Produto | `SoftwareApplication` |
| `/produtos/rbx-maestro` | `/products/rbx-maestro` | Produto | `SoftwareApplication` |
| `/produtos/robson` | `/products/robson` | Produto | `SoftwareApplication` |
| `/produtos/argos-radar` | `/products/argos-radar` | Produto | `SoftwareApplication` |

### Conteúdo

| URL pt-BR | URL en | Entidade | Schema |
|---|---|---|---|
| `/journal` | `/journal` | Listagem de posts | `CollectionPage`, `Blog` |
| `/blog/[slug]` | `/blog/[slug]` | Artigo/journal | `BlogPosting` |
| `/cases` | `/cases` | Cases | `CollectionPage` |
| `/cases/[slug]` | `/cases/[slug]` | Case | `Article` |
| `/newsroom` | `/newsroom` | Notícias | `CollectionPage` |
| `/changelog` | `/changelog` | Changelog | `CollectionPage` |
| `/atelier` | `/atelier` | Laboratório/R&D | `CollectionPage` |

---

## 4. Entidades e schemas

### 4.1 Person — Leandro Damasio

Tipo: `Person`  
Página canônica: `https://rbx.ia.br/leandro-damasio` (pt-BR) / `https://rbxsystems.ch/leandro-damasio` (en)

Propriedades:
- `@id`: `https://rbx.ia.br/#leandro-damasio`
- `name`: "Leandro Damasio"
- `jobTitle`: "Founder & CEO, RBX Systems"
- `description`: "AI Engineer, Platform & Backend Systems, Technical Leadership"
- `url`: `https://rbx.ia.br/leandro-damasio`
- `sameAs`:
  - `https://www.linkedin.com/in/ldamasio/`
  - `https://github.com/ldamasio`
  - `https://twitter.com/ldamasio` (se existir)
  - `https://rbxsystems.ch/leandro-damasio`
- `worksFor`: `@id` da Organization RBX Systems
- `alumniOf`: empresas anteriores (Enforce, Arte Arena, Stefanini, Global Hitss, NPL Brasil)
- `knowsAbout`: ["AI Engineering", "LLMOps", "Agentic Systems", "DevOps", "Cloud-Native Systems", "Software Architecture", "Strategic Decision Systems"]

### 4.2 Organization — RBX Systems

Tipo: `Organization`  
Página canônica: `https://rbx.ia.br/` / `https://rbxsystems.ch/`

Propriedades:
- `@id`: `https://rbx.ia.br/#organization`
- `name`: "RBX Systems"
- `alternateName`: ["RBX", "RBX Robótica"]
- `url`: `https://rbx.ia.br`
- `logo`: `https://rbx.ia.br/brand/rbx-mark.svg`
- `sameAs`:
  - `https://github.com/rbxrobotica`
  - `https://www.linkedin.com/company/rbx-systems` (se existir; senão, usar LinkedIn pessoal)
  - `https://rbxsystems.ch`
  - `https://merovelis.com`
  - `https://strategos.gr`
- `founder`: `@id` de Leandro Damasio
- `foundingDate`: "2024" (confirmar)
- `description`: "Engenharia de sistemas, automação operacional, IA aplicada e infraestrutura em nuvem para operações de alta exigência."
- `areaServed`: "Worldwide"
- `knowsAbout`: ["AI Engineering", "LLMOps", "Agentic Systems", "DevOps", "Cloud", "Financial Software", "Logistics Software", "Observability"]

### 4.3 WebSite

Tipo: `WebSite`  
Página canônica: `https://rbx.ia.br/` / `https://rbxsystems.ch/`

Propriedades:
- `@id`: `https://rbx.ia.br/#website`
- `name`: "RBX Systems"
- `url`: `https://rbx.ia.br`
- `publisher`: `@id` da Organization RBX Systems
- `inLanguage`: "pt-BR" / "en"

### 4.4 WebPage

Tipo: `WebPage` em todas as páginas  
Propriedades:
- `@id`: `{canonical}#webpage`
- `url`: `{canonical}`
- `name`: título da página
- `description`: meta description
- `isPartOf`: `@id` do WebSite
- `about`: entidade principal da página (Organization, Person, Product, Service)
- `inLanguage`: "pt-BR" / "en"

### 4.5 Service

Tipo: `Service` para cada página de serviço.

Propriedades:
- `@id`: `{canonical}#service`
- `serviceType`: nome do serviço
- `provider`: `@id` da Organization RBX Systems
- `areaServed`: "Worldwide"
- `description`: descrição do serviço
- `url`: `{canonical}`

Exemplo — Engenharia de IA:
```json
{
  "@type": "Service",
  "@id": "https://rbx.ia.br/servicos/engenharia-de-ia#service",
  "serviceType": "Engenharia de IA",
  "provider": { "@id": "https://rbx.ia.br/#organization" },
  "description": "...",
  "areaServed": "Worldwide",
  "url": "https://rbx.ia.br/servicos/engenharia-de-ia"
}
```

### 4.6 SoftwareApplication — Produtos

Tipo: `SoftwareApplication` para cada produto.

Propriedades:
- `@id`: `{canonical}#product`
- `name`: nome do produto
- `applicationCategory`: "BusinessApplication" / "FinanceApplication" / "SecurityApplication"
- `operatingSystem`: "Any"
- `offers`: `{ "@type": "Offer", "price": "0", "priceCurrency": "USD" }` (ajustar)
- `provider`: `@id` da Organization RBX Systems
- `description`: descrição do produto

### 4.7 BlogPosting / Article

Tipo: `BlogPosting` para journal posts.

Propriedades:
- `@id`: `{canonical}#article`
- `headline`: título
- `description`: excerpt
- `author`: `@id` de Leandro Damasio ou Organization RBX Systems
- `publisher`: `@id` da Organization RBX Systems
- `datePublished`: data
- `dateModified`: data
- `image`: cover URL
- `url`: `{canonical}`
- `inLanguage`: "pt-BR" / "en"
- `articleSection`: "Journal"

---

## 5. Grafo semântico de exemplo (@graph)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://rbx.ia.br/#leandro-damasio",
      "name": "Leandro Damasio",
      "jobTitle": "Founder & CEO, RBX Systems",
      "url": "https://rbx.ia.br/leandro-damasio",
      "sameAs": [
        "https://www.linkedin.com/in/ldamasio/",
        "https://github.com/ldamasio"
      ],
      "worksFor": { "@id": "https://rbx.ia.br/#organization" }
    },
    {
      "@type": "Organization",
      "@id": "https://rbx.ia.br/#organization",
      "name": "RBX Systems",
      "alternateName": ["RBX", "RBX Robótica"],
      "url": "https://rbx.ia.br",
      "logo": "https://rbx.ia.br/brand/rbx-mark.svg",
      "sameAs": [
        "https://github.com/rbxrobotica",
        "https://rbxsystems.ch",
        "https://merovelis.com",
        "https://strategos.gr"
      ],
      "founder": { "@id": "https://rbx.ia.br/#leandro-damasio" }
    },
    {
      "@type": "WebSite",
      "@id": "https://rbx.ia.br/#website",
      "name": "RBX Systems",
      "url": "https://rbx.ia.br",
      "publisher": { "@id": "https://rbx.ia.br/#organization" },
      "inLanguage": "pt-BR"
    }
  ]
}
```

---

## 6. hreflang e canonical

Para cada página que existe em ambos os idiomas:

```html
<link rel="canonical" href="https://rbx.ia.br/servicos/engenharia-de-ia" />
<link rel="alternate" hreflang="pt-BR" href="https://rbx.ia.br/servicos/engenharia-de-ia" />
<link rel="alternate" hreflang="en" href="https://rbxsystems.ch/services/ai-engineering" />
<link rel="alternate" hreflang="x-default" href="https://rbxsystems.ch/services/ai-engineering" />
```

Para páginas que existem em apenas um idioma, usar canonical auto-referencial sem `hreflang`.

---

## 7. Conexões entre marcas

Cada site deve mencionar explicitamente as outras entidades da família:

- **RBX Systems** footer: "RBX Systems builds Merovelis and partners with product teams." + link para merovelis.com.
- **Merovelis** footer: "Merovelis is a product brand of RBX Systems." + links para rbxsystems.ch e rbx.ia.br.
- **Strategos** footer: "Strategos is built by Merovelis, a RBX Systems brand." + links para merovelis.com e rbxsystems.ch.

---

## 8. Recomendações de implementação

1. Criar componente `Seo.svelte` no `rbx-robotica-frontend` inspirado no `Seo.svelte` do `merovelis-site`.
2. Adicionar schema `@graph` em todas as páginas via componente SEO.
3. Garantir que cada página tenha H1 único, title único e meta description única.
4. Criar rotas em inglês `/services/*` e `/products/*` para `rbxsystems.ch`.
5. Manter `rbx.ia.br/*` em português e `rbxsystems.ch/*` em inglês.
6. Implementar `hreflang` via server load ou `svelte:head`.
7. Conectar JSON-LD entre sites usando `sameAs`.
