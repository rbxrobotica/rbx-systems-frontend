# Como publicar no Blog da RBX

O blog vive em **rbx.ia.br/blog**. Posts são arquivos MDX armazenados no Contabo Object Storage.
Publicar um post **não requer deploy** — o site busca o conteúdo do S3 a cada request.

---

## 1. Escreva o post

Crie um arquivo `.mdx` na pasta `blog-posts/` com o nome no formato `YYYY-MM-DD-slug-do-post.mdx`:

```
blog-posts/2026-04-01-lancamento-strategos.mdx
```

### Frontmatter obrigatório

```yaml
---
title: "Título do post"
date: "2026-04-01"
author: "Seu Nome"
authorRole: "Cargo, RBX Systems"
tags: [produto, engenharia]
excerpt: "Uma frase que resume o post. Aparece na listagem e no topo do post."
---
```

### Corpo do post

Escreva em Markdown padrão após o frontmatter. Suporta:

- Títulos (`##`, `###`)
- Código com syntax highlight (` ```go `, ` ```typescript `, etc.)
- Links, imagens, listas, blockquotes
- Componentes React (MDX) — use com moderação

---

## 2. Publique no bucket

Você precisa das credenciais do Contabo S3. Configure uma vez:

```bash
export AWS_ACCESS_KEY_ID=<sua_access_key>
export AWS_SECRET_ACCESS_KEY=<sua_secret_key>
```

Depois publique:

```bash
./scripts/blog-publish.sh blog-posts/2026-04-01-lancamento-strategos.mdx
```

Ou manualmente com aws CLI:

```bash
aws s3 cp blog-posts/2026-04-01-lancamento-strategos.mdx \
  s3://rbx-content/blog/posts/2026-04-01-lancamento-strategos.mdx \
  --endpoint-url https://eu2.contabostorage.com \
  --content-type "text/plain; charset=utf-8"
```

O post aparece em **rbx.ia.br/blog** imediatamente (o servidor busca do S3 a cada request).

---

## 3. Imagem de capa (opcional)

Faça upload de uma imagem `.jpg` com o mesmo slug do post:

```bash
aws s3 cp minha-imagem.jpg \
  s3://rbx-content/blog/covers/2026-04-01-lancamento-strategos.jpg \
  --endpoint-url https://eu2.contabostorage.com
```

Dimensões recomendadas: **1200 × 630px** (proporção 16:9 funciona bem).

---

## 4. Editar ou remover um post

**Editar:** faça upload do arquivo `.mdx` atualizado com o mesmo nome — sobrescreve o anterior.

**Remover:**
```bash
aws s3 rm s3://rbx-content/blog/posts/2026-04-01-lancamento-strategos.mdx \
  --endpoint-url https://eu2.contabostorage.com
```

---

## Estrutura no bucket

```
s3://rbx-content/
  blog/
    posts/
      YYYY-MM-DD-slug.mdx     ← arquivo do post
    covers/
      YYYY-MM-DD-slug.jpg     ← capa (opcional, mesmo slug)
```

---

## Referência rápida

| Ação | Comando |
|------|---------|
| Publicar post | `./scripts/blog-publish.sh blog-posts/<arquivo>.mdx` |
| Listar posts no bucket | `aws s3 ls s3://rbx-content/blog/posts/ --endpoint-url https://eu2.contabostorage.com` |
| Remover post | `aws s3 rm s3://rbx-content/blog/posts/<arquivo>.mdx --endpoint-url https://eu2.contabostorage.com` |
| Upload de capa | `aws s3 cp capa.jpg s3://rbx-content/blog/covers/<slug>.jpg --endpoint-url https://eu2.contabostorage.com` |
