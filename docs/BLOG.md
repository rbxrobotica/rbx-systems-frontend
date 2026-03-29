# Blog — RBX Systems

O blog vive em **rbx.ia.br/blog**. Posts são arquivos MDX armazenados no Contabo Object Storage (S3-compatible). Publicar não requer deploy — o site busca o conteúdo do S3 a cada ciclo de ISR (revalidate: 5 minutos).

---

## Regras editoriais

- **Idioma:** inglês (padrão institucional RBX Systems)
- **Tom:** direto, claro, institucional — estilo Cursor ou Anthropic
- **Sem detalhes sensíveis de segurança:** não expor IPs internos, credenciais, topologia de rede, ou incidentes em aberto
- **Commit obrigatório:** após publicar, commitar o MDX no git — S3 é o storage vivo, git é o backup

---

## Estrutura no bucket

```
s3://rbx-content/
  blog/
    posts/
      YYYY-MM-DD-slug.mdx     ← conteúdo do post
    covers/
      YYYY-MM-DD-slug.jpg     ← capa (1200×630 JPEG, mesmo slug)
```

---

## Frontmatter do post

```yaml
---
title: "Título do post"
date: "YYYY-MM-DD"
author: "RBX Systems"
authorRole: "Engineering Team"
tags: [tag1, tag2]
excerpt: "Uma frase que resume o post. Aparece na listagem e no topo da página."
cover: "https://eu2.contabostorage.com/rbx-content/blog/covers/YYYY-MM-DD-slug.jpg"
---
```

> **Importante:** só inclua `cover` depois de fazer o upload da imagem. Se a imagem não existir no S3, o campo deve ser omitido.

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

Crie `blog-posts/YYYY-MM-DD-slug.mdx` com o frontmatter acima e o corpo em Markdown.

### 2. Publique no S3

```bash
./scripts/blog-publish.sh blog-posts/YYYY-MM-DD-slug.mdx
```

### 3. Imagem de capa

Gere a imagem no Nano Banana com as especificações abaixo e faça upload:

```bash
./scripts/blog-cover-upload.sh /caminho/para/capa.jpg YYYY-MM-DD-slug
```

Adicione o campo `cover` no frontmatter do MDX e republique:

```bash
./scripts/blog-publish.sh blog-posts/YYYY-MM-DD-slug.mdx
```

### 4. Commit

```bash
git add blog-posts/YYYY-MM-DD-slug.mdx
git commit -m "blog: add post YYYY-MM-DD-slug"
git push
```

---

## Workflow agêntico (Claude / Codex)

Ao pedir a um agente para publicar um post, ele executará os seguintes passos em ordem:

1. Escreve o MDX em `blog-posts/` — sem `cover` ainda
2. Obtém as credenciais do secret `contabo-s3-credentials` via kubectl
3. Faz upload do MDX: `./scripts/blog-publish.sh`
4. Gera e exibe um **prompt para o Nano Banana** (ver especificações abaixo)
5. Aguarda o usuário fornecer o caminho do arquivo gerado (sugerido: `/tmp/cover-slug.jpg`)
6. Faz upload da capa: `./scripts/blog-cover-upload.sh`
7. Adiciona `cover:` no frontmatter e republica o MDX
8. Verifica os objetos no S3
9. Commita o MDX no git

> O fluxo detalhado para agentes está em `CLAUDE.md` na raiz do repositório.

---

## Especificações da imagem de capa

| Propriedade | Valor |
|-------------|-------|
| Dimensões | 1200 × 630 px |
| Formato | JPEG |
| Aspect ratio | 16:9 |
| Estilo | Fundo escuro, minimal, tech-abstract, sem texto |
| Chave S3 | `blog/covers/{slug}.jpg` |
| URL pública | `https://eu2.contabostorage.com/rbx-content/blog/covers/{slug}.jpg` |

**Prompt base para Nano Banana:**
```
Dark background, minimal, tech-abstract, cinematic lighting, no text,
16:9, 1200x630 — [descrição visual do tema do post]
```

---

## Scripts

| Script | Uso |
|--------|-----|
| `./scripts/blog-publish.sh <arquivo.mdx>` | Faz upload do post para o S3 |
| `./scripts/blog-cover-upload.sh <imagem.jpg> <slug>` | Faz upload da capa para o S3 |

---

## Referência rápida — aws CLI

```bash
# Listar posts
aws s3 ls s3://rbx-content/blog/posts/ --endpoint-url https://eu2.contabostorage.com

# Listar capas
aws s3 ls s3://rbx-content/blog/covers/ --endpoint-url https://eu2.contabostorage.com

# Remover post
aws s3 rm s3://rbx-content/blog/posts/YYYY-MM-DD-slug.mdx \
  --endpoint-url https://eu2.contabostorage.com
```

---

## Cache e ISR

As páginas do blog usam **ISR com revalidate=300** (5 minutos). Após qualquer publicação ou atualização no S3, o conteúdo atualizado estará visível no site em até 5 minutos sem necessidade de redeploy.
