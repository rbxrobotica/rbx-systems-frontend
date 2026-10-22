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

## 1. Prepare o Python e um ambiente separado

Os comandos abaixo foram validados em Linux x86_64 com Python 3.12.3. Windows e macOS têm comandos de ambiente e opções de PyTorch diferentes; este passo a passo cobre Linux com CPU.

Reserve alguns gigabytes livres para dependências e cache. No ensaio anterior da RBX com o mesmo checkpoint, os cinco arquivos do modelo somavam cerca de 678 MB e o processo completo chegou a aproximadamente 2,28 GiB de RAM. São referências daquele ensaio, não requisitos máximos garantidos.

Abra um terminal e crie uma pasta:

```bash
mkdir teste-laya
cd teste-laya
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip --version
```

Confira se o primeiro comando de versão indica Python 3.12. O ambiente `.venv` mantém as dependências deste teste separadas dos outros projetos. A ativação precisa ser repetida quando você abrir outro terminal nessa pasta.

Se o Debian, Ubuntu ou Mint informar que `ensurepip` não está disponível, instale o pacote de ambientes virtuais e repita a criação:

```bash
sudo apt install python3-venv
python3 -m venv .venv
source .venv/bin/activate
```

Consulte a [documentação de ambientes virtuais do Python](https://docs.python.org/3/library/venv.html) se a sua distribuição usar outro pacote ou executável.

## 2. Instale as versões usadas no exemplo

Primeiro instale a distribuição de PyTorch para CPU. Depois instale Laya e as duas dependências principais com versões fixas:

```bash
python -m pip install "torch==2.14.1" --index-url https://download.pytorch.org/whl/cpu
python -m pip install "laya==0.4.3" "transformers==5.19.0" "numpy==2.5.4"
python -m pip check
python -c "import torch, laya; print('torch:', torch.__version__); print('laya:', laya.__version__); print('cuda:', torch.version.cuda)"
```

Usamos deliberadamente Laya 0.4.3 para manter a mesma versão do experimento descrito. Ela não é necessariamente a versão mais recente. O [pacote no PyPI](https://pypi.org/project/laya/0.4.3/) e o [guia de instalação do PyTorch](https://pytorch.org/get-started/locally/) são as referências para outros ambientes.

Na instalação validada, o PyTorch informa `2.14.1+cpu`, o Laya informa `0.4.3` e `cuda` aparece como `None`. Isso é esperado: escolhemos executar em CPU. O comando `pip check` deve informar que não há dependências incompatíveis. Ainda não carregamos o modelo.

As dependências transitivas podem mudar entre instalações. Para reproduzir a nossa combinação completa em Linux x86_64/Python 3.12, o [código-fonte deste artigo](https://github.com/rbxrobotica/rbx-systems-frontend/tree/637f19904daa25ae90f4207377dd8d4a868c8c0f/examples/laya) inclui o programa, os resultados registrados e um arquivo de dependências com versões, URLs e hashes. O `README.md` desse diretório mostra como instalar a combinação completa com `--require-hashes`. Para explorar a API, os comandos acima são o caminho mais curto; registre seu ambiente com `python -m pip freeze > ambiente.txt`.

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

Com o ambiente ainda ativado, execute:

```bash
python triagem.py
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
| `No module named laya` | Ative `.venv` e use `python -m pip` com o mesmo Python que executa o arquivo. |
| Falha no download | Confira o acesso ao Hugging Face e repita a carga. Não invente arquivos de configuração ausentes. |
| Mensagem classificada incorretamente | Confira as categorias, o texto e a previsão. Uma execução sem erro de software não garante uma classificação correta. |
| Consumo de memória elevado | Feche outros processos e teste um programa de cada vez. Os arquivos baixados não representam toda a memória usada pelo processo. |

Para encerrar o ambiente no terminal, execute `deactivate`. Os arquivos do projeto e o cache do modelo permanecem no disco.

Esse teste é um ponto de partida para discutir [avaliação de IA e engenharia de produto](/solucoes). No [Journal da RBX](/journal), o artigo [O modelo não é o sistema](/blog/2026-04-01-the-model-is-not-the-system) aprofunda a relação entre modelo e controles. Se você tem um produto em operação e precisa definir como avaliar e integrar IA, [conheça a RBX Engineering Partnership](/parceria).
