---
title: 'Auditoria não é telemetria'
date: '2026-08-01'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, event-sourcing, postgres, auditoria, robson]
excerpt: 'O banco do nosso sistema de trading pesava 17 GB. A auditoria real cabia em menos de 1 MB. A história de como 96% de um event log virou ruído, o que fizemos para limpar sem perder uma linha de evidência, e a regra que adotamos para o problema nunca voltar.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-01-auditoria-ou-telemetria.png'
---

O banco de dados do Robson, nosso sistema de trading, pesava 17 gigabytes. Quando medimos o que ali dentro era auditoria de verdade, cada posição armada, cada entrada executada, cada stop movido, cada fechamento de mês, o total coube em menos de 1 megabyte.

Os outros 96% eram outra coisa. E a diferença entre essas duas categorias é o assunto deste texto.

## Como descobrimos

Na virada de julho para agosto, aproveitamos uma janela sem posições abertas para auditar o banco de ponta a ponta. A distribuição de tamanho contou a história sozinha: uma única partição mensal do event log ocupava 10 GB. Dentro dela, 6,5 milhões de eventos do mesmo tipo, gravados em apenas cinco dias.

O tipo era `QUERY_STATE_CHANGED`: o registro de transição de estado das queries governadas do motor de execução. No nosso desenho, toda ação que o sistema considera passa por uma query com ciclo de vida auditável: aceita, avaliada pelo motor de risco, executada ou negada. Isso vale para uma entrada em posição e vale também para a rotina mais banal do sistema: a query que cada tick de mercado dispara para cada posição ativa, dezenas de vezes por minuto.

E aí estava o problema. Cada uma dessas queries rotineiras gerava três ou mais eventos permanentes no event log. Por posição. Por tick. Indefinidamente.

## A armadilha do event sourcing

Event sourcing cria uma cultura saudável: o event log é sagrado, nada se apaga, tudo se prova. Mas essa mesma cultura tem uma armadilha simétrica: se o event log é sagrado, tudo parece merecer virar evento.

Não merece. O teste que passamos a aplicar é simples: **este registro prova uma decisão ou apenas descreve um instante?** A entrada que o motor de risco negou prova uma decisão, e fica para sempre. A query de rotina que completou seu ciclo sem nada a dizer apenas descreve um instante, e para isso existem logs estruturados, que custam quase nada e expiram sozinhos.

A prova de que o volume era ruído: as ações reais que essas queries governam, mover um stop, sair de uma posição, já emitem seus próprios eventos de domínio. A trilha de auditoria do trading estava completa sem nenhum daqueles milhões de registros. Um mês inteiro de operação real, com posições, stops e fechamentos, coube em algumas centenas de eventos.

## Limpar sem perder evidência

Deletar dados de um sistema auditável exige mais disciplina do que acumulá-los. A sequência que executamos:

1. **Arquivo antes de qualquer delete.** Dump completo das partições afetadas, com verificação de integridade em três camadas: catálogo do arquivo, descompressão integral e comparação de checksums após o upload para armazenamento frio.
2. **Deletes por tipo de evento, com contagens exatas.** A partição de abril tinha 6.545.132 linhas; depois da limpeza, 12. As doze que provavam alguma coisa.
3. **Compactação física** para devolver o espaço ao sistema operacional, e verificação de que o daemon de trading atravessou tudo sem um erro sequer.

Resultado: 17 GB viraram 310 MB, com a auditoria intacta e o arquivo completo preservado fora do banco quente, com checksums publicados.

## A regra, codificada

Limpeza sem prevenção é agendamento do próximo incidente. No mesmo dia, a regra virou código e decisão de arquitetura registrada: transições rotineiras de queries de tick não entram mais no event log. Desfechos governados continuam entrando sempre: negações, falhas e expirações são evidência, não ruído. E uma rotina semanal de retenção agora poda as tabelas auxiliares que cresciam junto.

O crescimento projetado do banco caiu de gigabytes por mês para megabytes por mês, sem perder um bit de capacidade de prova.

## O bônus que a investigação pagou

No meio do trabalho, um dos nossos dumps morreu no meio do caminho. Investigando, descobrimos que a atualização automática de pacotes do sistema operacional tinha reiniciado o banco de produção naquele exato minuto, como fazia potencialmente todos os dias, na mesma janela de horário, sempre que uma biblioteca era atualizada.

O sistema absorveu o reinício sem dano, e é para isso que ele foi desenhado. Mas banco de produção de sistema financeiro não reinicia por efeito colateral de rotina de pacotes: reinicia quando a operação decide. Movemos essas atualizações para janelas planejadas no mesmo dia, também como código.

É o padrão que mais se repete na nossa engenharia: o problema que você investiga a fundo quase sempre revela o problema vizinho que ninguém tinha visto.

## O que fica

Sistemas que precisam durar anos acumulam duas coisas: evidência e entulho. A diferença entre as duas não é técnica, é uma decisão de projeto: o que este sistema precisa ser capaz de provar daqui a cinco anos?

O que prova, guarda-se para sempre, com backup verificado. O que apenas descreve, expira. Confundir as duas categorias custa 17 gigabytes para descobrir.
