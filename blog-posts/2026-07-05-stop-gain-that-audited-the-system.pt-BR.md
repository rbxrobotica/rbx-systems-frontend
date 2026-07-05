---
title: 'O stop gain que auditou o sistema'
date: '2026-07-05'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, risco, confiabilidade, engenharia, trading]
excerpt: 'Um stop de lucro executado durante um deploy expôs dois modos de falha invisíveis e mudou a política de risco do Robson. O relato e as decisões estão aqui.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-05-stop-gain-that-audited-the-system.jpg'
---

Às 07h50 UTC de hoje, um short em BTCUSDT fechou com lucro. A ordem que fechou não veio do daemon do Robson: veio do stop de seguro que descansa na exchange, executando sozinho enquanto o software estava no meio de uma janela de deploy. O desenho de duas camadas que nasceu do [incidente de junho](/blog/2026-07-03-stops-that-survive-failures) funcionou pela primeira vez na direção do lucro. Entrada a 63.145,20, saída a 62.935, ganho líquido pequeno e limpo.

Um sistema saudável teria encerrado o assunto aí. Nós auditamos a vitória com o mesmo rigor de uma derrota, e a auditoria encontrou dois problemas que uma perda talvez nunca tivesse mostrado.

## Primeiro achado: o feed que emudece

Na madrugada anterior, o WebSocket de preços entrou num estado peculiar: a conexão abria com sucesso e não entregava nenhum tick. O watchdog detectava 90 segundos de silêncio e reconectava, e a nova conexão nascia igualmente muda. Quarenta e cinco ciclos, quase duas horas, enquanto o preço cruzava o alvo que deveria avançar o trailing stop. O motor de trailing é alimentado por ticks; sem ticks, ele congela com o daemon aparentemente saudável.

A perda máxima nunca esteve em risco: o stop de seguro da exchange não depende do nosso feed. Mas a proteção do lucro ficou cega, e cegueira silenciosa é a pior categoria de falha, porque nenhum painel fica vermelho.

A correção virou o ADR-0044. Quando o feed emudece além do watchdog e existe posição aberta, um fallback passa a consultar o preço por REST e alimenta o mesmo pipeline de dados, com a mesma matemática de trailing. A equivalência entre as fontes não foi assumida: foi provada com testes de propriedade, que bombardeiam o motor com sequências duplicadas e reordenadas de preços e exigem que o stop final seja idêntico. O trailing discreto é uma função pura do extremo favorável, e por isso entrega duplicada não aplica passo duplo. A propriedade estava lá desde o início; agora ela está escrita e verificada a cada build.

## Segundo achado: dinheiro entrando pela porta errada

O lucro do stop chegou à carteira, mas o fechamento contábil da posição travou aguardando evidência real da execução. Um minuto depois, o detector de drift da conta comparou o saldo esperado com o saldo real, encontrou uma diferença positiva sem explicação e a absorveu no capital base, rotulada como mudança manual da conta.

Cada passo era localmente razoável. A composição era errada: um resultado governado do próprio sistema entrou na contabilidade pela porta dos fundos, com o rótulo errado, e os livros fecharam. E livros que fecham removem a pressão de consertar a reconciliação travada, que era o problema de verdade.

Ficou pior quando fizemos a pergunta seguinte: e com dez pares operando ao mesmo tempo? O saldo da carteira é um número só. As causas de uma diferença são muitas: um fill não reconciliado aqui, funding acolá, uma taxa, um depósito. Um resíduo escalar não se decompõe depois do fato. É o nível errado de agregação para fazer contabilidade.

A decisão virou o ADR-0045. A fonte de verdade do dinheiro passa a ser o extrato tipado da exchange, movimento a movimento, casado item a item contra o log de eventos governado. O detector de drift foi rebaixado para o que sempre deveria ter sido: um checksum. Resíduo diferente de zero é alarme com lista de itens não casados, nunca um lançamento contábil. Um hotfix imediato fechou a janela do incidente: nenhuma recalibração automática enquanto houver fechamento aguardando evidência.

## A reflexão que mudou a política: e se o mês fosse uma posição?

A auditoria do dia terminou numa pergunta de produto. O limite mensal de perda do Robson era bruto: perdas consomem os 4 por cento, ganhos nunca devolvem. Um mês vitorioso ficava sem munição. A primeira ideia, contabilidade líquida simples, tinha um defeito escondido: quem ganha 3 por cento no início do mês poderia devolver 7 até o piso. O lucro realizado do mês ficava desprotegido, justamente o que os trailing stops evitam dentro de cada posição.

A resposta foi aplicar ao mês o mesmo conceito que protege cada operação. O ADR-0046 define o limite mensal como um trailing sobre o topo da equity do mês: resultado realizado, resultado não realizado e o risco reservado até os stops das posições abertas, tudo na mesma conta. Ganhos reais rearmam a capacidade de operar e, ao mesmo tempo, elevam o piso. A promessa que emerge é a mais forte que o produto já teve:

Você nunca devolve mais de 4 por cento do topo do mês.

O limite de 1 por cento por operação continua intocado como limite unitário. A mesma ideia agora se sustenta em três escalas: o stop protege a operação, o trailing protege o lucro da posição, o trailing mensal protege o lucro do mês.

## O que fica

Três lições saíram deste ciclo e já estão em produção, com as decisões registradas em ADRs antes do código:

- Silêncio precisa ser visível. Um feed mudo, um stream sem batimento, uma reconciliação travada: todo canal que pode falar precisa de um jeito auditável de dizer que parou de falar. O painel agora carrega um indicador de frescor dos dados em tempo real, e as métricas contam cada conexão e cada silêncio.
- Resíduo é pergunta, não lançamento. Dinheiro sem explicação tipada nunca mais entra nos livros automaticamente. Contabilidade que fecha sozinha esconde exatamente aquilo que deveria doer.
- Um limite confiável vale em todas as escalas. Se o conceito de trailing é bom para uma posição, ele precisa sobreviver à pergunta: e para o mês inteiro? Quando a resposta muda a arquitetura, a auditoria valeu.

Todo o ciclo de hoje, do stop gain às três decisões, foi implementado por agentes de engenharia operando sob guardrails vinculantes e revisão humana linha a linha, com os scanners de segurança do pipeline pagando o próprio custo no primeiro dia ao encontrar e corrigir vulnerabilidades reais de dependências. O sistema que [ganhou capacidade de operar mais](/blog/2026-07-05-saved-risk-extra-operation) pela manhã terminou o dia com uma promessa mais forte sobre o que nunca vai devolver.
