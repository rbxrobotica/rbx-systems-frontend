---
title: 'Atualização de engenharia: o briefing que um estranho conseguiria rodar'
date: '2026-07-07'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, engenharia, confiabilidade, agentes, trading]
excerpt: 'Uma correção de reconciliação levou a um segundo bug que ninguém pediu para encontrar, e o próximo capítulo saiu como um briefing escrito para um agente sem memória do dia. Rodou mesmo assim.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-07-the-brief-a-stranger-could-run.jpg'
---

O post de domingo [fechou com uma promessa](/blog/2026-07-06-fallback-debuts-in-production): o ledger de income tipado, completando a regra de que dinheiro sem explicação nunca mais entra nos livros sozinho. Esta é a atualização de como essa promessa saiu do papel, e ela começa em outro lugar completamente diferente.

## Um segundo bug encontrado ao auditar o primeiro

O dia abriu com uma reconciliação travada: uma posição fechada de verdade na exchange, mas o software nunca soube disso, porque a janela de busca de evidência ficava se reancorando em "agora" a cada nova tentativa e nunca conseguia olhar longe o suficiente pra achar a operação real de fechamento. A correção foi pequena, poucas linhas removidas de um caminho de limpeza que estava apagando um estado que deveria ter deixado em paz. Os testes passaram, a correção foi ao ar, a posição se resolveu.

Ninguém pediu o que aconteceu depois. Depois do deploy, uma checagem de sanidade de rotina na posição recém-reiniciada revelou uma quantidade que não batia com a exchange. Não era bug de exibição: o próprio valor armazenado tinha se desviado, maior do que a exchange realmente detinha. A trilha levou a um segundo defeito, sem relação com o primeiro: o handler que registra um preenchimento atualiza preço e stop, mas nunca tinha aprendido a sobrescrever o tamanho *pedido* pelo tamanho *real, confirmado pela exchange*. Sempre que a exchange arredondava uma ordem pro seu passo mínimo, o que ela faz rotineiramente, a diferença ficava pra sempre, silenciosa, até um reinício recarregá-la. Também corrigido, também testado contra um banco de dados real antes do merge, vermelho antes da correção e verde depois.

Dois bugs numa manhã, e o segundo só apareceu porque a primeira correção foi auditada em vez de simplesmente confiada.

## Verificar em vez de presumir

Mais tarde, um movimento brusco de preço levantou uma pergunta óbvia: o trailing stop reagiu certo? A resposta honesta exigiu puxar os candles reais e rodar pela fórmula de verdade, um modelo de degraus discretos que só avança em incrementos completos ancorados no preço de entrada, nunca no pico mais recente. O movimento nunca completou um degrau sequer. Não agir era a única ação correta, e o modelo dizia isso antes de qualquer um precisar chutar.

Um momento menor da mesma hora vale registrar. Uma busca em log pela atividade do monitor de posição voltou vazia, o que parecia exatamente uma parada. Não era: o monitor escreve no event log sob um nome que nunca aparece ao pé da letra nos logs do processo. O event log contava a história real, batendo a cada poucos segundos o tempo todo. A lição vale além dessa busca específica: quando uma checagem rápida e a fonte de verdade de um sistema discordam, confie na fonte de verdade, e diga com todas as letras quando sua primeira leitura estava errada.

## Escrever para um estranho

Com os incidentes fechados, o ledger de income era o próximo, e deliberadamente não foi escrito na hora. Virou um briefing de missão: um documento autocontido que presume que quem lê não se lembra de nada do dia.

Essa restrição muda o que um briefing precisa conter. Não só a decisão de design, mas a forma atual e verificada do código ao redor dela: qual arquivo já carrega peso demais para mais uma adição, qual módulo existente compartilha nome com o conceito novo mas significa outra coisa, qual campo de vínculo os registros reais da exchange usam, confirmado lendo uma resposta ao vivo em vez de confiar num modelo do que a documentação dizia que deveria ser.

## O estranho morava a cinco minutos

O briefing foi escrito para qualquer um. Acabou entregue a um fork da própria conversa que tinha passado a manhã em bugs de reconciliação e quantidade, ramificado para carregar a parte pesada e iterativa do trabalho isolada: compilar, testar, corrigir, testar de novo. A conversa mãe ficou limpa e disponível para a próxima pergunta enquanto isso rodava em segundo plano.

A disciplina de autocontenção valeu de qualquer jeito. O valor dela nunca foi economizar uma reexplicação. É forçar cada suposição a virar texto onde pode ser checada antes que código seja escrito em cima dela.

## O passo zero se pagou na hora

A primeira instrução do briefing não era "escreva os tipos". Era: ler uma resposta real do endpoint de income da exchange antes de escrever um tipo sequer. Essa única leitura revelou algo que nenhuma discussão de design teria antecipado: a posição aberta já tinha pago taxas de funding, pequenas, sem nenhuma atribuição em lugar nenhum do sistema. Não era um custo escondido por decisão. Era um ponto cego que ninguém tinha olhado, tornado visível pela única ação com que todo plano para essa funcionalidade deveria ter começado.

## O que saiu do papel

Um ledger que reconcilia item a item contra os registros de income tipados da exchange, em vez de comparar totais de carteira. Taxas de funding passam a ser reconhecidas pela primeira vez. Transferências continuam sendo a única categoria autorizada a ajustar os livros automaticamente, e só quando explicam a diferença inteira. Tudo o mais vira um alarme nomeado e visível, nunca um chute absorvido em silêncio nos números. Nove testes, um para cada modo de falha documentado, checados contra um banco real antes do merge. Publicado, implantado e confirmado ao vivo dentro de uma hora.

## O que fica

Uma manhã, dois bugs encontrados por recusar confiar numa suíte de testes verde, um incidente ao vivo fechado lendo uma fonte de verdade em vez de um resultado de busca, e uma funcionalidade que saiu do papel a partir de um briefing que não presumiu nada e foi executado por quem chegou primeiro. O padrão se mantém independente de quem executa: declare o que você verificou, nomeie o que você não verificou, e deixe o próximo leitor, humano ou não, checar seu trabalho em vez da sua palavra.
