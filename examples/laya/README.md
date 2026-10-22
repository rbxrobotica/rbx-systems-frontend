# Laya text-classification tutorial

The complete program used by the bilingual Journal post dated 2026-10-22.
It prints predictions for synthetic Portuguese messages and never sends messages
or performs an operational action.

Validated environment: Linux x86_64, Python 3.12.3, CPU-only PyTorch 2.14.1,
Laya 0.4.3, Transformers 5.19.0, NumPy 2.5.4. The model revision is explicit in
`triagem.py`. The large model files and virtual environment are not committed.

For an exact dependency installation on this platform, create an isolated venv
and run its Python with:

```bash
python -m pip install --only-binary=:all: --require-hashes --no-deps --no-index -r requirements-linux-x86_64-py312.lock
python -m pip check
python triagem.py
```

The lock uses public wheel URLs and SHA-256 hashes. It is specific to Linux
x86_64 and CPython 3.12. It is not a lock for Windows, macOS or CUDA.

The four authored examples are a demonstration, not an independent benchmark.
Do not tune a model or prompt on an evaluation set and then present the same
set's score as an estimate of unseen-data performance.
