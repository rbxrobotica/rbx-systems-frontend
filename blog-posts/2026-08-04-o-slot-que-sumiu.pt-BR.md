---
title: 'O slot que sumiu'
date: '2026-08-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, risco, adr, robson, confiabilidade]
excerpt: 'Um mês sem nenhuma perda governada, e o painel mostrava 3 slots de 4. O número estava certo e a regra estava errada. Como uma pergunta de operador virou a substituição formal de um ADR, por que a correção óbvia era insegura, e o que um segundo modelo encontrou no nosso próprio texto antes da aprovação.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-04-o-slot-que-sumiu-v2.png'
---

O Robson, nosso executor de futuros governado, abre o mês com quatro slots. Cada slot representa uma unidade de risco: nenhuma entrada pode planejar perda maior que 1% do capital base, e o mês inteiro tem um teto de 4%. Slots livres é o que o painel mostra primeiro, porque é a pergunta que o operador faz primeiro: quanto ainda posso errar este mês?

Em agosto, o painel mostrava 3 de 4. O mês tinha duas posições encerradas, nenhuma perda governada, nenhuma posição aberta. A perda realizada do mês era zero. O operador fez a pergunta certa: onde foi parar o quarto slot?

## O número estava certo

A primeira suspeita em um caso assim é bug de exibição. Não era. O backend calculava exatamente o que a decisão vigente mandava calcular.

A decisão vigente era um ADR de julho que ancorava o orçamento mensal no pico de equity do mês, uma marca d'água alta: cada novo pico rearmava o colchão de 4%, e qualquer recuo a partir do pico consumia orçamento. O detalhe importante é que o pico incluía resultado ainda aberto. Uma posição que mostrou resultado positivo na tela por alguns minutos registrava um pico; quando o trailing stop devolveu parte daquilo antes de encerrar, a diferença contou como consumo do orçamento do mês.

Foi isso que comeu o slot: 0,4% de consumo registrado num mês em que nenhuma operação terminou em perda. O painel refletia fielmente uma regra que o operador, vendo o efeito dela pela primeira vez em conta real, decidiu que era a regra errada.

## Redefinir antes de reescrever

A correção começou pela frase, não pelo código. O operador enunciou o invariante que o orçamento mensal deve proteger, e apenas ele: a perda governada do mês, medida contra o capital base do início do mês, nunca passa de 4%. Mais de quatro operações no mês? Permitido, desde que o invariante segure. Recuo de resultado ainda aberto dentro de uma operação? Problema do trailing stop daquela posição, que já existe para isso, e do teto de 1% dela. O orçamento mensal deixou de proteger picos.

E uma segunda frase, que virou princípio nomeado no ADR novo: toda posição aberta é sempre assumida caminhando para a derrota. A perda máxima dela, precificada com custos de execução, fica reservada contra o orçamento no momento em que a posição passa a existir. Se ela vencer, a reserva é liberada. Se perder, a perda já estava orçada e nunca empurra o mês além do teto.

## A correção óbvia era insegura

A primeira proposta parecia natural: ancorar o consumo no resultado líquido do mês desde o início, incluindo o não realizado. Mês positivo, consumo zero, quatro slots. Simples.

Submetemos a proposta a uma revisão adversarial por um segundo modelo, com instrução explícita de derrubar o desenho. Ele derrubou. O cenário: uma posição encerrada em perda de 1%, e uma posição aberta com resultado positivo não realizado e stop no ponto de entrada. O stop no ponto de entrada significa risco latente zero. O resultado aberto positivo, somado ao líquido do mês, mascarava a perda já realizada: o consumo aparente voltava a zero e o sistema admitia risco novo como se o mês estivesse limpo. Se a posição aberta devolvesse tudo até o stop e as entradas novas perdessem, o mês fecharia além do teto.

A lição cabe numa linha: resultado não realizado não é protegido por nenhuma reserva, então ele não pode entrar na âncora do orçamento. A prova de segurança do modelo final dispensa qualquer termo não realizado, e é exatamente por isso que ele fica de fora.

## O que foi decidido

O modelo aprovado ancora o consumo no resultado governado realizado desde o início do mês, com liquidação completa: taxas e funding entram, não realizado e variações fora do fluxo governado ficam de fora. Ganhos realizados compensam perdas realizadas anteriores até zerar o consumo, e nada expande o orçamento acima dos 4%. O risco latente de toda posição aberta, na presunção pessimista, subtrai da capacidade disponível. Admissão de entrada, contagem de slots, API de status e o freio mensal passam a consumir um único snapshot canônico, porque a revisão encontrou caminhos de código calculando risco latente com conjuntos diferentes de posições.

No mês de agosto, sob o modelo novo: consumo zero, quatro slots.

## O processo é o produto

A mudança virou um ADR que supersede formalmente o anterior, com o registro de por que a decisão de julho, correta para o problema que ela atacava, protegia a coisa errada. O texto passou por dois ciclos completos de revisão adversarial pelo segundo modelo, e o segundo ciclo pegou o que mais nos interessa contar: duas afirmações falsas na nossa própria seção de consequências. Tínhamos escrito que o freio mensal nunca mais dispararia com o mês positivo. Falso: reserva latente sozinha pode esgotar o orçamento com resultado realizado zero ou positivo, e o texto final documenta isso como consequência aceita em vez de negar. Um documento de risco que exagera a própria garantia é exatamente o tipo de dívida que não queremos versionada.

O pacote final inclui matriz de decisão com as cinco alternativas comparadas, prova fechada do piso de 4%, tabela de modos de falha, plano de rollout em duas fases com gates de ativação, e backlinks nos três ADRs anteriores marcando cláusula por cláusula o que foi parcialmente superseded. Só documentação: nenhuma linha de código de risco muda antes de a decisão estar escrita, revisada e mergeada. A implementação vem em fatias, cada uma contra o texto aprovado.

## O critério que fica

Um número num painel de risco é um contrato, e contrato se honra dos dois lados: o sistema calcula o que está escrito, e o que está escrito tem que ser o que o operador entende que está comprando. Quando o painel surpreende quem opera, ou a conta está errada, ou o contrato está. Corrigir contrato se faz por escrito, com versão, com adversário, e antes de tocar em produção.
