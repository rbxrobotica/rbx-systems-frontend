---
title: 'O retest que não nos estopou: validação com fogo real do buffer de stop'
date: '2026-07-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, execução, risco, stops, trading]
excerpt: 'Duas shorts no mesmo símbolo, com horas de diferença. Uma saiu acima da máxima recente exatamente como projetado. A outra viu o preço tocar 63.450 — além do nível que antes era o stop — e continuou viva. Entre as duas, encontramos um número que mentia e uma regra de risco que ninguém jamais adotou.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-04-the-retest-that-did-not-stop-us.jpg'
---

Ontem publicamos o invalidation guard e passamos uma noite extraindo quatro bugs dos caminhos de sizing e de reposição de stop. Este é o follow-up: hoje o stop em camadas encontrou o mercado duas vezes, e os dois encontros saíram exatamente como o projeto diz que deveriam. Chegar lá exigiu corrigir um número que mentia no dashboard, apagar uma regra de risco que nenhum documento de política jamais adotou, e matar nosso segundo hot loop em dois dias.

## O número no card não era o stop

A primeira short do dia ativou com o card mostrando `stop 62.984,17`, visivelmente abaixo da máxima recente de 63.069,60. Para uma short, um stop abaixo do nível que invalida a operação é exatamente a falha que o guard nasceu para impedir. Teria regredido em silêncio no primeiro dia?

Não tinha. A dízima periódica entregou a história real: 62.984,1666... é uma média aritmética. O analisador técnico agrupa swing highs próximos dentro de meio por cento — cerca de 314 dólares em BTC nesses preços — e representa o cluster pela média, que por construção fica dentro da zona de resistência, abaixo do topo dela. Essa média é a referência conceitual em que o trailing ladder se ancora. Nunca foi o stop executável.

O stop executável estava onde deveria: o guard havia amostrado o extremo recente em 63.069,60, o buffer de dez basis points empurrou a execução para 63.132,67, e a ordem de seguro descansava na exchange exatamente nesse preço. Quando o mercado rompeu a máxima de verdade, a posição saiu por volta de 63.162 — acima do pico, invalidação legítima, não um scalp de retest.

O defeito era de apresentação. O card renderizava o número conceitual e escondia o executável, então uma posição corretamente protegida parecia quebrada. O fix leva o stop executável ao card, com o nível do guard como contexto enquanto ele vigora: `stop 63.132,67 (guard 63.069,60)`. O operador age sobre o que a tela diz. A tela precisa dizer o número que dispara.

## A regra que ninguém escreveu

Rearmar depois desse stop-out produziu silêncio. Nenhuma entrada, nenhum erro no card, só uma posição Armed que nunca ativava. Os logs eram menos quietos: o gate de risco negava a entrada uma vez por segundo.

O motivo: um limite de perda diária de 1% do capital. Nossa política não tem essa regra — nunca teve. A política escrita é um por cento de perda máxima por operação e um orçamento mensal de drawdown de quatro por cento, e o documento canônico diz com todas as letras: não existe limite de perda diária. O check existia no código mesmo assim, documentado meses atrás como estruturalmente inativo porque seus inputs eram zerados. Então alguém ligou o PnL diário real no contexto de risco, e a regra adormecida acordou. Um stop-out do tamanho do orçamento e o sistema se recusava a operar até a meia-noite UTC.

Essa falha tem nome: deriva entre spec e código. Uma regra que ninguém adotou continua sendo uma regra se está no caminho do código, e vai se impor exatamente no primeiro dia em que importa. Removemos o check, seu encanamento e suas fixtures, e deixamos um teste de regressão afirmando que uma perda de 1,2% no mesmo dia é aprovada enquanto o orçamento mensal tem espaço.

A parte do uma-vez-por-segundo era um bug próprio, o segundo hot loop da semana. Uma negação governada rearmava o detector; em modo imediato o detector novo dispara proativamente na hora; a negação era persistente. Oitenta e quatro negações em noventa e dois segundos, cada uma buscando cem candles e gravando eventos de ciclo de vida. Re-arms governados agora recuam exponencialmente, cinco segundos dobrando até um teto de quinze minutos, zerados no momento em que um sinal passa pelo gate. Depurando as telas da tesouraria encontramos o mesmo padrão pela terceira vez: uma saga de funding cujo loop de retomada de cinco segundos havia apendado quatro mil eventos duplicados durante uma transferência travada em junho. Mesmo fix, mesma lição — um retry sem backoff, ou um retry que escreve a cada passagem, é um denial-of-service que você roda contra si mesmo.

## O retest

Com a regra fantasma removida, o operador rearmou. A entrada passou pelo gate na primeira tentativa: short a partir de 63.145,20. Desta vez o stop técnico do analisador caiu exatamente sobre a máxima recente em 63.420,00 — o guard nem precisou clampar — e o buffer colocou a execução em 63.483,42, dez basis points além do nível que qualquer leitor de gráfico enxerga.

Então o mercado fez a coisa que todo este projeto antecipa. O preço correu até 63.450: trinta dólares além da máxima, trinta e três dólares aquém do nosso stop. O sistema antigo — o de dois dias atrás, com o stop estacionado no nível óbvio — é retirado nesse pavio. O nosso assistiu acontecer e manteve a posição.

Essa é a tese inteira do stop em camadas em um único candle. O nível técnico é onde a operação é invalidada conceitualmente. O nível óbvio é onde a liquidez descansando é varrida. A execução pertence a um offset medido além do segundo, precificado no sizing da posição para que o teto de um por cento continue valendo, aplicado tanto em software quanto por uma ordem reduce-only descansando na exchange.

## O que o dia de hoje acrescenta ao de ontem

A lição de ontem foi que quatro bugs podem se esconder atrás de uma feature. A de hoje é mais quieta e merece ser dita com clareza.

Mostre o número que dispara. Qualquer distância entre o que o sistema faz e o que o operador vê será paga, cedo ou tarde, em pânico ou em confiança mal colocada. A nossa custou uma hora de investigação para provar que o sistema estava certo e a tela errada.

Apague regras que você não adotou. Documentação dizendo que um check está inativo é uma promessa de que alguém um dia vai ativá-lo por acidente. Se a política diz que a regra não existe, o código precisa concordar.

E validação não é uma suíte de testes verde. É o mercado tocando 63.450 com o seu stop em 63.483,42, e a posição ainda estar lá quando o candle fecha.
