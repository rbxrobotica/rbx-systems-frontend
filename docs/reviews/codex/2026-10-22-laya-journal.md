# Laya Journal tutorial: validation and publication checkpoint

Date: 2026-10-22. Scope: one new bilingual tutorial, its deterministic cover,
an executable example, a platform-specific dependency lock and observed results.
Publication is authorized by the operator's request to post this tutorial.

## Technical evidence

- Executed `examples/laya/triagem.py` with real model weights on CPU using
  Python 3.12.3, PyTorch 2.14.1+cpu, Laya 0.4.3, Transformers 5.19.0 and
  NumPy 2.5.4. Model revision is explicit and unchanged from the earlier pilot.
- Dependency installation used the historical lock's 35 wheels and SHA-256
  hashes. The article's top-level installation commands were also executed in
  that venv; `pip check` passed.
- Four synthetic, author-written messages: model 2/4; lexical rules 4/4.
  The article preserves the errors, including 0.8821 for the wrong category.
  These cases are not an independent benchmark or a production estimate.
- Both embedded Python blocks equal the executed source. Syntax, metadata,
  UTF-8, short title/excerpt, internal links and fixed public source link checked.
- Independent technical review found no blockers in PT-BR or EN. Its source-link
  suggestion was incorporated. A verified truncation warning was added to both.
- Cover inspected visually: text-free abstract vector, rasterized to 1200x630.
- Four cover-contract checks and static SEO checks passed. Full existing suite:
  102 tests passed. The underlying Node commands were used because pnpm's
  dependency-status check refuses the shared node_modules symlink in a worktree.
- New authored files passed a scoped secret-pattern scan and manual review.
- Editorial register: technical documentation with an institutional CTA.
  LinkedIn copy is a draft only; publication here does not send social messages.

## Scoped recovery preflight

Affected state is exactly three previously absent object keys: the new cover
and the two locale Markdown variants. Read-only HEAD checks confirmed all three
were absent before writing. No existing object, infrastructure, DNS, credential,
database or deployment is changed.

Canonical sources are the feature branch in rbxrobotica/rbx-systems-frontend.
Source checkpoint `637f19904daa25ae90f4207377dd8d4a868c8c0f` was pushed and six
files were downloaded independently from GitHub and compared byte for byte.
That restore took 1.486 seconds. It verifies recovery of these public source
files, not restoration of the application, bucket or production platform.

The new raster is reproducible from the committed catalog/SVG and shared
renderer; the public article text is stored in Git before its S3 publication.
GitHub is separate from the serving object-store provider. Transport is HTTPS;
these are intentionally public, non-sensitive artifacts. Source retention follows
Git history; no existing object version or backup retention policy is changed.

RPO for committed source: zero committed changes. Source-download recovery time
observed above; full publication recovery RTO has not been measured. Owner:
RBX operator. Recovery procedure: retrieve the recorded source commit, regenerate
the catalogued raster, compare hashes, then use the repository's Journal publish
scripts for an explicitly authorized recovery operation. This scoped additive
publication makes no claim about general bucket or platform disaster recovery.

Publication completed. Both Markdown objects and the cover were downloaded
from the serving store and matched their local bytes and SHA-256 values. Both
public article URLs returned HTTP 200 with the intended locale, one rendered
H1, the correct canonical URL, the runnable code and the observed results. The
public cover returned HTTP 200, matched its source hash and measured 1200x630.
The article is listed in the Journal. Desktop rendering was inspected visually.
Machine-readable evidence is in `2026-10-22-laya-publication.json`.

The source remains on feature branch `codex/journal-laya-20261022`, with draft
PR #117 for repository integration. Publication uses the content gateway and
does not require merging a frontend release or redeploying the application.

```text
State alterado: dois artigos e uma capa novos; fonte e evidência na feature branch.
Fonte de verdade: fontes Git registradas e objetos servidos, com hashes iguais.
Backend remoto: GitHub para fonte; armazenamento do Journal para publicação.
Backup e última execução: fonte remota conferida em 2026-10-22; seis arquivos recuperados.
Último restore testado: recuperação byte a byte da fonte em 2026-10-22, 1,486 s.
RPO/RTO: zero alterações de fonte commitadas perdidas; RTO completo não medido.
IaC/commit: conteúdo em 0eb2ca8; nenhuma infraestrutura alterada.
Drift encontrado: nenhum nos três objetos novos verificados.
Estado local residual: worktree de fonte, ambientes e caches reproduzíveis.
Riscos ou bloqueios: integração do PR pendente; não é requisito para o artigo já servido.
```

## Intended public URLs

- PT-BR: https://rbx.ia.br/blog/2026-10-22-laya-pytorch-classificacao-de-textos
- EN: https://rbxsystems.ch/blog/2026-10-22-text-classification-laya-pytorch
