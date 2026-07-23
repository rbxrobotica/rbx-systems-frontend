---
title: 'O nó chegou ao topo'
date: '2026-07-23'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [bitcoin, infraestrutura, pagamentos, soberania, engenharia]
excerpt: 'Dez dias depois, nosso nó Bitcoin validou o último bloco da cadeia. Os números finais da sincronização, o que a curva confirmou e o que ainda falta antes do primeiro pagamento real.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-23-o-no-chegou-ao-topo.png'
---

No dia 13 de julho, contamos aqui por que a RBX decidiu rodar seu próprio nó Bitcoin. Naquele momento, o nó estava em 34,8% da sincronização, validando blocos de janeiro de 2020, e o texto terminava com uma promessa: quando ele alcançasse o topo, contaríamos a próxima parte.

Chegou. Em 21 de julho de 2026, às 22:57 UTC, o nó validou o bloco 959.070 e o progresso marcou, pela primeira vez, 100%.

## O que esse número carrega

Do bloco gênese, minerado em janeiro de 2009, até o topo da cadeia, passaram pela nossa infraestrutura cerca de 1,4 bilhão de transações. Cada uma delas foi verificada de forma independente: assinatura por assinatura, regra por regra de consenso, prova de trabalho por prova de trabalho.

Nenhum atalho. Nenhuma consulta a um serviço de terceiro perguntando "esse histórico está certo?". A partir de agora, quando o nosso nó disser que um pagamento aconteceu, essa afirmação se apoia na cadeia inteira, validada por nós, do primeiro bloco ao último.

## A curva se comportou exatamente como descrevemos

No primeiro texto, explicamos que sincronizar um nó não é linear: os blocos antigos são leves e passam rápido, e o trabalho pesado de verdade está concentrado nos anos recentes.

A previsão se confirmou nos números. Quando publicamos, faltavam 65,2% da cadeia, justamente os seis anos e meio mais densos, de 2020 até hoje. Essa parte final levou mais oito dias de validação contínua. É a assimetria que descrevemos, vista de corpo inteiro: bem mais da metade do esforço computacional da cadeia inteira mora nos anos mais recentes.

## O custo final, conferido

Também prometemos números de infraestrutura sem fantasia. Fechada a sincronização, a conta ficou assim:

- Disco: cerca de 60 GB no total, sendo 49 GB de blocos e 11 GB de chainstate, o estado atual de quem possui o quê. Abaixo dos 75 GB que havíamos reservado, porque o modo "pruned" descartou, como planejado, os blocos antigos já validados.
- CPU e memória: dentro das faixas que publicamos, com o pico concentrado na fase de sincronização. Agora que o nó acompanha o topo, o consumo caiu para o regime de rotina.

Seguimos sem contratar nenhum servidor novo para isso. Era capacidade que já existia no cluster, agora com um trabalho concluído.

## O que muda no dia a dia

A sincronização inicial é uma maratona que acontece uma vez. Daqui em diante, o trabalho do nó é outro: receber um bloco novo a cada dez minutos, em média, validar e seguir. No momento em que este texto foi escrito, o nó estava no bloco 959.214, colado no topo da rede mundial.

## O que ainda falta, dito com honestidade

O nó é a fundação, não o produto. Em cima dele, ainda estamos ligando as peças que transformam verificação em cobrança: o indexador de carteiras, a loja no BTCPay Server e os webhooks que avisam nossos sistemas quando um pagamento confirma.

Por isso este texto não anuncia "pagamentos em Bitcoin no ar". Anunciar isso hoje seria antecipar uma etapa que ainda não aconteceu, e a régua desta série é contar as coisas como elas são.

Quando o primeiro pagamento real atravessar a nossa infraestrutura de ponta a ponta, do cliente ao webhook, sem nenhum intermediário no caminho, contamos a terceira parte.
