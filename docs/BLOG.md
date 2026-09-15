# Blog — RBX Systems

> **Atualizado 2026-07-08:** o site é **SvelteKit SSR** (não mais Next.js/ISR). O bucket é **privado**; capas são servidas via proxy `/api/blog/cover/...`. Propagação após publish: **~60s** (TTL do Content Gateway), sem stale fallback e sem redeploy. Workflow canônico e atual: `~/docs/rbx-content-publish-workflow.md`. O restante deste arquivo mantém a orientação editorial (estilo, PT-BR, specs de capa) — ignore quaisquer remanescentes de MDX/ISR.

O blog vive em **rbx.ia.br/blog**. Posts são arquivos Markdown armazenados no Contabo Object Storage (S3-compatible, **bucket privado**). Publicar não requer deploy — o site lê o S3 server-side via Content Gateway e reflete mudanças em **~60s** (TTL do cache do gateway).

---

## Regras editoriais

- **Idioma:** posts podem ter variantes em `pt-BR` e `en`
- **Seleção de idioma:** `rbx.ia.br` prioriza `pt-BR`, `rbxsystems.ch` prioriza `en`, e o toggle do header permite alternância manual
- **Tom:** direto, claro, institucional — estilo Cursor ou Anthropic
- **Sem detalhes sensíveis de segurança:** não expor IPs internos, credenciais, topologia de rede, ou incidentes em aberto
- **Commit obrigatório:** após publicar, commitar o Markdown no git — S3 é o storage vivo, git é o backup

---

## Estrutura no bucket

```
s3://rbx-content/
  blog/
    posts/
      YYYY-MM-DD-slug.md           ← fallback legado / idioma único
      YYYY-MM-DD-slug.pt-BR.md     ← variante pt-BR opcional
      YYYY-MM-DD-slug.en.md        ← variante en opcional
    covers/
      YYYY-MM-DD-slug-v1.jpg  ← capa versionada (1200×630)
```

---

## Frontmatter do post

```yaml
---
title: 'Título do post'
date: 'YYYY-MM-DD'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [tag1, tag2]
excerpt: 'Uma frase que resume o post. Aparece na listagem e no topo da página.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/YYYY-MM-DD-slug-v1.jpg'
---
```

> **Importante:** só inclua `cover` depois de fazer o upload da imagem. A URL
> explícita e versionada é obrigatória; não sobrescreva uma revisão publicada.

---

## Credenciais S3

As credenciais ficam no secret `contabo-s3-credentials` no namespace `rbx-ia-br` do cluster:

```bash
export AWS_ACCESS_KEY_ID=$(kubectl get secret contabo-s3-credentials -n rbx-ia-br \
  -o jsonpath='{.data.AWS_ACCESS_KEY_ID}' | base64 -d)
export AWS_SECRET_ACCESS_KEY=$(kubectl get secret contabo-s3-credentials -n rbx-ia-br \
  -o jsonpath='{.data.AWS_SECRET_ACCESS_KEY}' | base64 -d)
```

Ou configure manualmente se não tiver acesso ao cluster:

```bash
export AWS_ACCESS_KEY_ID=<sua_access_key>
export AWS_SECRET_ACCESS_KEY=<sua_secret_key>
```

---

## Workflow manual (humano)

### 1. Escreva o post

Crie `blog-posts/YYYY-MM-DD-slug.md` com o frontmatter acima e o corpo em Markdown.

Se o post tiver variantes por idioma, use também:

- `blog-posts/YYYY-MM-DD-slug.pt-BR.md`
- `blog-posts/YYYY-MM-DD-slug.en.md`

O slug público continua sendo `YYYY-MM-DD-slug`. O site escolhe a variante com base no locale atual e faz fallback para o arquivo sem sufixo se a variante não existir.

### 2. Publique no S3

```bash
./scripts/blog-publish.sh blog-posts/YYYY-MM-DD-slug.md
```

Para publicar todas as variantes do mesmo post de uma vez:

```bash
./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug
```

O script procura, nesta ordem, por:

- `blog-posts/YYYY-MM-DD-slug.md`
- `blog-posts/YYYY-MM-DD-slug.pt-BR.md`
- `blog-posts/YYYY-MM-DD-slug.en.md`

### 3. Imagem de capa

Adicione a especificação a `blog-covers-src/covers.json`, gere a capa com o
renderer compartilhado e faça upload:

```bash
python3 scripts/generate-cover.py --slug YYYY-MM-DD-slug \
  --raster-dir /tmp/rbx-journal-covers
./scripts/blog-cover-upload.sh \
  /tmp/rbx-journal-covers/YYYY-MM-DD-slug-v1.jpg YYYY-MM-DD-slug
```

Adicione o campo `cover` no frontmatter do Markdown e republique:

```bash
./scripts/blog-publish.sh blog-posts/YYYY-MM-DD-slug.md
```

### 4. Commit

```bash
git add blog-posts/YYYY-MM-DD-slug.md
git commit -m "blog: add post YYYY-MM-DD-slug"
git push
```

---

## Workflow agêntico (Claude / Codex)

Ao pedir a um agente para publicar um post, ele executará os seguintes passos em ordem:

### Regra padrão para novos posts

Se o usuário enviar um texto em **português** ou **inglês**, o agente deve:

1. Tratar esse texto como fonte canônica
2. Produzir automaticamente a variante no outro idioma
3. Criar os dois arquivos:
   `blog-posts/YYYY-MM-DD-slug.pt-BR.md`
   `blog-posts/YYYY-MM-DD-slug.en.md`
4. Reutilizar a mesma capa para ambas as variantes
5. Publicar tudo com `./scripts/blog-publish.sh --all-locales YYYY-MM-DD-slug`

Se o caminho de uma capa vier no mesmo prompt, o agente deve primeiro validá-la
contra o contrato determinístico. Um bitmap sem fonte reproduzível exige uma
exceção explícita do operador.

### Passos

1. Escreve os Markdown de locale em `blog-posts/` — sem `cover` ainda
2. Obtém as credenciais do secret `contabo-s3-credentials` via kubectl
3. Faz upload de todas as variantes com `./scripts/blog-publish.sh --all-locales`
4. Adiciona a especificação da capa ao catálogo e executa `scripts/generate-cover.py`
5. Revisa visualmente o SVG/raster abstrato, escuro e sem texto
6. Faz upload da revisão versionada com `./scripts/blog-cover-upload.sh`
7. Adiciona `cover:` no frontmatter das duas variantes e republica tudo
8. Verifica os objetos no S3
9. Commita os Markdown no git

> O fluxo detalhado para agentes está em `CLAUDE.md` na raiz do repositório.

---

## Especificações da imagem de capa

| Propriedade  | Valor                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| Dimensões    | 1200 × 630 px                                                             |
| Formato      | JPEG ou PNG                                                               |
| Aspect ratio | 1.91:1                                                                    |
| Estilo       | Fundo escuro, abstrato, focado no tema e sem texto                        |
| Fonte        | `covers.json` + `blog-covers-src/{slug}.svg`, gerados deterministicamente |
| Chave S3     | `blog/covers/{slug}-v{revision}.{ext}`                                    |
| Uso          | Capa do artigo e `og:image` para WhatsApp/redes sociais                   |

A revisão começa em 1 e é incrementada sempre que os pixels publicados mudam.
Uma capa gerada por modelo ou fotográfica não pertence ao fluxo canônico e
exige exceção explícita do operador.

---

## Scripts

| Script                                                      | Uso                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `./scripts/blog-publish.sh <arquivo.md>`                    | Faz upload do post para o S3                                          |
| `./scripts/blog-publish.sh --all-locales <slug-ou-arquivo>` | Faz upload do post base e de todas as variantes de locale encontradas |
| `./scripts/blog-cover-upload.sh <imagem.jpg> <slug>`        | Faz upload da capa para o S3                                          |

---

## Referência rápida — aws CLI

```bash
# Listar posts
aws s3 ls s3://rbx-content/blog/posts/ --endpoint-url https://eu2.contabostorage.com

# Listar capas
aws s3 ls s3://rbx-content/blog/covers/ --endpoint-url https://eu2.contabostorage.com

# Remover post
aws s3 rm s3://rbx-content/blog/posts/YYYY-MM-DD-slug.md \
  --endpoint-url https://eu2.contabostorage.com
```

---

## Cache e propagação

O site é **SSR (SvelteKit)**. O Content Gateway lê o S3 server-side com cache em memória (TTL ~60s). Após qualquer publicação ou atualização no S3, o conteúdo atualizado aparece no site em até ~60s, sem necessidade de redeploy. Se o conteúdo remoto estiver indisponível, a página falha explicitamente.
