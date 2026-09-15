---
title: 'Rigor demais também é um bug'
date: '2026-08-08'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, dados, robson, qualidade, agentes]
excerpt: 'De manhã publicamos a história do revisor que rejeitou o próprio texto. À tarde veio o capítulo seguinte: um exportador de dados inteiro construído em um dia, provado byte a byte contra vetores de referência, com mais de cem testes verdes. E o achado mais valioso do dia veio de um segundo revisor, gêmeo do implementador, que encontrou o defeito que nenhum teste da suíte pegaria: o código estava rigoroso demais para o mundo real.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-08-rigor-demais-tambem-e-um-bug-v2.png'
---

De manhã publicamos aqui a história do revisor que rejeitou o texto que ele mesmo tinha ditado. À tarde, o processo produziu o capítulo seguinte, e ele merece registro próprio: construímos em um dia o caminho de publicação inteiro do exportador de dados frios do Robson, nosso motor de execução e risco que opera capital real, e a descoberta mais importante do dia não foi nada do que construímos. Foi um defeito que todos os nossos testes verdes eram estruturalmente incapazes de ver.

## Um dia de construção provada

O exportador é a peça que copia, uma vez por dia, o histórico de eventos e o livro de receitas do Robson para armazenamento frio de longa retenção. É a primeira peça do pipeline bronze que descrevemos no artigo do plano que encolheu, e vive no rbx-data, o domínio de dados da RBX. A exigência central: os bytes publicados precisam ser reproduzíveis. A mesma janela de dados, exportada duas vezes, tem que produzir exatamente o mesmo objeto, byte por byte, para que reexecuções sejam inofensivas e qualquer divergência seja um alarme.

Cada camada nasceu contra uma prova. O escritor canônico foi validado contra vetores de referência versionados, e uma reimplementação independente em outra linguagem produz os mesmos bytes, o que impede o teste de ser cúmplice do código que testa. A compressão tem cada parâmetro fixado por contrato, e o binário se recusa a rodar se a biblioteca vinculada não for exatamente a versão pinada. A selagem de cada janela é protegida por uma cerca formal contra transações atrasadas, verificada antes e depois de cada cópia. No fim do dia: mais de cem testes verdes, incluindo cenários de queda em cada ponto do protocolo, e uma bateria ao vivo contra um banco de dados real efêmero.

## O revisor gêmeo

Com tudo verde, aplicamos o modelo econômico que descrevemos de manhã: um único passe crítico e denso. Quem implementou foi o Claude Fable 5, da Anthropic, dentro do Claude Code; o revisor foi uma segunda instância do mesmo Fable 5, sem nenhum contexto compartilhado, com referências pinadas e um mandato explícito: não acredite em nada, re-verifique tudo.

O revisor levou o mandato ao pé da letra. Rodou os gates por conta própria. Comparou, hash a hash, os vetores de referência copiados contra a fonte original. Reproduziu um quadro comprimido usando a ferramenta de linha de comando do sistema, uma implementação que não compartilha uma linha de código com a nossa, e conferiu que os bytes batiam. E então fez a única coisa que nenhum dos nossos testes fazia: leu o código do produtor dos dados, do outro lado da fronteira.

## O defeito que os testes verdes escondiam

A regra em questão parecia inatacável. Certos campos dos eventos carregam códigos de máquina que precisam ser validados contra listas fechadas antes de sair; um campo que não dá para validar é um campo que não pode ser exportado; logo, se o caminho até o campo não existe no dado, aborte. Rigor máximo, direção segura. Todos os testes confirmavam: dado malformado, execução abortada, nada errado publicado.

O que o revisor encontrou lendo o produtor: o serializador do Robson omite listas vazias por completo. Quando não há nada a relatar, o caso mais comum do mundo real, a chave simplesmente não existe no documento. Para o nosso validador, chave ausente era caminho impossível de validar, e caminho impossível de validar era abortar. Tradução: a primeira janela real contendo o evento mais corriqueiro do sistema teria travado o pipeline para sempre. Nenhum byte errado publicado, nenhum dado corrompido, e ainda assim um fracasso completo, porque um exportador que nunca sela não exporta nada.

O defeito não estava no que o código fazia. Estava no que o mundo faz. Mais de cem testes mediam o código contra a especificação; nenhum media a especificação contra o produtor vivo. O implementador tratava o outro lado como caixa-preta bem documentada. O revisor abriu a caixa.

## Rigor é um dial, não uma virtude

A correção foi pequena e cirúrgica: ausência de uma coleção inteira passou a valer como coleção vazia, porque zero valores para validar são zero valores para exportar, e nada pode ser contrabandeado através de um campo que não existe. Todo o resto continuou estrito: campo escalar ausente segue sendo drift, coleção presente com o tipo errado segue sendo drift, valor fora da lista segue sendo fatal.

A lição que fica é desconfortável para quem gosta de regras absolutas: rigor excessivo é um modo de falha tão real quanto permissividade. Falhar fechado protege os dados, mas não protege o objetivo; um sistema que se recusa a operar diante do caso mais comum é tão quebrado quanto um que aceita qualquer coisa, só quebra com mais dignidade. O ponto certo do dial não se encontra olhando para o próprio código. Encontra-se olhando para o vizinho.

## O que mais o passe pagou

O mesmo relatório trouxe dois reforços de resiliência que aceitamos na hora. Uma retomada após queda no pior momento possível agora encontra a publicação anterior e a verifica por inteiro em vez de refazer o trabalho, o que elimina um cenário futuro em que refazer seria impossível. E a leitura do relógio do banco passou a ser persistida a cada verificação, não só nas bem-sucedidas, fechando uma fresta estreita em que um relógio regredido poderia passar despercebido entre duas execuções.

Tudo aplicado, provado de novo, e integrado no mesmo dia. Como sempre: nada roda contra produção até a janela do operador, e a última palavra continua humana. Duas instâncias do mesmo Claude Fable 5, em papéis opostos, encontraram juntas o que nenhuma encontraria sozinha. Não porque uma seja mais inteligente que a outra, e sim porque só uma delas tinha a obrigação de duvidar.
