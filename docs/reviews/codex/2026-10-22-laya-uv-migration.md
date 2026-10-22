# Laya tutorial: uv migration and publication checkpoint

Date: 2026-10-22. The operator requested the correction and a complete uv rerun
before the LinkedIn post, and adopted uv as RBX's company-wide Python standard.

## Validated scope

The PT-BR and EN articles now use the same native uv workflow: official pinned
uv installer, immutable public configuration downloads, `uv sync --locked`, and
`uv run --locked`. Manual virtual-environment activation, standalone pip
commands and their troubleshooting instructions were removed. The example now
versions `pyproject.toml`, `.python-version` and `uv.lock`; the previous
requirements snapshot remains recoverable in Git history.

Source example: `b7f1815a5baf6529820a4adb6c9762163b8d0f94`.
The CPU-only torch source is explicit and applies only to torch. Model revision,
program, examples and evaluation caveats are unchanged. The newly resolved
transitive dependencies are recorded in uv.lock; this is not represented as the
original dependency graph.

Two new uv-managed environments executed the real program. A separate reader
directory downloaded the three configuration files from that immutable public
commit and ran the article's literal commands. Both locale code blocks match
the executed source. Lock consistency, Python syntax, CPU-only torch and Laya
versions passed. A disposable changed dependency caused `uv sync --locked` to
reject the stale lock as expected. All four predictions and probabilities
matched the original execution: model 2/4, rules 4/4. No production benchmark is
claimed. Evidence: `2026-10-22-laya-uv-validation.json` and
`examples/laya/validation-uv-2026-10-22.json`.

Frontend validation repeated: 102 existing tests passed, four cover tests passed,
and SEO checks passed. The public cover is unchanged. Metadata, locale parity,
Python code equality and absence of old installer commands were checked.

## Recovery and institutional record

Before overwriting either public Markdown object, both serving bytes were
downloaded and compared with the existing local source and an independent
GitHub recovery of commit `816518b84aca267da5e7a83f7fdf77bc782c609b`.
Both matched. Prior versions remain in remote Git history. The corrected source
is committed and pushed before publication. Recovery consists of retrieving the
chosen immutable source and using the Journal publishing script for both locales.
This verifies recovery of public source content, not the whole storage service.

The company decision is recorded in
[Governance PR #97](https://github.com/rbxrobotica/rbx-governance/pull/97),
standard `mem-2026-00170`. The agent-layer guardrail and frontend AGENTS reference
it. Repository integration and runtime propagation remain separate; no global
rollout or migration of unrelated repositories is claimed.

Publication status: both corrected locale objects were published, downloaded
again and matched their local bytes. Both public URLs returned HTTP 200 and
showed uv commands, the immutable source commit, no old installer commands and
one H1. The campaign query survived the public response and canonical URLs
remained clean. The initial public read served the prior SWR cache; later reads
confirmed the corrected version in both locales.

The official RBX Systems LinkedIn post was then published and verified in the UI.
Its short link resolves to the full submitted campaign URL with all four UTMs.
Receipt: `2026-10-22-laya-linkedin-publication.json`. The post is text only because
the automatic preview dropped UTMs and the extension blocked local image upload.
No extension permissions were changed and no personal-profile repost was made.
Plausible compatibility was checked against its official UTM documentation;
dashboard attribution was not inspected.

Institutional integration PRs: Governance #97 and agent-layer #58. Runtime
activation and bulk migration of existing projects remain outside this task.

```text
State alterado: fonte bilíngue, exemplo uv e instrução editorial.
Fonte de verdade: feature branch e fontes imutáveis de rbx-systems-frontend.
Backend remoto: GitHub; dois objetos Markdown do Journal após publicação.
Backup e última execução: versões anteriores recuperadas de GitHub em 2026-10-22.
Último restore testado: fonte antiga idêntica ao conteúdo servido; nova configuração executada.
RPO/RTO: zero mudanças commitadas perdidas; RTO do serviço não medido.
IaC/commit: feature branch codex/journal-laya-20261022; nenhuma infraestrutura alterada.
Drift encontrado: nenhum nos dois objetos antes da atualização.
Estado local residual: worktrees, ambientes uv e caches reproduzíveis.
Riscos ou bloqueios: PR de integração pendente; só Linux x86_64/Python 3.12 foi validado.
```
