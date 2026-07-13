---
title: 'Por que a RBX roda seu próprio nó Bitcoin'
date: '2026-07-13'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [bitcoin, infraestrutura, pagamentos, soberania, engenharia]
excerpt: 'Em vez de confiar numa API de terceiro, a RBX verifica cada pagamento em Bitcoin com seu próprio nó, dentro do próprio cluster.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-13-no-bitcoin-proprio.png'
---

Toda vez que alguém aceita pagamento em Bitcoin, existe uma pergunta que quase ninguém faz: quem está confirmando que aquele pagamento realmente aconteceu?

Na maioria dos casos, a resposta é um serviço de terceiro. Uma API de block explorer, um provedor de pagamento, alguém que consultou a rede em nome da empresa e disse que podia confiar, que o pagamento chegou. Funciona, mas depende da palavra de outra parte.

Na RBX, escolhemos o caminho mais rigoroso: rodar nosso próprio nó Bitcoin.

## O que isso significa, na prática

Um nó Bitcoin é um computador que participa da rede baixando e validando, de forma independente, cada bloco e cada transação desde o primeiro, em 2009. Ele aplica sozinho as regras de consenso: assinaturas corretas, sem gasto duplo, prova de trabalho válida. Não pergunta a ninguém. Verifica.

É isso que está rodando na nossa infraestrutura agora: um `bitcoind` completo, acompanhado do NBXplorer, que indexa carteiras, e do BTCPay Server, que gera cobranças e webhooks. Tudo dentro do nosso próprio cluster Kubernetes, sem depender de nenhuma nuvem de terceiro para processar pagamento. É a mesma peça de infraestrutura que vai processar as assinaturas do [Briefing Diário BTC](/briefing-btc).

## Por que isso importa

Essa é a nossa definição prática de soberania técnica: quando o BTCPay confirma um pagamento em Bitcoin, quem verificou aquilo foi a RBX. Ninguém mais tem esse poder de veto ou de atraso. Não existe uma API externa no meio do caminho entre o pagamento do cliente e a confirmação da assinatura.

O custo dessa escolha é real e não escondemos: manter um nó no ar dá trabalho de infraestrutura. Mas zero taxa por transação e zero dependência de terceiro valem esse custo.

## Um detalhe que ninguém conta: sincronizar não é linear

Uma curiosidade de quem já sincronizou um nó do zero: a barra de progresso não anda no ritmo que parece.

Os blocos mais antigos do Bitcoin, de 2009 a por volta de 2016, são pequenos, com poucas transações, e passam rápido. A partir da era SegWit, os blocos ficam muito mais densos, com muito mais transações cada um. Boa parte do trabalho real de validação está concentrada nos anos mais recentes, não distribuída de forma igual ao longo do tempo.

Na prática, ver o progresso em 20%, 30%, sem parecer avançar rápido, não é sinal de problema. É o formato natural da curva. Os blocos que faltam são, em geral, mais pesados que os que já passaram.

## O custo de infraestrutura, sem fantasia

Não contratamos nenhum servidor novo para isso. O nó roda em capacidade que já existia no nosso cluster de produção. Em números: cerca de 75 GB de disco reservados, já que o nó é pruned e descarta blocos antigos já validados; entre 1 e 4 núcleos de CPU, dependendo da fase; entre 2 e 5,5 GB de memória.

Nada disso representa uma conta nova. É capacidade existente sendo usada com um propósito específico: verificar dinheiro real, sem intermediário.

## Onde estamos agora

No momento em que este texto foi publicado, nosso nó estava em 34,8% de sincronização, validando blocos de janeiro de 2020. Ainda falta a parte mais densa da cadeia, a mais recente.

Quando ele alcançar o topo e o primeiro pagamento real passar pela nossa própria infraestrutura, do início ao fim, sem intermediário, contamos a próxima parte.
