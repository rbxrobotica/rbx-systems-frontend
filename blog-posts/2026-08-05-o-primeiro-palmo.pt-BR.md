---
title: 'O primeiro palmo'
date: '2026-08-05'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, risco, adr, robson, confiabilidade]
excerpt: 'Ontem contamos a decisão: uma régua só para o risco inteiro. Hoje ela estreou em produção, numa posição real. Este post confere a geometria número por número, mostra os dois segundos de eventos que separam o sinal do stop de proteção, e explica por que o tamanho da posição diminuiu quando o palmo cresceu.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-05-o-primeiro-palmo-v2.png'
---

Ontem publicamos a decisão: o span de uma posição, o palmo, passa a ser a distância da referência de entrada ao stop executável, calculado uma vez, gravado antes de qualquer ordem, imutável pela vida da posição. Escada de trailing, alvos, risco reservado e dimensionamento, tudo na mesma medida.

Hoje a régua estreou. A primeira posição armada sob a política nova está viva em produção, e o painel dela é a demonstração que a filosofia pedia.

## A geometria, número por número

A referência de entrada do sinal foi 64.633,50. O span persistido: 850,40. E então:

- Stop executável: 63.783,10. A referência menos o span. Um palmo abaixo.
- Primeiro alvo: 65.483,90. A referência mais o span. Um palmo acima.
- Stop após o primeiro degrau: 64.633,50. A própria referência.

Simetria completa. O stop está à mesma distância que o primeiro alvo, e o primeiro palmo completo a favor trava o stop conceitual exatamente no ponto de partida. Qualquer pessoa com uma calculadora audita o painel inteiro com uma subtração. Não há mais régua escondida: a pergunta "qual é o span?" tem uma resposta, e ela explica todos os números da tela.

## Dois segundos, oito eventos

Entre o gatilho do sinal e o stop de proteção na exchange passaram cerca de dois segundos. A trilha de eventos, visível no próprio painel, conta a sequência: posição armada, política de entrada resolvida, stop técnico analisado, evidência de admissão gravada, ordem solicitada, aceita, executada, stop de proteção colocado.

A ordem dessas linhas é a parte séria. A evidência de admissão, que carrega o span e o stop resolvido, é gravada de forma durável **antes** da ordem tocar a exchange. Se o processo morrer entre duas linhas quaisquer, a recuperação encontra um estado conhecido: ou não há ordem nenhuma e nada se perdeu, ou há uma ordem cujo plano completo já está no log. Números primeiro, side effects depois. É a diferença entre um sistema que se explica e um que se desculpa.

## O tamanho encolheu, e isso é o contrato

As posições anteriores operavam 0.024 de contrato; esta abriu com 0.015. Não foi cautela de ocasião: o span desta entrada era maior, e a admissão precifica o pior caso completo, distância do trigger mais custos de execução, dentro do mesmo teto de sempre. Palmo maior, tamanho menor, risco planejado constante. O tamanho da posição é uma saída da política, nunca uma opinião.

## Duas eras, uma trilha

Horas antes da estreia, a última posição da era anterior fechou no próprio stop, e o mês registrou a perda no ledger governado, à vista no painel. Ela nasceu sob a derivação antiga e foi gerida por ela até o fim, porque posição carrega para sempre o carimbo da política que a criou. A nova nasceu sob a política nova. As duas eras convivem no mesmo event log, cada uma auditável pelas próprias regras, sem retroação.

E com o primeiro armamento novo, cruzamos uma fronteira que a decisão já previa: a partir dele, o release é forward-only. O sistema registra o momento em que sua história mudou, e não finge que pode desfazê-lo.

## O critério que fica

O teste da régua é poder fazer uma pergunta e receber um número. Ontem escrevemos que, se a resposta precisa de duas réguas, ainda há trabalho. Hoje a resposta precisou de uma: 850,40. O resto do painel é consequência.
