---
title: 'Uma semana com o livro aberto: o que a revisão do Robson ensinou'
date: '2026-10-13'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, trading, risco, observabilidade, event-sourcing, operações, engenharia]
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-13-uma-semana-com-o-livro-aberto-v1.png'
excerpt: 'Revisamos o Robson com uma posição real aberta, corrigimos seis defeitos em três dias e fizemos sete deploys sem tocar na operação. O que encontramos diz mais sobre evidência do que sobre código.'
---

# Uma semana com o livro aberto

Virou o mês. O operador do Robson tinha feito algumas operações em outubro, uma delas ainda aberta, e pediu uma revisão. Não uma auditoria de código em laboratório: uma revisão do sistema como ele estava, com dinheiro real em posição e o daemon rodando.

Essa condição muda o método. A primeira fonte de verdade não foi o repositório, foram os endpoints públicos de leitura do próprio daemon: estado da posição, orçamento do mês, métricas. Só depois o código, para explicar o que os números mostravam. Quando os dois discordaram, o número ganhou a discussão e o código ganhou um issue.

Em três dias saíram seis correções, sete deploys e quatorze itens de backlog. Nenhum deploy tocou na operação aberta. Este texto é sobre o que a revisão encontrou e sobre o que isso ensina a quem opera sistemas que não podem parar para ser consertados.

## Um vazamento de memória escondido num evento de auditoria

O daemon havia sido morto por falta de memória em agosto. O incidente estava registrado, com a causa em aberto: o processo crescia de 50 para 512 MiB em cerca de 55 horas, só enquanto havia posição ativa.

A causa estava num evento de auditoria. Cada negócio recebido da exchange gerava um registro de tick, dezenas por segundo em momentos de volume. Esse registro ia para o event log, como desenhado, e também para um vetor em memória que nada no runtime lia. Quando a conexão por WebSocket entrou em produção, meses antes, a taxa de ticks subiu cerca de cem vezes, e a premissa documentada de "setenta mil linhas por mês" virou setenta mil por hora.

A correção tem três partes: o vetor deixou de reter esse tipo de evento, a emissão passou a ser limitada a um tick por posição a cada vinte segundos sem perder nenhum tick que acompanhe uma saída ou um avanço do stop, e o feed do painel deixou de mostrar ticks. A lição é simples de enunciar e fácil de esquecer: telemetria de auditoria não é de graça, e uma mudança de transporte pode invalidar uma premissa de volume sem que ninguém a reveja.

## Um orçamento que só enxergava o passado

O Robson limita a perda mensal em 4% do capital base, medida como devolução a partir do pico de equity do mês. O pico inclui o lucro não realizado das posições abertas. A implementação, porém, avaliava a posição aberta pelo preço gravado no último avanço do stop, não pelo preço de mercado.

Enquanto o daemon não reinicia, o efeito é discreto: o pico sobe em degraus e a devolução dentro de uma operação não aparece. Num restart, o preço gravado volta para a entrada, o equity do mês desaba para o realizado e o painel mostra uma devolução que nunca aconteceu. Durante a revisão isso chegou a 83% do orçamento, com zero slots livres, enquanto a posição aberta estava no melhor momento dela. Doze dólares a mais no pico teriam disparado o halt mensal sobre um lucro que estava na tela.

A correção marca a posição aberta pelo último preço recebido do mercado. Depois do deploy, a devolução caiu de 83% para 10% dez segundos depois de o processo subir. A lição: um número calculado a partir de um snapshot tirado na hora errada não está desatualizado, está errado, e a diferença só aparece quando o sistema reinicia.

## O stop que não seguiu

Quando o stop avança, o daemon coloca a ordem nova na exchange e cancela a antiga, nessa ordem, para nunca ficar sem proteção. Se a colocação falhar, a ordem antiga continua viva e o evento de falha fica registrado. Até aí, correto.

O problema estava numa chave de idempotência. O avanço do stop era registrado como emitido mesmo quando a perna da exchange falhava, então o motor nunca tentava de novo. A ordem na exchange podia ficar um degrau inteiro atrás do stop de software até o próximo avanço ou um restart. Com o daemon de pé, nenhuma perda; com o daemon fora, exposição de uma span.

A correção lembra a posição e repete a colocação com intervalo mínimo de trinta segundos até a exchange aceitar. A lição: idempotência protege contra repetição, mas também esconde falha, e a chave precisa representar o resultado que importa, não a intenção.

## O que o painel não dizia

Três achados eram só de visibilidade, e nenhum era pequeno.

O badge de conexão nascia em "STALE, reconnecting" em toda carga de página, porque o cliente só avisava a interface nas reconexões, nunca na primeira conexão. Quatro lançamentos de income da exchange sem posição correspondente bloqueavam, em silêncio, a recalibração automática do capital base; o contador existia na API e ninguém o renderizava. E dois arms consecutivos receberam stops de fallback por ATR, a 0,15% e 0,26% do preço, em um sábado parado. O primeiro foi estopado pelo ruído 25 segundos depois do preenchimento. O sistema fez exatamente o que a política manda; o operador não tinha como ver qual política estava em uso.

Hoje o card mostra o método e a confiança do stop técnico, uma linha de degrau da régua de trailing, e o painel exibe os incomes pendentes. Nada disso muda uma decisão do motor. Tudo isso muda a decisão do operador antes de confirmar o arm.

## Merge é deploy, e o caminho precisa ser verificado

No Robson, mergear na branch principal publica a imagem e reinicia o daemon. Isso é deliberado e está documentado. Dois tropeços de processo mostraram que o caminho precisa ser verificado antes de ser usado.

O passo de promoção da imagem editava um arquivo que, semanas antes, tinha virado um placeholder. O próximo merge de backend não teria deployado nada, e nada teria avisado. Foi o primeiro PR da sequência. E um PR empilhado sobre outro foi mergeado dentro da branch base em vez da principal, porque a base não foi apagada após o merge e a plataforma não redirecionou. Custou uma hora e um PR substituto.

A regra que ficou: apagar a branch no merge, evitar pilhas, e tratar deploys de backend como restarts com posição aberta, que são seguros porque a ordem de proteção está na exchange, mas são restarts.

## O que ficou aberto

Parte do que a revisão encontrou é política, não defeito, e não cabe corrigir em código: se um stop de fallback deve exigir confirmação humana; se lançamentos órfãos de comissão devem vetar a recalibração por transferência confirmada; se os endpoints de leitura devem continuar públicos. Esses itens viraram issues com a evidência anexada, para serem decididos com calma.

A revisão também deixou uma medida simples de maturidade. Antes dela, a hipótese de que o daemon tinha um vazamento era um palpite num comentário de commit. Depois dela, é um mecanismo nomeado, com causa, correção e uma lista de verificação em produção. A diferença entre as duas coisas não está no modelo que escreveu o código. Está em ter olhado o sistema com o livro aberto.
