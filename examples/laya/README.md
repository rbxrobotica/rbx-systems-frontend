# Laya text-classification tutorial

The complete program used by the bilingual Journal post dated 2026-10-22.
It prints predictions for synthetic Portuguese messages and never sends messages
or performs an operational action.

Validated environment: Linux x86_64, uv 0.13.5, Python 3.12.3, CPU-only PyTorch
2.14.1, Laya 0.4.3, Transformers 5.19.0, NumPy 2.5.4. The model revision is
explicit in `triagem.py`. The large model files and virtual environment are not
committed.

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) first. From
this directory, restore the committed dependency graph and run the example:

```bash
uv sync --locked
uv run --locked python -c "import torch, laya; print('torch:', torch.__version__); print('laya:', laya.__version__); print('cuda:', torch.version.cuda)"
uv run --locked triagem.py
```

`uv sync` creates `.venv`; no manual activation is required. `.python-version`
selects Python 3.12.3, which uv can download if it is unavailable locally.
`pyproject.toml` pins the four direct dependencies and restricts this example to
Linux x86_64/Python 3.12. The explicit `pytorch-cpu` index applies only to PyTorch;
other packages come from PyPI. `uv.lock` records the resolved dependencies,
artifact URLs and hashes. `--locked` rejects a stale lock rather than rewriting
it during installation or execution. This example does not cover Windows,
macOS or CUDA.

To check that the dependency declarations and lock agree:

```bash
uv lock --check
```

Install and run the project through `uv sync` and `uv run`.
The original execution remains recorded in `validation-2026-10-22.json`;
the clean uv project rerun is recorded in `validation-uv-2026-10-22.json`.

The four authored examples are a demonstration, not an independent benchmark.
Do not tune a model or prompt on an evaluation set and then present the same
set's score as an estimate of unseen-data performance.
