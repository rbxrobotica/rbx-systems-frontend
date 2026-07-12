---
title: 'Logs voláteis não são evidência'
date: '2026-07-12'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, engenharia, confiabilidade, governanca, recovery]
excerpt: 'Recovery em sistemas críticos precisa emitir evento, métrica ou estado auditável. Logs ajudam no diagnóstico, mas não bastam como prova.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-12-volatile-logs-are-not-evidence.png'
---

# Logs voláteis não são evidência

Sistemas críticos não podem depender de logs voláteis como única prova de recovery.

Esse aprendizado veio de um caso concreto no Robson. Depois de um deploy saudável, o sistema estava operacional, mas uma pergunta simples ficou sem resposta retroativa: o `insurance-stop heal` do startup rodou? O comportamento esperado podia ter acontecido corretamente. O problema era outro. Os logs disponíveis já não cobriam o início do pod.

Na prática, a evidência tinha evaporado.

Para um sistema comum, isso talvez pareça aceitável. Para um sistema de execução e risco, não é. O Robson existe para transformar decisões operacionais em garantias verificáveis, como já apareceu em posts anteriores sobre [stops que sobrevivem a falhas](/blog/2026-07-03-stops-that-survive-failures), [fallback em produção](/blog/2026-07-06-fallback-debuts-in-production) e [o stop gain que auditou o sistema](/blog/2026-07-05-stop-gain-that-audited-the-system). Se a proteção depende de uma checagem de startup, a checagem precisa deixar rastro durável.

## O erro institucional

Logs são bons para depuração imediata. Eles contam a história enquanto o processo ainda está perto, enquanto a retenção cobre a janela certa e enquanto alguém sabe exatamente o que procurar.

Mas logs não são o livro-razão do recovery.

Quando a pergunta é “o recovery rodou?”, “o que ele verificou?” ou “por que ele não alterou nada?”, a resposta precisa sobreviver a restart de pod, rotação de logs, retenção curta e passagem do tempo. Uma organização não governa sistemas críticos com memória de terminal.

O ponto mais importante é que a ausência de mudança também é um resultado operacional. Se o recovery verificou o estado e concluiu que nada precisava ser alterado, isso deve aparecer como fato auditável. Caso contrário, o caminho saudável fica indistinguível de um caminho que nunca executou.

## A regra que saiu do incidente

O caso virou primeiro uma guardrail agnóstica no `rbx-agent-layer` PR #11. A formulação é simples: recovery, reconciliação e auto-heal precisam produzir evidência durável, inclusive no caminho em que nada foi corrigido.

Depois a regra virou implementação no Robson PR #129, com o evento durável `startup_recovery_insurance_stop_checked`.

Esse nome importa. Ele não diz apenas que algo foi consertado. Ele diz que a checagem aconteceu. O evento existe para provar o ciclo completo: startup executou a verificação, avaliou o estado do insurance stop e registrou o resultado.

Esse é o tipo de detalhe que separa observabilidade útil de governança operacional. Uma métrica pode mostrar frequência e tendência. Um evento pode preservar o fato. Um estado persistido pode expor a última conclusão conhecida. O mecanismo exato depende do sistema. O princípio não depende.

## Recovery precisa provar o caminho saudável

Muitos sistemas só registram quando algo dá errado ou quando uma correção foi aplicada. Isso cria uma lacuna no caso mais comum e mais perigoso para auditoria: “verificado, nenhuma ação necessária”.

Esse caminho precisa ser visível.

Em sistemas críticos, recovery não é apenas uma função que tenta consertar. Recovery é um contrato institucional. Ele deve responder, depois do fato:

- qual checagem foi executada
- quando ela foi executada
- sobre qual escopo
- qual conclusão foi tomada
- se houve alteração, qual alteração ocorreu
- se não houve alteração, por que isso era aceitável

Sem isso, a equipe passa a confiar em inferência. O deploy foi saudável. O pod está pronto. A posição está protegida. Logo, o heal deve ter rodado. Essa cadeia pode estar correta, mas ela não é evidência.

## O princípio RBX

O padrão que fica para o [Journal](/journal) e para os produtos da [RBX Systems](/produtos) é direto:

> Sistemas críticos não devem exigir fé retrospectiva em logs efêmeros. Recovery precisa emitir evento, métrica ou estado auditável, inclusive quando nada precisou ser alterado.

Isso vale para startup recovery, reconciliação financeira, saneamento de projeções, validação de stops, reidratação de estado e qualquer rotina que exista para restaurar segurança operacional. Se a rotina tem responsabilidade crítica, ela deve deixar evidência compatível com essa responsabilidade.

Logs continuam úteis. Eles ajudam a investigar, depurar e entender contexto. Mas eles não devem ser a única prova de uma garantia institucional.

O resultado prático é simples: quando um sistema crítico se autocorrige, ele registra. Quando verifica e não precisa corrigir, ele também registra. O operador não fica preso a uma janela de retenção para provar que o sistema fez o que prometeu.

Essa é a barra que queremos manter em [Trust](/trust): comportamento crítico precisa ser auditável depois, não apenas observável agora.

## Versão curta para LinkedIn

Aprendizado de engenharia no Robson: logs voláteis não são evidência suficiente para recovery em sistemas críticos.

Depois de um deploy saudável, não era possível provar retroativamente que o `insurance-stop heal` do startup tinha rodado, porque os logs disponíveis já não cobriam o início do pod. O sistema podia estar correto, mas a evidência tinha evaporado.

Isso virou guardrail no `rbx-agent-layer` PR #11 e depois implementação no Robson PR #129, com o evento durável `startup_recovery_insurance_stop_checked`.

Princípio: recovery e auto-heal precisam emitir evento, métrica ou estado auditável, inclusive quando nada precisou ser alterado.
