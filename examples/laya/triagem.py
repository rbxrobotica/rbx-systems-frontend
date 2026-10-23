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
