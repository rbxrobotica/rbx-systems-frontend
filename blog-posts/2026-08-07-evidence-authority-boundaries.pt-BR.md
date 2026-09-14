---
title: 'Evidência não é autoridade'
date: '2026-08-07'
author: 'Leandro Damasio'
authorRole: 'CEO, RBX Systems'
tags: [architecture, ai-governance, agentic-systems, distributed-systems, roi]
excerpt: 'Como separar avaliação, autorização, efeitos, fatos financeiros e atribuição de valor em sistemas agênticos autônomos.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-07-evidence-authority-boundaries.png'
---

Quanto mais capaz se torna um sistema de IA, menos útil é perguntar apenas se a resposta parece boa. A pergunta decisiva passa a ser outra: qual componente tem autoridade para afirmar que uma ação foi permitida, que um efeito realmente ocorreu, que ele produziu um fato financeiro e que esse fato pode ser atribuído ao sistema?

Essas afirmações parecem partes da mesma história, mas não são o mesmo registro. Quando uma arquitetura as comprime em um único evento, dashboard ou banco, ela cria uma ilusão perigosa de certeza. Uma recomendação passa a parecer autorização. Uma tentativa passa a parecer resultado. Um sinal de observabilidade passa a parecer prova durável. Uma correlação passa a parecer retorno financeiro.

Na RBX, estamos adotando uma regra simples para evitar esse colapso:

> Evidência informa uma decisão. Evidência não herda a autoridade da decisão que informa.

Essa regra orienta as fronteiras entre Verentir, Thalamus, os domínios que produzem efeitos, RBX Ledger, o RBX Yield proposto e Strategos. Ela também determina como pensamos outbox agêntico, modelos especializados, loops e graphs.

## Uma cadeia, vários fatos

Considere um modelo econômico que recomenda reduzir uma exposição, um agente que propõe renegociar um contrato ou um modelo de linguagem que pede a execução de uma ferramenta. Em todos esses casos, o caminho completo precisa preservar registros distintos:

| Registro                | Pergunta respondida                                                   | Autoridade responsável                                                     |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Recomendação            | O que o modelo ou agente propôs?                                      | Domínio produtor do modelo ou agente                                       |
| Decisão de autorização  | O que foi permitido, sob qual política e aprovação?                   | Thalamus para ações mediadas por IA, ou a fronteira de controle do domínio |
| Tentativa de execução   | O que foi tentado e com qual identidade idempotente?                  | Executor responsável                                                       |
| Efeito reconciliado     | O que o sistema autoritativo confirma que ocorreu?                    | Domínio que possui o efeito externo ou de negócio                          |
| Fato financeiro         | Que valor financeiro foi reconhecido, em qual moeda e estado?         | RBX Ledger                                                                 |
| Resultado de atribuição | Quanto do resultado pode ser atribuído ao uso de IA, por qual método? | RBX Yield, como capacidade analítica proposta                              |

A sequência é importante, mas não transfere ownership. O fato de uma recomendação iniciar a cadeia não autoriza o modelo a confirmar o efeito. O fato de o Ledger receber uma referência ao efeito não faz dele o dono da execução operacional. O fato de Yield consumir fatos financeiros não lhe permite reescrevê-los.

Essa separação é o fundamento para escalar de um modelo isolado para um portfólio de modelos econômicos, econométricos, de linguagem e especializados. O tipo de modelo pode mudar. A disciplina da cadeia não deve mudar.

## Verentir mede e julga, mas não governa a execução

Verentir ocupa o plano de medição e julgamento. Sua função é executar avaliações, aplicar scorers, comparar resultados, detectar regressão ou drift, atribuir causas prováveis e produzir veredictos que possam ser acompanhados ao longo do tempo.

Isso permite responder perguntas como:

- este modelo continua adequado ao propósito definido?
- o resultado respeita os critérios da especificação de avaliação?
- uma versão nova é melhor do que a anterior nas dimensões relevantes?
- a atribuição calculada pelo Yield é estável, reproduzível e sensível às hipóteses corretas?

O limite é tão importante quanto a capacidade. Verentir pode recomendar promoção, rejeição ou investigação. Não pode aprovar o próprio veredicto, autorizar uma ferramenta, executar uma compensação, declarar unilateralmente que um efeito aconteceu ou escrever um fato no Ledger.

Isso protege a independência da avaliação. Um avaliador que também autoriza, executa e contabiliza deixa de ser avaliador e se torna uma concentração de autoridade difícil de auditar.

## Thalamus aplica a decisão no caminho da IA

Thalamus permanece como o control plane institucional para ações mediadas por IA. Ele aplica políticas, limites, budgets, guardrails, aprovações e controles de ferramenta antes e depois das chamadas relevantes. Quando uma recomendação chega ao ponto de poder produzir um efeito, é essa fronteira determinística que decide o que está autorizado.

Thalamus não substitui o domínio que possui o efeito. Ele pode autorizar uma intenção com escopo e restrições, mas não deve inventar a confirmação final de que o sistema externo a executou. Da mesma forma, um agent gateway ou provider pode transportar a chamada, mas não ganha autoridade institucional sobre ela.

Essa distinção já apareceu em nossa reflexão sobre [autonomia governada como problema de sistemas distribuídos](/blog/2026-08-01-governed-autonomy-distributed-systems). O modelo propõe. A política limita. O control plane aplica. O dono do efeito confirma.

## O outbox pertence ao produtor do efeito

Sistemas agênticos precisam de entrega confiável de eventos, mas isso não justifica criar um serviço central que passe a possuir todos os efeitos do ecossistema. O padrão mais seguro é um outbox transacional pertencente ao produtor:

1. o domínio que altera seu estado grava a mudança e o evento de outbox na mesma transação;
2. o evento carrega identidades estáveis para a recomendação, a autorização, a tentativa e o efeito;
3. cada consumidor mantém seu próprio inbox ou mecanismo equivalente de deduplicação;
4. retries preservam a intenção autorizada, em vez de criar uma nova intenção;
5. o consumidor não promove a entrega do evento a prova de que o efeito de origem ocorreu além do que o produtor confirmou.

Bibliotecas, schemas e envelopes podem ser compartilhados. O ownership transacional não deve ser centralizado. Um outbox genérico separado do banco que contém a mudança de estado recria o problema que o padrão deveria resolver: a possibilidade de o evento e o fato divergirem.

Há ainda um estado que precisa ser explícito: `UnknownOutcome`. Um timeout não prova falha. Se uma operação mutável pode ter produzido efeito, o sistema deve reconciliar com a fonte autoritativa antes de repeti-la. Reexecutar primeiro e perguntar depois é uma violação de confiabilidade e também de governança, porque pode produzir um segundo efeito sem uma segunda autorização.

## Ledger registra fatos; Yield produz atribuições

RBX Ledger e RBX Yield se encontram na análise econômica, mas vivem em lados diferentes de uma fronteira crítica.

O Ledger registra fatos financeiros aceitos: transações, valores decimais, moeda, estado, liquidação, referências e evidências sob as regras da função financeira. Ele responde o que foi reconhecido financeiramente. Não deve aceitar como fato definitivo uma estimativa bruta de um modelo ou um span de observabilidade.

Yield é a capacidade analítica proposta para relacionar uso de IA, produtividade, custo e resultado. Ele responde o que pode ser atribuído, sob determinado método, ao uso de um modelo, agente ou workflow. Para isso, consome referências aos fatos dos domínios, inclusive fatos financeiros do Ledger, sem substituí-los.

Essa é também a razão para tratarmos KPI e ROI em uma relação de hierarquia, não de concorrência. KPI é a classe ampla de indicadores usados para acompanhar qualidade, tempo, custo, risco, rework e intervenção humana. ROI é um indicador financeiro derivado, com exigências adicionais.

Um ROI defensável precisa declarar, no mínimo:

- numerador e denominador;
- período e moeda;
- baseline ou contrafactual;
- classificação dos custos incluídos;
- efeitos confirmados pelos domínios responsáveis;
- fatos financeiros aceitos pelo Ledger;
- método e versão do cálculo;
- limites causais, confiança e vintage dos dados;
- revisão da função financeira quando o número sustentar uma decisão material.

Sem isso, temos uma estimativa útil para exploração, não um retorno realizado. Por essa razão, Yield deverá distinguir resultados estimados, atribuídos e realizados com reconciliação. A arquitetura não proíbe estimativas. Ela proíbe que a interface apague a diferença entre elas.

## Observabilidade fornece evidência, não escrituração

OpenTelemetry, logs, métricas, traces e plataformas de análise de IA são essenciais para reconstruir o comportamento de um sistema. Eles ajudam Verentir a avaliar e ajudam os operadores a investigar. Não são, por esse motivo, o audit trail financeiro ou institucional.

Telemetria pode sofrer sampling, redaction, transformação, retenção limitada, falha de exportação ou indisponibilidade do backend. Um trace pode mostrar que uma chamada saiu e ainda assim não provar o efeito final no sistema de destino. Uma observation pode guardar tokens, latência e score e ainda assim não provar que uma despesa foi reconhecida.

Em [Auditoria não é telemetria](/blog/2026-08-01-auditoria-ou-telemetria), mostramos por que misturar esses papéis torna ambos piores. A formulação que carregamos para a arquitetura maior é direta:

> Observabilidade fornece evidência. Governança define os limites. O control plane aplica e registra decisões. Cada domínio autoritativo preserva seus fatos duráveis.

## Modelos, loops e graphs não mudam a autoridade

Um portfólio de modelos amplia a necessidade dessas fronteiras. Modelos econômicos dependem de vintage, método e cenário. Modelos econométricos dependem de hipóteses, população, janela e revisão. Modelos especializados dependem de contratos de domínio. Modelos de linguagem dependem ainda de prompt, contexto, ferramentas, provider e parâmetros.

Todos precisam de proveniência. A versão do modelo, o hash do artefato, a versão dos dados, a especificação de avaliação e a decisão de promoção devem sobreviver ao endpoint que serviu a inferência. Se um modelo for oferecido futuramente por API, o contrato externo deverá preservar as mesmas identidades e limites, em vez de criar uma segunda cadeia de verdade.

Loop engineering também não altera essa regra. Um loop repete trabalho até um critério de parada, mas cada repetição continua sujeita a budget, idempotência e autorização. MultiLoops coordenam cadências distintas, mas não podem esconder uma mudança de responsabilidade entre ciclos. Graph engineering organiza nodes, edges e estado compartilhado, mas o estado compartilhado não vira fonte universal de verdade. Cada node deve saber que tipo de registro recebe, que registro pode produzir e qual autoridade não possui.

Até o meta-loop, que revisa se a arquitetura dos loops continua adequada, precisa parar na fronteira certa: ele pode gerar evidência e recomendar mudança. Uma alteração institucional continua exigindo decisão governada e registro canônico.

## Uma ordem de adoção que evita atalhos

A arquitetura pode ser implantada incrementalmente:

1. estabilizar identidades, proveniência de modelos e contratos de correlação;
2. conectar avaliação e observabilidade sem duplicar autoridade ou registros;
3. implementar audit trail durável, outbox por produtor, inbox por consumidor e reconciliação de resultados desconhecidos;
4. somente então consolidar Yield sobre efeitos e custos confiáveis, com a taxonomia financeira acordada com o CFO;
5. projetar os resultados em Strategos para julgamento executivo, sem transformar o cockpit em banco primário.

Essa ordem não é burocracia. Ela impede que um dashboard sofisticado seja construído sobre eventos ambíguos e depois passe a influenciar decisões como se a ambiguidade tivesse desaparecido.

Hoje, a RBX registra essas fronteiras como arquitetura institucional. Algumas capacidades já têm contratos e implementações em evolução; RBX Yield permanece uma direção proposta, dependente de uma decisão própria antes de virar repositório, serviço ou produto. Essa transparência de estado faz parte da arquitetura.

## O desenho que queremos preservar

No desenho final, Verentir avalia. Thalamus governa o caminho da IA. O domínio produtor publica seu efeito de forma transacional. O domínio responsável reconcilia a realidade. Ledger registra o fato financeiro. Yield calcula atribuição com método explícito. Strategos projeta a situação para julgamento humano.

Nenhum desses componentes precisa ser fraco para que o outro seja forte. O ecossistema se torna mais confiável justamente porque cada um pode ser excelente em uma responsabilidade delimitada.

Esse é o padrão de confiança que também descrevemos em [Trust](/trust): não pedir que a organização acredite em uma conclusão maior do que a evidência permite. Se sua empresa está estruturando agentes, modelos especializados ou medição de retorno com essas mesmas tensões, nossa prática de [LLMOps e engenharia de IA](/servicos/llmops) pode ajudar. Para discutir o desenho antes da implementação, [fale com a RBX](/contato).

## Versão curta para LinkedIn

Em sistemas agênticos, uma recomendação não é uma autorização. Uma tentativa não é um efeito confirmado. Um trace não é um audit trail. Uma correlação não é ROI.

Na arquitetura que estamos registrando na RBX, Verentir mede e avalia. Thalamus governa o caminho da IA. O produtor publica seu efeito com outbox transacional. O domínio responsável reconcilia o que ocorreu. RBX Ledger registra o fato financeiro. O RBX Yield proposto calcula atribuição com método explícito. Strategos projeta a situação para julgamento humano.

O mesmo limite vale para loops e graphs: estado compartilhado coordena trabalho, mas não cria uma fonte universal de verdade. Diante de um `UnknownOutcome`, o sistema reconcilia antes de repetir uma operação mutável.

ROI é um KPI financeiro derivado. Para ser defensável, precisa de baseline, período, custos classificados, fatos do Ledger, efeitos reconciliados, método versionado e limites causais explícitos.

Princípio: evidência informa decisões, mas não herda a autoridade das decisões que informa.
