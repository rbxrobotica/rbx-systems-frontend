---
title: 'Laya with PyTorch: classify text on a CPU'
slugAlias: '2026-10-22-text-classification-laya-pytorch'
date: '2026-10-22'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [ai, python, pytorch, machine-learning, evaluation]
excerpt: 'A Laya and PyTorch tutorial: install in an isolated environment, classify Portuguese messages, and inspect correct and incorrect predictions.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-22-laya-pytorch-classificacao-de-textos-v1.jpg'
---

A message reaches support: “Cobraram duas vezes a mensalidade. Quero estorno.” It says the customer was charged twice and wants a refund. The system needs to route it to billing, technical support, or sales. This is a small decision with known options that we can explore with a local model.

In this tutorial, we will install PyTorch and the Laya library, load a multilingual model, and classify four messages in Portuguese. Then we will check the results against expected labels and compare them with simple rules. Everything runs on a CPU. You do not need a graphics card, an API key, or model training.

The example uses invented texts. It helps explain how the tool works and reveal its errors, without sending real messages or triggering another system.

## What PyTorch, Laya, and the model do

The experiment has three parts:

| Part | Role in this tutorial |
| --- | --- |
| PyTorch | Run the model's calculations on the CPU. |
| The `laya` library | Load the model and provide the interface for questions and structured answers. |
| `convaiinnovations/laya-multilingual` | Provide the pretrained weights that calculate the answers. |

You provide a text, a question, and the options. The model returns an option and probabilities. The Laya family also supports other question types, but here we will use only `choice`, a selection between categories.

The multilingual checkpoint has approximately 322 million parameters. It does not compose a long answer like a chatbot: it produces a structured answer to the configured question. This makes integration easier, but does not eliminate classification errors. The [model page](https://huggingface.co/convaiinnovations/laya-multilingual) describes its architecture and limitations; the [library source code](https://github.com/NandhaKishorM/laya/tree/c4a805b5160621bbfc53417126990a67d3163bc5) belongs to a project outside RBX.

## 1. Prepare Python and a separate environment

The commands below were validated on Linux x86_64 with Python 3.12.3. Windows and macOS use different environment commands and PyTorch options; this walkthrough covers Linux with a CPU.

Allow a few gigabytes of free disk space for dependencies and cache. In RBX's earlier trial with the same checkpoint, the five model files totaled about 678 MB, and the complete process reached approximately 2.28 GiB of RAM. These are reference measurements from that trial, not guaranteed maximum requirements.

Open a terminal and create a folder:

```bash
mkdir teste-laya
cd teste-laya
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip --version
```

Check that the first version command reports Python 3.12. The `.venv` environment keeps the dependencies for this test separate from other projects. Activate it again whenever you open another terminal in this folder.

If Debian, Ubuntu, or Mint reports that `ensurepip` is unavailable, install the virtual environment package and repeat the environment creation:

```bash
sudo apt install python3-venv
python3 -m venv .venv
source .venv/bin/activate
```

Consult the [Python virtual environment documentation](https://docs.python.org/3/library/venv.html) if your distribution uses a different package or executable.

## 2. Install the versions used in the example

First install the CPU distribution of PyTorch. Then install Laya and the two main dependencies with pinned versions:

```bash
python -m pip install "torch==2.14.1" --index-url https://download.pytorch.org/whl/cpu
python -m pip install "laya==0.4.3" "transformers==5.19.0" "numpy==2.5.4"
python -m pip check
python -c "import torch, laya; print('torch:', torch.__version__); print('laya:', laya.__version__); print('cuda:', torch.version.cuda)"
```

We deliberately use Laya 0.4.3 to retain the version of the experiment described here. It is not necessarily the latest release. The [PyPI package](https://pypi.org/project/laya/0.4.3/) and the [PyTorch installation guide](https://pytorch.org/get-started/locally/) are the references for other environments.

In the validated installation, PyTorch reports `2.14.1+cpu`, Laya reports `0.4.3`, and `cuda` appears as `None`. This is expected: we chose to run on a CPU. The `pip check` command should report that there are no incompatible dependencies. We have not loaded the model yet.

Transitive dependencies can change between installations. To reproduce our complete combination on Linux x86_64/Python 3.12, the [source code for this article](https://github.com/rbxrobotica/rbx-systems-frontend/tree/637f19904daa25ae90f4207377dd8d4a868c8c0f/examples/laya) includes the program, recorded results, and a dependency file with versions, URLs, and hashes. The directory's `README.md` shows how to install the complete combination with `--require-hashes`. To explore the API, the commands above are the shortest route; record your environment with `python -m pip freeze > ambiente.txt`.

## 3. Create the classification program

Save the code below in a file named `triagem.py`, inside the `teste-laya` folder. This is the complete program. The code, messages, category names, and output strings remain in Portuguese because this example classifies Portuguese messages.

```python
"""Small Portuguese text-classification demonstration, not a production benchmark."""

import json
from time import perf_counter

import laya
import torch


MODEL_ID = "convaiinnovations/laya-multilingual"
MODEL_REVISION = "e4e9ddf21a7b1903b7acffd8814ad4307bf63a67"

QUESTIONS = {
    "equipe": {
        "type": "choice",
        "instructions": "Qual equipe deve atender esta mensagem?",
        "criteria": {
            "financeiro": "Cobranças, pagamentos, faturas e reembolsos.",
            "tecnico": "Erros, telas que fecham e falhas do aplicativo.",
            "comercial": "Preços, planos e contratação do serviço.",
            "outro": "Agradecimentos e assuntos que não pertencem às equipes anteriores.",
        },
    }
}

CASES = [
    ("Cobraram duas vezes a mensalidade. Quero estorno.", "financeiro"),
    ("A tela fecha quando tento salvar um cadastro.", "tecnico"),
    ("Quero conhecer os planos e contratar para a equipe.", "comercial"),
    ("Obrigado pelo atendimento.", "outro"),
]


def baseline(text):
    text = text.lower()
    if any(word in text for word in ("cobr", "fatura", "estorno")):
        return "financeiro"
    if any(word in text for word in ("erro", "tela", "falha")):
        return "tecnico"
    if any(word in text for word in ("plano", "contratar", "preço")):
        return "comercial"
    return "outro"


def main():
    torch.set_num_threads(2)
    started = perf_counter()
    agent = laya.load(
        MODEL_ID,
        revision=MODEL_REVISION,
        device="cpu",
        backend="eager",
        fast=False,
        compile=False,
    )
    print(f"Carga do modelo: {perf_counter() - started:.2f} s")
    model_hits = rule_hits = 0

    for text, expected in CASES:
        started = perf_counter()
        result = agent.predict(text, QUESTIONS, max_len=1024, head_max_len=256)
        elapsed_ms = (perf_counter() - started) * 1000
        answer = result["answers"]["equipe"]
        predicted = answer["choice"]
        by_rule = baseline(text)
        model_hits += predicted == expected
        rule_hits += by_rule == expected
        print(json.dumps({
            "mensagem": text,
            "esperado": expected,
            "modelo": predicted,
            "regras": by_rule,
            "probabilidades": answer["probabilities"],
            "tempo_ms": round(elapsed_ms, 1),
        }, ensure_ascii=False))

    print(f"Acertos do modelo: {model_hits}/{len(CASES)}")
    print(f"Acertos das regras: {rule_hits}/{len(CASES)}")


if __name__ == "__main__":
    main()
```

`QUESTIONS` defines the question and the meaning of the four options. The identifiers `financeiro`, `tecnico`, `comercial`, and `outro` represent billing, technical support, sales, and other. These categories will appear in the output. The unaccented spelling of `tecnico` is just a code identifier.

`CASES` pairs each message with the category a person expects. The model receives only the message and the definitions in `QUESTIONS`; the expected label stays in the program to check the prediction afterward.

`baseline` implements a keyword comparison. `laya.load` loads the pretrained model. The `revision` field pins the weights version on Hugging Face; without this field, a repository update could change the downloaded checkpoint. `device="cpu"` selects the hardware, and `torch.set_num_threads(2)` limits PyTorch's computation threads.

The loop runs inference for each message and displays the predicted category, probabilities, and elapsed time. The `max_len` and `head_max_len` budgets must fit the text, question, and options. When testing long texts, check `result["usage"]["truncated"]`: `True` means part of the input was cut off. This program does no training. Its output does not route tickets either: it only prints results in the terminal.

## 4. Run the program and read the response

With the environment still active, run:

```bash
python triagem.py
```

The first load needs internet access to download the checkpoint's public files. Later loads can reuse the Hugging Face cache. After the download, the model's calculations run locally; this program does not call a classification API.

In our run on October 22, 2026, the first message produced:

```json
{
  "mensagem": "Cobraram duas vezes a mensalidade. Quero estorno.",
  "esperado": "financeiro",
  "modelo": "financeiro",
  "regras": "financeiro",
  "probabilidades": {
    "financeiro": 0.801,
    "tecnico": 0.1767,
    "comercial": 0.0056,
    "outro": 0.0166
  }
}
```

The category with the highest probability was `financeiro`, matching the expected label. The `tempo_ms` field, omitted from this excerpt, measures the prediction call for each message. It does not include installation or model loading.

But the example also found errors:

| Message | Expected label | Model prediction |
| --- | --- | --- |
| Cobraram duas vezes a mensalidade. Quero estorno. | financeiro | financeiro |
| A tela fecha quando tento salvar um cadastro. | tecnico | tecnico |
| Quero conhecer os planos e contratar para a equipe. | comercial | tecnico |
| Obrigado pelo atendimento. | outro | tecnico |

The program ended with `Acertos do modelo: 2/4` and `Acertos das regras: 4/4`, meaning two correct predictions for the model and four for the rules. We kept the messages, prompt, and results without adjusting the example to hide the errors. Installation worked; classification did not get every case right.

The four sentences are teaching examples written by the author, and the rules find obvious clues in them. This favors the keyword comparison. Four cases do not estimate production performance or establish that rules always outperform Laya.

## 5. A high probability can accompany an error

For “Obrigado pelo atendimento.”, a message thanking support, the model assigned `0.8821` to `tecnico`, despite our expected label of `outro`. A high probability emitted by the model does not prove that its decision is correct.

Likewise, `0.80` does not guarantee 80% accuracy on your product's texts. To interpret probabilities as frequencies of correct predictions, you need to evaluate and, when necessary, calibrate the model with suitable data. A threshold such as `0.80` can send cases for review, but it needs to be selected and validated on a separate dataset. The [documentation on separating training and test data](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) explains why using the test set to choose adjustments produces optimistic estimates.

Running on a GPU can reduce elapsed time in some configurations. This CPU trial does not demonstrate that changing the hardware would correct the category errors.

## 6. Replace the examples and evaluate your task

After running the program, change `QUESTIONS` to a decision in your domain and prepare messages with human-assigned expected answers. Include messages that are short, ambiguous, outside the categories, or about more than one subject.

Use some examples to develop the instructions. Reserve others, which you do not use to choose the prompt or threshold, for the final evaluation. Record the library version, weights revision, question, and predictions for each case.

Compare against a simple solution. Check which categories produce errors, which errors have greater consequences, and how many cases need human review. The decision to adopt a model also depends on latency, memory, and maintenance, not just an overall accuracy percentage.

When a failure could cause harm, keep human intervention or an explicit rule appropriate to the workflow. A text classification should not, on its own, authorize a payment, remove content, or execute an operation.

## If something goes wrong

| Symptom | First step |
| --- | --- |
| `No module named laya` | Activate `.venv` and use `python -m pip` with the same Python that runs the file. |
| Download failure | Check access to Hugging Face and try loading again. Do not invent missing configuration files. |
| Incorrectly classified message | Check the categories, text, and prediction. Running without a software error does not guarantee a correct classification. |
| High memory usage | Close other processes and test one program at a time. Downloaded file sizes do not represent all the memory used by the process. |

To deactivate the environment in the terminal, run `deactivate`. The project files and model cache remain on disk.

This test is a starting point for discussing [AI evaluation and product engineering](/solutions). In the [RBX Journal](/journal), [The model is not the system](/blog/2026-04-01-the-model-is-not-the-system) explores the relationship between models and controls. If you have a product in operation and need to define how to evaluate and integrate AI, [learn about the RBX Engineering Partnership](/partnership).
