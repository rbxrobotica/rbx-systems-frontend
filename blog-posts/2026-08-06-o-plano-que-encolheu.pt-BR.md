---
title: 'O plano que encolheu'
date: '2026-08-06'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, dados, adr, robson, observabilidade]
excerpt: 'Escrevemos um plano de plataforma de dados para o Robson: dezesseis métricas, oito tabelas analíticas, warehouse, dashboards. Entregamos o plano a um segundo modelo com uma instrução de uma linha: proteja a produção. O veredito foi NO-GO, e cada corte que ele propôs sobreviveu à verificação no código. O que sobrou coube em cinco invariantes, um contrato de duas tabelas e um ensaio com números. A história de como um plano bom fica melhor encolhendo.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-06-o-plano-que-encolheu-v2.png'
---

Um sistema de trading rodando em produção gera um tipo de tentação específica. Cada evento é precioso, cada decisão é auditável, e a conclusão parece óbvia: isso merece uma plataforma de dados. Bronze, silver, catálogo, warehouse, dashboards. Nós escrevemos esse plano, com o Claude Fable 5, da Anthropic, na autoria. Dezesseis métricas detalhadas, oito conjuntos analíticos, um exportador, transformações, alertas derivados. Tecnicamente correto, estrategicamente justificado, e errado do jeito mais difícil de ver de dentro.

Há um contexto que torna a pergunta legítima. Contamos aqui, no início do mês, a decisão de que o event log do Robson é auditoria, e telemetria é outra coisa: o runtime apaga deliberadamente a própria história operacional. Retenção poda tabelas auxiliares, logs expiram, e o que sobra é o essencial auditável. É a decisão certa para um banco de produção enxuto, e cria uma dívida real: perguntas retrospectivas sobre risco e execução hoje só se respondem com consultas diretas ao banco que sustenta capital real. Alguma memória durável fora dali é necessária. A questão nunca foi se; era quanto.

## O revisor que disse menos

Antes de escrever qualquer código, entregamos o plano a um segundo modelo de fronteira em papel adversarial, o Codex da OpenAI rodando GPT-5.6 Sol em esforço máximo de raciocínio, com as prioridades do operador em quatro linhas: organização, limpeza do que é legado, foco no necessário, e nada que toque a produção. O veredito abriu com duas palavras: NO-GO.

O argumento central não era que as perguntas estavam erradas. Era que a resposta tinha superfície demais. Role nova no banco compartilhado, job agendado lendo produção, escrita analítica no mesmo servidor físico que serve o runtime, oito tabelas derivadas, dashboards. Para um sistema estável operando dinheiro real, cada um desses itens é um risco comprado; o plano precisava provar que cada um mudava alguma decisão operacional. A maioria mudava pouco.

E os achados específicos doeram na medida certa, porque cada um foi re-verificado no código antes de ser aceito. As métricas de saúde do feed de mercado que o plano propunha construir já existiam, exportadas e sem nenhuma regra de alerta usando. A comparação entre os dois modelos de orçamento mensal, que o plano queria recomputar na camada analítica, já rodava nativa no daemon, em shadow; reimplementar seria criar duas verdades. O caminho de provisionamento que o plano ia reutilizar podia reiniciar o banco de produção compartilhado como efeito colateral de editar uma linha de configuração. E a imagem implantada em produção não era o branch que o plano tinha analisado, o que rebaixa qualquer afirmação sobre comportamento vivo a hipótese.

## O corte

O plano reescrito separou três coisas que a primeira versão misturava. Alertas em tempo real ficam onde já vivem, nas métricas e regras existentes, porque lote nunca é mecanismo de proteção: um invariante de segurança verificado a cada hora não é um invariante, é um relatório. Memória fria virou o mínimo que cumpre o propósito: duas tabelas, as duas que são a auditoria financeira do sistema, copiadas de forma imutável para armazenamento externo que sobrevive à perda de qualquer servidor. E a camada analítica inteira, as dezesseis métricas, os oito conjuntos, os dashboards, saiu da autorização: volta quando alguma pergunta recorrente provar que alertas e consultas forenses não bastam.

As fronteiras viraram decisão escrita, com as linhas que não se cruzam: nada derivado dos dados volta a escrever no runtime, nunca; e o pipeline mede se o Robson fez o que prometeu, jamais se deveria ter entrado. Análise de oportunidade não é análise de execução, e um sistema de gestão de risco não vira autotrader por acúmulo de dashboards.

## O ensaio antes do pedido

Restava uma pergunta honesta: as consultas do exportador são inofensivas? Em vez de responder com adjetivos, montamos um ensaio totalmente offline. Banco efêmero local, o schema real do Robson aplicado migração por migração, e um dataset sintético reproduzindo o pior caso conhecido: a partição patológica de um vírgula quatro gigabytes da era em que o event log ainda guardava telemetria. As consultas candidatas rodaram sob os limites do contrato, timeout de cinco segundos, memória curta, uma conexão. O pior caso custou duzentos e dezesseis milissegundos. O caso realista, sete. A janela selada provou determinismo com hashes idênticos em execuções repetidas, e um índice de quarenta kilobytes ficou documentado como otimização opcional se algum dia for necessária. O go da próxima fase, quando vier, será uma decisão com números na mesa.

## O que um dia rendeu

Do veredito ao fim do dia: a decisão de fronteira formalizada, o contrato de duas tabelas publicado no repositório do Robson, os restos do protótipo de data lake de uma era anterior removidos do GitOps depois de confirmar que nada os referenciava, três regras de alerta novas sobre as métricas que existiam descobertas, e duas issues nomeando exatamente o que ainda não se consegue alertar. Nenhuma linha do runtime mudou. Nenhuma conexão nova toca o banco.

## O critério que fica

Um plano de dados para um sistema crítico não se avalia pelo que consegue medir; se avalia pelo que cada medição muda e pelo que cada acesso custa. A revisão adversarial não enfraqueceu o plano, ela o destilou: o que sobreviveu cabe numa página e cada item sustenta a própria existência. A plataforma de dados mais barata é a que você ainda não construiu, e a segunda mais barata é a que encolheu até só restar o que uma decisão real exige.
