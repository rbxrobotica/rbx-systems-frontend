# Pod cache rescue, 2026-11-07

Contabo Object Storage (bucket `rbx-content`) has been unavailable since 2026-10-25, and every S3
call from the site fails. rbx.ia.br and rbxsystems.ch keep serving CMS pages only from each pod's
in-memory Content Gateway cache. A stale entry stays in memory when revalidation fails, but a pod
restart drops it for good. This directory holds everything that was still readable from those
caches on 2026-11-07.

Capture method: public GETs only, no cluster or S3 access. Each route's SvelteKit `__data.json`
was requested repeatedly so that both replicas behind the load balancer answered. The devalue
payload was decoded, and every distinct successful answer was kept. No key had two different
cached versions.

## Contents

The layout mirrors the bucket keys.

| Path | Count | Fidelity |
| ---- | ----- | -------- |
| `site/<locale>/<key>/index.md` | 54 | Frontmatter is exact (from `page.meta`). The body is the rendered HTML, because the cache does not hold the source Markdown. `marked` passes block HTML through, so a re-upload renders the same page. |
| `blog/posts/<slug>.<locale>.md` | 75 | The body is the exact source Markdown. Frontmatter is rebuilt from the post fields: `title`, `date`, `author`, `authorRole`, `tags`, `excerpt`, `slugAlias` and `cover`. |
| `blog/covers/*` | 9 of 73 | Original bytes. The other covers were already evicted, because the gateway caches asset fetch failures as null. They can be regenerated from `blog-covers-src/`. |
| `assets/ui/bitmap.svg` | 1 | Original bytes. The other UI, team and about assets were evicted. |
| `journal/<locale>-posts.json`, `journal/<locale>-rss.xml` | | The Journal index as served. |
| `manifest.json` | | Each object with its source URL and the sha256 of the source answer and of the file. Also every URL tried, with its status codes. |

All 129 Markdown files were round-trip checked. Each one parses with the gateway's frontmatter
pattern and YAML, and each page's meta and HTML equal the decoded source. The undecoded answers
and HTML snapshots stay outside Git (see `raw_evidence` in the manifest).

## Compared with Git at 6407ba9

- 48 of the 54 pages exist nowhere else. Home, solutions and about match the copies already in
  `site-content/` and in the 2026-10-07 snapshots.
- 64 posts are identical to `blog-posts/`, and 4 differ only in Prettier formatting.
- Four English posts carry a `slugAlias` that `blog-posts/` lacks: 2026-07-13, 2026-07-23,
  2026-08-01 (auditoria) and 2026-08-02 (painel). Re-publishing those posts from `blog-posts/`
  would break their localized URLs.
- The 2026-10-22 Laya PyTorch posts (pt-BR and en) are live but are not on `main`. They exist only
  on branch `codex/journal-laya-20261022`.
- No pod had these cached, so they are not here: `diagnostic` (both locales), `robson` (it probably
  never existed in the CMS), 14 pt-BR service pages, every `products/*` slug except `maestro`, and
  the pt-BR `2026-03-29-infrastructure-update` post, which is in `blog-posts/`.

## Use

This copy is a last resort. It is not consumable by `scripts/site-content-recovery.mjs`, which
handles byte-exact snapshots of four reviewed objects. If the bucket comes back intact, the bucket
remains the source of truth and nothing here needs to be uploaded. If objects are lost, compare
each key with this directory and upload deliberately, one reviewed batch at a time. A page
restored from here replaces its Markdown source with HTML.
