# CLAUDE.md — RBX Robotica Frontend

## Repository Purpose

This is the public-facing website for RBX Systems (`rbx.ia.br`). It is a Next.js 14 App Router application with an MDX blog where posts and cover images are stored in Contabo Object Storage (S3-compatible).

---

## Publishing a Blog Post (Agentic Workflow)

This is the canonical workflow for an AI agent to publish a new blog post end-to-end. Follow all steps in order.

### Step 1 — Write the MDX file

Create the post in `blog-posts/` with filename `YYYY-MM-DD-slug.mdx`. Use this frontmatter:

```yaml
---
title: "Post title"
date: "YYYY-MM-DD"
author: "RBX Systems"
authorRole: "Engineering Team"
tags: [tag1, tag2]
excerpt: "One sentence describing the post. Shown in listing and at the top of the page."
---
```

**Do NOT include a `cover` field yet** — it will be added in Step 5 after the image is uploaded.

**Tone:** institutional, clear, and direct — similar to Cursor or Anthropic blog posts. English only. See `docs/WRITING-STYLE.md` for editorial guidelines (no em-dashes, no arrows, natural prose).

**Do NOT include sensitive infrastructure details** (IPs, credentials, internal hostnames, security incidents).

**Markdown Features**: The blog supports **GitHub Flavored Markdown (GFM)** via `remark-gfm`:
- ✅ Tables (use standard Markdown table syntax)
- ✅ Strikethrough (~~text~~)
- ✅ Task lists
- ✅ Autolinks
- ✅ Code blocks with syntax highlighting

### Step 2 — Upload the MDX to S3

```bash
./scripts/blog-publish.sh blog-posts/YYYY-MM-DD-slug.mdx
```

Requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables set.

The post is now live at `rbx.ia.br/blog/YYYY-MM-DD-slug` (no cover image yet).

### Step 3 — Output the Nano Banana cover image prompt

After uploading the MDX, output the following block verbatim for the user to copy into Nano Banana:

```
--- COVER IMAGE PROMPT ---
Dimensions: 1200 × 630 px
Format: JPEG
Style: dark background, minimal, tech-abstract, cinematic lighting, no text
Prompt: [generate a Nano Banana prompt that visually represents the post topic — keep it abstract and brand-consistent with RBX Systems: dark, precise, mechanical, digital]
--- END ---
```

Then tell the user: "Generate the image in Nano Banana and provide the file path. I will upload it to S3 and add it to the post."

### Step 4 — User provides the image file

Wait for the user to provide the local file path of the generated cover image.

### Step 5 — Upload the cover image to S3

```bash
./scripts/blog-cover-upload.sh /path/to/user/image.jpg YYYY-MM-DD-slug
```

### Step 6 — Add the cover field to the MDX and re-upload

Edit the MDX file to add the `cover` field to frontmatter:

```yaml
cover: "https://eu2.contabostorage.com/rbx-content/blog/covers/YYYY-MM-DD-slug.jpg"
```

Then re-upload:

```bash
./scripts/blog-publish.sh blog-posts/YYYY-MM-DD-slug.mdx
```

### Step 7 — Verify

```bash
aws s3 ls s3://rbx-content/blog/posts/ --endpoint-url https://eu2.contabostorage.com
aws s3 ls s3://rbx-content/blog/covers/ --endpoint-url https://eu2.contabostorage.com
```

Confirm both objects exist. The post with cover will be live within 5 minutes (ISR revalidate=300).

### Step 8 — Commit the MDX to git

```bash
git add blog-posts/YYYY-MM-DD-slug.mdx
git commit -m "blog: add post YYYY-MM-DD-slug"
git push
```

The git repo serves as the source of truth and backup for all blog content.

---

## S3 Bucket Structure

```
s3://rbx-content/
  blog/
    posts/
      YYYY-MM-DD-slug.mdx     ← post content
    covers/
      YYYY-MM-DD-slug.jpg     ← cover image (1200×630 JPEG)
```

---

## Cover Image Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1200 × 630 px |
| Format | JPEG |
| Aspect ratio | 16:9 |
| S3 key | `blog/covers/{slug}.jpg` |
| Public URL | `https://eu2.contabostorage.com/rbx-content/blog/covers/{slug}.jpg` |

---

## Important Rules

- **English only** for all blog content
- **No sensitive security details** (IPs, credentials, internal topology)
- **No cover field without an uploaded image** — omit it if the image isn't uploaded yet
- **Commit MDX files to git** after publishing — S3 is live storage, git is the backup
