---
title: 'Stops que sobrevivem a falhas: o redesenho da camada de execução do Robson'
date: '2026-07-03'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, execucao, risco, confiabilidade, trading]
excerpt: 'Um trade fechou 48% acima do teto de risco enquanto o daemon estava fora do ar. A investigação produziu dois ADRs, cinco correções de produção e uma surpresa da API da Binance. Estes são os números.'
---

Em junho, um trade do Robson fechou com perda de 1,48% do capital base. O teto da política é 1% por operação, sem exceções. Pior: a análise mostrou que aquele trade deveria ter fechado praticamente no zero a zero.

A investigação desse único trade produziu dois ADRs, cinco correções de produção e uma surpresa da API da Binance que capturamos ao vivo, catorze segundos depois de abrir a posição seguinte. Este artigo documenta as decisões de arquitetura e os números reais.

## O incidente: um stop que só existia na memória de um processo

O Robson é um motor de execução e risco para mercados alavancados. Ele não decide o que operar. Ele garante que, decidida a operação, o risco seja limitado: o tamanho da posição deriva da distância até um stop técnico extraído do gráfico, calibrado para que o stop atingido custe no máximo 1% do capital.

No dia 28 de junho, uma posição comprada em BTCUSDT entrou a 59.696,90 com stop técnico em 58.888,00. O tamanho foi calculado corretamente. O que aconteceu depois, não:

- O daemon caiu com um stack overflow e ficou 45,4 horas fora do ar com a posição aberta.
- Durante o gap, o preço subiu um span completo. O trailing stop teria avançado para o breakeven, 59.696,90.
- O preço então caiu através desse nível. Não havia ninguém para agir: o stop era monitorado por software, e o software estava morto.
- No restart, a recuperação reprocessou as velas do gap, reconstruiu o trailing corretamente e saiu a mercado a 58.614,50. Isso é 1.082,40 abaixo do stop que uma saída saudável teria executado.

Perda realizada no mês: 1,48% do capital base, incluindo taxas. Um trade que valia zero virou a perda cheia porque a proteção dependia de um processo estar vivo.

## Decisão 1: disponibilidade nunca pode ser pré-condição para perda limitada

A correção óbvia seria endurecer o daemon. Fizemos isso: pilhas maiores nas threads de trabalho, eliminação da única recursão assíncrona do código, correção do bug que fazia um restart pular o reset mensal de risco. Mas confiabilidade de processo tem teto. Deploys acontecem. Nós falham. Partições de rede existem.

O ADR-0039 estabeleceu o princípio que agora é invariante do projeto: a disponibilidade do daemon nunca pode ser pré-condição para perda limitada. Na prática, o stop passou a ter duas camadas independentes:

- O monitor de software continua sendo o caminho primário de saída. Ele é inteligente: trailing discreto, auditoria por tick, cancelamento coordenado.
- Uma ordem condicional reduce-only passou a descansar na própria exchange, no mesmo preço do stop técnico. Ela é burra e indestrutível: se o daemon morrer, a exchange executa sozinha.

Quem dispara primeiro vence, e o sistema cancela e reconcilia a outra ponta. A reconciliação fecha o ciclo: preenchimentos do stop de seguro só encerram posições com evidência real de execução, nunca com estimativas. E a varredura de ordens órfãs falha para o lado seguro: uma ordem de proteção sem dono registrado, num símbolo onde existe posição ativa sem stop vinculado, é mantida e alertada, nunca cancelada. Cancelar uma proteção viva é o erro pior.

## Decisão 2: 1% é teto de pior caso, não alvo

O sizing antigo resolvia a equação errada. Ele calculava o tamanho para que a perda no preço exato do stop fosse 1%. Taxas e derrapagem ficavam fora da conta, o que garantia matematicamente que todo stop atingido estourasse o teto.

A fórmula nova precifica o pior caso realizável:

```
tamanho = (capital × 1%) / (distância_do_stop + folga_de_gap + taxas_de_ida_e_volta)
```

Números do primeiro trade dimensionado assim, em produção: orçamento de 16,43 USDT, distância de 695,90, folga de gap de 62,18 (10 pontos-base do stop), taxas estimadas de 61,83. Resultado: 0,020037 BTC, truncado para 0,02 pelo lot step. Se o stop executar, a perda total fica no orçamento, não acima dele.

A posição fica um pouco menor. Esse é o preço de transformar o 1% de uma média em um limite.

## A surpresa: a exchange mudou a API, e o design absorveu

Catorze segundos depois de abrir a primeira posição sob o novo desenho, a colocação do stop de seguro falhou com o erro -4120 da Binance. Desde dezembro de 2025, ordens condicionais em futuros USD-M migraram para a Algo Order API, e o endpoint tradicional passou a rejeitá-las.

Dois pontos merecem registro. Primeiro, o fail-safe funcionou como projetado: a falha virou evento de auditoria, a posição seguiu protegida pelo monitor de software e nada bloqueou o fluxo. Segundo, a correção foi ao ar no mesmo dia, e o mecanismo de cura do startup colocou a ordem pendente automaticamente na posição que estava aberta, sem intervenção manual.

O detalhe conceitual importa: uma ordem condicional não entra no livro de ofertas. Ela é um gatilho que a exchange monitora, criando a ordem real apenas quando o preço cruza o nível. A arquitetura final tem três vigias do mesmo preço: o monitor do Robson, o motor de condicionais da exchange e a reconciliação auditando os dois com evidência real.

## Decisão 3: otimizar taxa onde esperar é grátis, nunca onde esperar custa

Com as taxas dentro do orçamento de risco, elas viraram um alvo de engenharia. Toda ordem do Robson é a mercado e paga taxa taker nas duas pontas. Na conta operada, 0,10% por execução: o trade piloto pagou 1,23 USDT de entrada sobre um notional de 1.229 USDT.

As duas pontas não são simétricas:

| Ponta | Custo de não executar | Taxa correta |
| --- | --- | --- |
| Entrada | Zero. Oportunidade perdida, nunca prejuízo | Maker, vale esperar |
| Stop | Ilimitado. É a perna que limita a perda | Taker, sem negociação |

O ADR-0040 propõe entradas maker-first: ordem limite post-only no topo do livro, reprecificação em intervalo fixo e escape para mercado quando um orçamento de tempo ou de deriva de preço estoura. Stops e saídas permanecem a mercado para sempre. Essa assimetria virou regra escrita: otimização de taxa só é permitida em pernas onde a não-execução é gratuita.

O sizing não muda: ele continua assumindo taker nas duas pontas, porque o teto de 1% vale para o pior caminho, que inclui o escape. A economia aparece como custo realizado menor, nunca como posição maior.

## Os números em escala

A economia da entrada maker é linear em volume. Com taker de 0,10% e maker típico de 0,02%, a ponta de entrada cai 80%, o que reduz o custo de ida e volta em 40%:

| Volume mensal negociado | Taxas hoje (0,20% ida e volta) | Com entrada maker | Economia anual |
| --- | --- | --- | --- |
| 25 mil USDT | 50 USDT | 30 USDT | 240 USDT |
| 200 mil USDT | 400 USDT | 240 USDT | 1.920 USDT |
| 1 milhão USDT | 2.000 USDT | 1.200 USDT | 9.600 USDT |

Mas a hierarquia de valor é honesta: a maior economia deste ciclo não é de taxa. O incidente de junho custou 1,48 pontos percentuais do capital em um único evento que o novo desenho elimina por construção. Um ano inteiro de otimização de taxa não paga um único stop que ninguém executou.

## O que fica

Três princípios saíram deste ciclo e agora são invariantes escritos do projeto:

- Disponibilidade nunca é pré-condição para perda limitada. Proteção mora na exchange; inteligência mora no software.
- Tetos de risco são de pior caso. Se a conta não fecha com taxas e derrapagem dentro, a conta está errada.
- Assimetria decide onde otimizar. Esperar é grátis na entrada e ruinoso na saída, e o código trata as duas pontas de acordo.

O ciclo inteiro, do diagnóstico forense ao deploy verificado em produção, foi conduzido com engenharia assistida por agentes sob revisão humana de cada linha, com as decisões registradas em ADRs antes do código. O incidente custou 1,48% uma vez. As invariantes ficam.
