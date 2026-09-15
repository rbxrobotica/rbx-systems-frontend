---
title: 'Uma régua só'
date: '2026-08-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, risco, adr, robson, confiabilidade]
excerpt: 'O operador olhou uma tela e fez uma pergunta de uma linha: por que o stop está três vezes mais longe que o primeiro alvo? A resposta revelou duas réguas convivendo no mesmo sistema, uma variável de ambiente que criava dois produtos num binário só, e terminou no maior trabalho de engenharia do Robson desde a reescrita em Rust. Incluindo o dia em que a correção quase foi pior que o defeito.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-04-uma-regua-so-v2.png'
---

De manhã, contamos aqui a história do slot que sumiu: um número de painel que estava certo pela regra errada. À tarde, o mesmo operador, olhando uma posição real, fez a segunda pergunta de uma linha do dia: por que a distância do stop é três vezes a distância do primeiro alvo?

A pergunta parece cosmética. Não é. Num sistema de risco, distâncias são a própria política.

## Duas réguas

O Robson trabalha com um conceito chamado span, o palmo: a distância do stop técnico no momento da entrada. É a unidade de tudo. O trailing não desliza continuamente atrás do preço; anda em degraus discretos de um span. Cada alvo mostrado no painel é o gatilho do próximo degrau. O primeiro degrau trava a saída perto do ponto de entrada. Uma unidade de risco, movimento e decisão.

Só que a investigação mostrou que havia duas unidades. A escada de degraus andava na régua do nível técnico cru. O stop executável, o que de fato dispara na exchange, era composto por cima: nível estrutural mais fundo quando a análise mandava, mais um guard de entrada, mais o buffer. Na posição que motivou a pergunta, essa composição somou quase três palmos. Na posição seguinte, do mesmo dia, apenas um e pouco. A geometria variava arm a arm, e o dinheiro em risco era medido por uma régua enquanto os degraus andavam por outra.

## O buffer não é política de distância

A filosofia do operador para o buffer é precisa: ele existe apenas para evitar o padrão de caça ao stop, ordens que descansam exatamente sobre o ponto técnico onde todo mundo colocou a mesma ordem. Um empurrãozinho além do nível, nada mais. O buffer não pode alterar a política de distância; e se o risco real da posição inclui o buffer, então a régua de tudo tem que incluir o buffer.

Dessa frase saiu a decisão versionada: o span passa a ser a distância do entry ao stop executável, calculado uma vez na admissão da entrada, gravado no event log, e imutável pela vida da posição. Reinício de processo, mudança de configuração, atualização de metadados da exchange: nada re-deriva o número. O replay lê o que foi gravado. Escada, alvos, risco reservado e dimensionamento passam a compartilhar essa única medida.

## Um Robson só

No caminho, uma segunda decisão. A derivação de stop era selecionável por variável de ambiente, um mecanismo de rollout que nunca chegou a ser usado. O operador vetou o conceito: configuração de deploy não pode definir qual produto está rodando. A variável foi removida, o valor nunca usado foi deletado, e antes de deletar, provamos com consultas ao event log de todos os ambientes que o valor nunca havia sido persistido em lugar nenhum: zero ocorrências, evidência versionada junto com a decisão. Mudança de comportamento de risco, daqui em diante, só por decisão escrita e revisada. Posições antigas guardam para sempre o carimbo da política que as criou, e são geridas por ela até fecharem.

## A revisão que valeu o dia

A implementação passou por três ciclos de revisão adversarial, com dois modelos de fronteira em papéis opostos: um implementando, outro atacando. O revisor derrubou a primeira versão com um achado fino: a troca ingênua da régua não funcionaria, porque a escada reconstruía o stop técnico e o resolver aplicava o buffer de novo por cima. A mecânica exata teve que ser especificada degrau por degrau, com a regra de que o buffer é aplicado exatamente uma vez, por um único resolvedor, em todas as superfícies.

O segundo ciclo pegou o que a gente mais quer contar. A correção de um dos achados criou um defeito pior que o original: se o sistema não conseguisse precificar o risco de uma posição, por uma falha transitória de rede na consulta de metadados, a nova lógica travava o freio mensal e fechava o livro inteiro a mercado. O revisor pegou isso no passe de fechamento, antes de qualquer merge. A regra que ficou escrita: quando o sistema não consegue precificar risco, ele para de aceitar risco novo; jamais destrói a proteção que já existe na exchange. Bloquear entradas é prudência; liquidar por incerteza seria o software transformando uma dúvida em prejuízo.

Do mesmo ciclo saíram as outras defesas: o binário novo se recusa a subir contra um schema antigo, em vez de subir cego com o livro invisível; um fill real nunca fica sem stop de proteção, mesmo se a evidência persistida estiver corrompida; e a leitura de status não escreve nada em lugar nenhum.

## O que mudou, medido

Cinco commits, dezenas de arquivos entre domínio, engine, daemon, banco e interface, oitocentos e setenta e nove testes verdes incluindo os de banco real, e uma posição viva que atravessou o deploy intacta, gerida pela política com que nasceu. O primeiro armamento sob a régua nova mostrará no painel o que a filosofia sempre pediu: stop a um palmo do entry, primeiro alvo a um palmo do entry, o mesmo palmo.

## O critério que fica

Ontem escrevemos que um número num painel de risco é um contrato. Hoje, o complemento: um contrato se mede com uma régua só. Quando o preço na tela, o risco reservado, o degrau da escada e a ordem na exchange são a mesma medida, o sistema inteiro pode ser auditado com uma pergunta: qual é o span? Se a resposta precisa de duas réguas, ainda há trabalho.
