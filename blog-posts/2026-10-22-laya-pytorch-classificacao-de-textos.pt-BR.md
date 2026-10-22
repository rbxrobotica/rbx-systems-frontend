---
title: 'Laya com PyTorch: classifique textos na CPU'
date: '2026-10-22'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [ai, python, pytorch, machine-learning, evaluation]
excerpt: 'Um tutorial de Laya e PyTorch: instale em ambiente isolado, classifique mensagens em português e confira os acertos e os erros.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-22-laya-pytorch-classificacao-de-textos-v1.jpg'
---

Uma mensagem chega ao suporte: “Cobraram duas vezes a mensalidade. Quero estorno.” O sistema precisa encaminhá-la ao financeiro, ao suporte técnico ou ao comercial. É uma decisão pequena, com opções conhecidas, que podemos experimentar com um modelo local.

Neste tutorial, vamos instalar o PyTorch e a biblioteca Laya, carregar um modelo multilíngue e classificar quatro mensagens em português. Depois vamos conferir os resultados com um gabarito e comparar com regras simples. Tudo roda em CPU. Você não precisa de uma placa de vídeo, de uma chave de API ou de treinar um modelo.

O exemplo usa textos inventados. Ele serve para entender o funcionamento da ferramenta e observar seus erros, sem enviar mensagens reais ou acionar outro sistema.

## O que são PyTorch, Laya e o modelo

Há três peças no experimento:

| Peça | Função neste tutorial |
| --- | --- |
| PyTorch | Executar os cálculos do modelo na CPU. |
| Biblioteca `laya` | Carregar o modelo e oferecer a interface de perguntas e respostas estruturadas. |
| `convaiinnovations/laya-multilingual` | Fornecer os pesos já treinados que calculam as respostas. |

Você apresenta um texto, uma pergunta e as opções. O modelo devolve uma opção e probabilidades. A família Laya também oferece outros tipos de pergunta, mas aqui usaremos somente `choice`, a escolha entre categorias.

O checkpoint multilíngue tem aproximadamente 322 milhões de parâmetros. Ele não redige uma resposta longa como um chatbot: produz uma resposta estruturada para a pergunta configurada. Isso facilita a integração, mas não elimina erros de classificação. A [página do modelo](https://huggingface.co/convaiinnovations/laya-multilingual) descreve a arquitetura e seus limites; o [código da biblioteca](https://github.com/NandhaKishorM/laya/tree/c4a805b5160621bbfc53417126990a67d3163bc5) é um projeto externo à RBX.

## 1. Instale o uv

Os comandos abaixo foram validados em Linux x86_64 com uv 0.13.5 e Python 3.12.3. Este passo a passo cobre Linux com CPU; o projeto não está configurado para Windows, macOS ou CUDA.

O `uv` gerencia o Python, o ambiente isolado e as dependências. Se você ainda não o tem, use o instalador oficial para a versão deste ensaio:

```bash
curl -LsSf https://astral.sh/uv/0.13.5/install.sh | sh
source "$HOME/.local/bin/env"
uv --version
```

O instalador coloca o executável na pasta do usuário. O comando `source` disponibiliza essa pasta no terminal atual. Se você já usa uv 0.13.5 ou mais recente, confira `uv --version` e siga para o próximo passo. A [documentação de instalação do uv](https://docs.astral.sh/uv/getting-started/installation/) apresenta outros métodos.

Reserve alguns gigabytes livres para dependências e cache. No ensaio anterior da RBX com o mesmo checkpoint, os cinco arquivos do modelo somavam cerca de 678 MB e o processo completo chegou a aproximadamente 2,28 GiB de RAM. São referências daquele ensaio, não requisitos máximos garantidos.

## 2. Reproduza o ambiente com uv.lock

Crie uma pasta e baixe os três arquivos de configuração da versão fixa do [exemplo completo](https://github.com/rbxrobotica/rbx-systems-frontend/tree/b7f1815a5baf6529820a4adb6c9762163b8d0f94/examples/laya). Depois restaure o ambiente:

```bash
mkdir teste-laya
cd teste-laya
LAYA_SOURCE_URL="https://raw.githubusercontent.com/rbxrobotica/rbx-systems-frontend/b7f1815a5baf6529820a4adb6c9762163b8d0f94/examples/laya"
curl -fsSLo pyproject.toml "$LAYA_SOURCE_URL/pyproject.toml"
curl -fsSLo uv.lock "$LAYA_SOURCE_URL/uv.lock"
curl -fsSLo .python-version "$LAYA_SOURCE_URL/.python-version"
uv sync --locked
uv run --locked python --version
uv run --locked python -c "import torch, laya; print('torch:', torch.__version__); print('laya:', laya.__version__); print('cuda:', torch.version.cuda)"
```

`pyproject.toml` declara Laya 0.4.3, PyTorch 2.14.1 para CPU, Transformers 5.19.0 e NumPy 2.5.4. O índice específico de CPU se aplica somente ao PyTorch; as demais bibliotecas vêm do PyPI. Usamos deliberadamente essas versões para manter o experimento descrito, sem afirmar que são as mais recentes.

`.python-version` seleciona Python 3.12.3. Se ele não estiver disponível localmente, o uv poderá baixá-lo. `uv.lock` registra a combinação resolvida de dependências, os endereços dos arquivos e seus hashes. `uv sync --locked` cria `.venv` e instala essa combinação; se o arquivo de configuração divergir do lock, o comando falha em vez de atualizar o lock silenciosamente.

Não é necessário ativar o ambiente no terminal: `uv run --locked` escolhe o ambiente do projeto. Na instalação validada, o PyTorch informa `2.14.1+cpu`, o Laya informa `0.4.3` e `cuda` aparece como `None`. Isso é esperado: escolhemos executar em CPU. Ainda não carregamos o modelo.

O [guia de integração entre uv e PyTorch](https://docs.astral.sh/uv/guides/integration/pytorch/) explica a configuração do índice, e o [pacote Laya no PyPI](https://pypi.org/project/laya/0.4.3/) identifica a versão da biblioteca. O diretório do exemplo inclui o programa e os resultados registrados. O lock cobre o ambiente Python; a revisão dos pesos do modelo é fixada separadamente no programa.

## 3. Crie o programa de classificação

Salve o código abaixo em um arquivo chamado `triagem.py`, dentro da pasta `teste-laya`. É o programa completo.

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

`QUESTIONS` define a pergunta e o significado das quatro opções. Os identificadores `financeiro`, `tecnico`, `comercial` e `outro` são as categorias que aparecerão na saída. A grafia sem acento de `tecnico` é apenas um identificador de código.

`CASES` reúne cada mensagem com a categoria que uma pessoa espera receber. O modelo recebe somente a mensagem e as definições de `QUESTIONS`; o gabarito fica no programa para conferir a previsão depois.

`baseline` implementa uma comparação por palavras-chave. Já `laya.load` carrega o modelo pronto. O campo `revision` fixa a versão dos pesos no Hugging Face; sem esse campo, uma atualização do repositório pode mudar o checkpoint baixado. `device="cpu"` define o equipamento e `torch.set_num_threads(2)` limita as threads de cálculo do PyTorch.

O laço executa uma inferência para cada mensagem e mostra a categoria prevista, as probabilidades e o tempo. Os limites `max_len` e `head_max_len` precisam comportar o texto, a pergunta e as opções. Ao testar textos longos, confira `result["usage"]["truncated"]`: um valor `True` indica que parte da entrada foi cortada. Não há treinamento nesse programa. A saída também não encaminha tickets: apenas imprime resultados no terminal.

## 4. Execute e leia a resposta

Dentro da pasta `teste-laya`, execute:

```bash
uv run --locked triagem.py
```

A primeira carga precisa de internet para baixar os arquivos públicos do checkpoint. As próximas cargas podem reutilizar o cache do Hugging Face. Depois do download, o cálculo do modelo acontece localmente; este programa não chama uma API de classificação.

Na execução que fizemos em 22 de outubro de 2026, a primeira mensagem produziu:

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

A categoria de maior probabilidade foi `financeiro`, que coincide com o gabarito. O campo `tempo_ms`, omitido desse recorte, mede a chamada de previsão em cada mensagem. Ele não inclui instalação e carga do modelo.

Mas o exemplo também encontrou erros:

| Mensagem | Gabarito | Previsão do modelo |
| --- | --- | --- |
| Cobraram duas vezes a mensalidade. Quero estorno. | financeiro | financeiro |
| A tela fecha quando tento salvar um cadastro. | tecnico | tecnico |
| Quero conhecer os planos e contratar para a equipe. | comercial | tecnico |
| Obrigado pelo atendimento. | outro | tecnico |

O programa terminou com `Acertos do modelo: 2/4` e `Acertos das regras: 4/4`. Mantivemos as mensagens, o prompt e esses resultados, sem ajustar o exemplo para esconder os erros. A instalação funcionou; a classificação não acertou todos os casos.

As quatro frases são exemplos didáticos escritos pelo autor, e as regras encontram pistas óbvias nesses textos. Isso favorece a comparação por palavras-chave. Quatro casos não estimam desempenho em produção e não permitem concluir que regras sempre superam o Laya.

## 5. Probabilidade alta também pode acompanhar um erro

Na mensagem “Obrigado pelo atendimento.”, o modelo atribuiu `0.8821` à opção `tecnico`, apesar do nosso gabarito `outro`. Uma probabilidade alta emitida pelo modelo não prova que aquela decisão esteja correta.

Da mesma forma, `0.80` não garante 80% de acerto nos textos do seu produto. Para interpretar probabilidades como frequências de acerto, você precisa avaliar e, quando necessário, calibrar o modelo com dados adequados. Um limiar como `0.80` pode encaminhar casos para revisão, mas precisa ser escolhido e validado em um conjunto separado. A [documentação sobre separação de treino e teste](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) explica por que usar o teste para escolher ajustes produz estimativas otimistas.

Rodar em GPU pode reduzir o tempo em algumas configurações. Este ensaio em CPU não demonstra que trocar o equipamento corrigiria os erros de categoria.

## 6. Troque os exemplos e avalie sua tarefa

Depois de executar o programa, altere `QUESTIONS` para uma decisão do seu domínio e prepare mensagens com respostas esperadas por pessoas. Inclua mensagens curtas, ambíguas, fora das categorias e com mais de um assunto.

Use uma parte dos exemplos para desenvolver as instruções. Reserve outros, que você não usa para escolher o prompt ou o limiar, para a avaliação final. Registre a versão da biblioteca, a revisão dos pesos, a pergunta e as previsões por caso.

Compare com uma solução simples. Observe quais categorias erram, quais erros têm maior consequência e quantos casos precisam de revisão humana. A decisão de adotar um modelo depende também de latência, memória e manutenção, não somente de uma porcentagem geral de acerto.

Quando uma falha puder causar prejuízo, mantenha uma intervenção humana ou uma regra explícita adequada ao fluxo. Uma classificação de texto não deve, sozinha, autorizar pagamento, remover conteúdo ou executar uma operação.

## Se algo der errado

| Sintoma | Primeiro passo |
| --- | --- |
| `No module named laya` | Entre na pasta do projeto, execute `uv sync --locked` e rode o arquivo com `uv run --locked triagem.py`. |
| Falha no download | Confira o acesso ao Hugging Face e repita a carga. Não invente arquivos de configuração ausentes. |
| Mensagem classificada incorretamente | Confira as categorias, o texto e a previsão. Uma execução sem erro de software não garante uma classificação correta. |
| Consumo de memória elevado | Feche outros processos e teste um programa de cada vez. Os arquivos baixados não representam toda a memória usada pelo processo. |

Quando o programa termina, o comando devolve o controle ao terminal. A pasta `.venv`, os arquivos do projeto e o cache do modelo permanecem no disco para a próxima execução.

Esse teste é um ponto de partida para discutir [avaliação de IA e engenharia de produto](/solucoes). No [Journal da RBX](/journal), o artigo [O modelo não é o sistema](/blog/2026-04-01-the-model-is-not-the-system) aprofunda a relação entre modelo e controles. Se você tem um produto em operação e precisa definir como avaliar e integrar IA, [conheça a RBX Engineering Partnership](/parceria).
