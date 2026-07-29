---
title: 'RAG público com controle e evidência'
date: '2026-07-29'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [rag, ai-engineering, rust, governance, retrieval]
excerpt: 'Como separamos retrieval, controle, memória e avaliação em um assistente público preparado para shadow, com Rust, Thalamus e evidência auditável.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-29-governed-public-rag.png'
---

# RAG público com controle e evidência

Adicionar RAG a um assistente público parece simples: transformar documentos em vetores, buscar trechos semelhantes e entregá-los ao modelo. Essa descrição funciona em uma demonstração. Em um sistema institucional, ela omite quase todas as decisões difíceis.

Quem pode pedir a recuperação? Qual conjunto de documentos pode ser consultado? Como impedir que conteúdo interno apareça em uma resposta pública? Quem escolhe o modelo de embedding? O que acontece quando a evidência está vencida? Como provar, depois do fato, qual política permitiu a chamada?

Na RBX, tratamos essas perguntas como parte do produto. A implementação resultante foi preparada para modo shadow, permanece desativada por padrão e não tem autorização de rollout público. Quando habilitada em um ambiente aprovado, ela poderá validar o caminho sem alterar a resposta entregue ao visitante.

Este artigo explica duas escolhas que aparecem no centro da arquitetura: por que usamos Rust nos backends do caminho RAG e por que colocamos Thalamus no plano de controle.

## RAG não é uma fronteira de segurança

Busca semântica responde a uma pergunta estatística: quais trechos estão mais próximos desta consulta? Ela não responde se a consulta está dentro do escopo, se o chamador tem autorização, se o documento continua válido ou se o resultado pode ser exposto naquele contexto.

Por isso, o índice vetorial não pode decidir sozinho o que o assistente público sabe.

Também recusamos a ideia de um corpus irrestrito para toda a empresa. O conhecimento foi dividido em pacotes de RAG com escopo explícito. O pacote do assistente público contém apenas material institucional, comercial e de suporte aprovado para exposição pública. Outros domínios permanecem isolados.

Essa separação é tão importante quanto o algoritmo de ranking. Um resultado semanticamente relevante, mas pertencente ao pacote errado, é uma falha de autorização.

## O caminho governado

O fluxo em shadow tem responsabilidades deliberadamente separadas:

1. O BFF do site envia a consulta para uma rota RAG governada no Thalamus.
2. Thalamus autentica o chamador, resolve a política e autoriza o pacote público.
3. Thalamus delega a recuperação ao rbx-memory com escopo fixo.
4. rbx-memory pede o embedding da consulta por uma rota governada no próprio Thalamus.
5. Thalamus resolve o alias permitido e chama o backend por meio de `EmbeddingPort`.
6. rbx-memory consulta o índice externo com filtros exatos de pacote, visibilidade e validade.
7. O resultado volta com identificadores de trace e auditoria.
8. O BFF registra a execução shadow, mas não usa os trechos para mudar a resposta pública.

Há uma aparente volta no passo 4. Ela é intencional. rbx-memory é dono da persistência e da recuperação, mas não recebe credenciais de provedor e não chama LiteLLM diretamente. Todo embedding continua sujeito ao mesmo controle de política, alias, redaction e auditoria.

Em outras palavras, [rbx-memory](/produtos/rbx-memory) sabe buscar. Thalamus decide se aquela busca e aquele embedding podem acontecer naquele contexto.

## Por que Rust

RAG não exige Rust. É possível construir um excelente sistema de recuperação em Python, Go, Java ou TypeScript. Nossa escolha não foi uma afirmação sobre a qualidade dessas linguagens. Foi uma decisão sobre o tipo de falha que queríamos tornar mais difícil.

O caminho cruza contratos sensíveis: tenant, produto, workflow, package ID, visibilidade, modelo permitido, dimensões do vetor, trace, auditoria e envelopes de erro. Em Rust, esses contratos podem ser representados como tipos explícitos, validados nas bordas e propagados sem depender de convenções implícitas.

Isso ajudou em quatro pontos.

Primeiro, falhas ficam visíveis. Um backend de embedding indisponível, uma política ausente e uma resposta com dimensão incorreta são estados diferentes. O sistema precisa recusar cada um de forma previsível, sem transformar erro em contexto vazio ou fallback silencioso.

Segundo, concorrência assíncrona permanece limitada. O caminho usa rede e banco, mas não precisa aceitar filas sem limite, retries invisíveis ou trabalho solto em background. A implementação pode definir timeouts, limites de corpo e contagem de chamadas por operação.

Terceiro, o binário é operacionalmente simples. Os serviços de controle, memória e avaliação compartilham uma base de ferramentas, um modelo de erros e verificações locais consistentes.

Quarto, a escolha reduz diferenças entre o contrato e o código que o executa. `EmbeddingPort`, os envelopes de request e response e as políticas de recuperação vivem como interfaces verificáveis. O adaptador de LiteLLM continua substituível.

O custo existe. Rust exige mais precisão no início, aumenta o tempo para mudanças exploratórias e cobra disciplina na modelagem. Aceitamos esse custo porque o problema não era apenas recuperar texto. Era preservar fronteiras sob falha.

## Por que o núcleo do Thalamus

Thalamus não foi usado como banco vetorial nem como backend da RAG. Essa distinção é central.

rbx-memory possui chunks, embeddings, acesso ao PostgreSQL externo, pgvector, ranking lexical e recuperação híbrida. Thalamus possui o direito de decidir se uma operação pode ocorrer agora, para aquele tenant, produto e workflow.

Colocar o controle no Thalamus trouxe uma única superfície para:

- autenticação e autorização
- resolução de política por tenant, produto e workflow
- permissão explícita de alias de modelo
- redaction antes da chamada
- trace e eventos de auditoria
- validação de resposta
- recusa quando política ou backend não estão disponíveis

A rota de embeddings delega somente para `EmbeddingPort`. O núcleo não conhece credenciais de um provedor específico e não incorpora o protocolo interno do LiteLLM. O adaptador traduz o contrato governado para o backend permitido.

Esse desenho evita um atalho comum: cada serviço receber sua própria chave e chamar o provedor diretamente. O atalho reduz uma chamada de rede, mas espalha autoridade, logs, aliases e políticas. Depois, cada consumidor precisa reconstruir controles que deveriam ser institucionais.

A [engenharia de IA aplicada](/servicos/engenharia-de-ia) fica mais confiável quando o ponto de controle é explícito e o componente de dados não consegue contorná-lo.

## O índice também precisa impor isolamento

Controle upstream não substitui segurança no banco.

A recuperação híbrida combina similaridade vetorial por pgvector e busca lexical compatível com ParadeDB. Em todas as etapas, os candidatos semânticos, os candidatos lexicais e a leitura final aplicam filtros exatos de package ID e visibilidade. Datas de vigência e revisão também fazem parte do predicado.

Isso evita uma classe de erro em que a aplicação filtra depois de buscar. Se o conjunto candidato já misturou pacotes, o isolamento aconteceu tarde demais.

O PostgreSQL alvo é externo. Não adicionamos um banco de produção dentro do cluster. O índice é uma projeção reconstruível; o conteúdo aprovado continua com sua fonte de autoridade própria.

## Avaliação não pode autorizar a si mesma

Uma arquitetura governada ainda pode responder mal. Por isso, medição e controle também foram separados.

TruthMetal possui os casos canônicos e os thresholds aceitos. Verentir foi preparado para executar avaliações assíncronas, persistir vereditos e reconstruir relatórios a partir de artefatos de avaliação assinados. Quando aceita, essa evidência poderá informar a política; Thalamus continuará responsável pelo controle ao vivo.

O relatório mede seis sinais: taxa geral de aprovação, accuracy, aderência de escopo, claims sem suporte, violações de limite financeiro e evidência obsoleta ou não autorizada. Os artefatos são ligados aos bytes exatos do contrato e assinados com Ed25519. Uma sequência exige histórico completo e rejeita reuso de runs, exports ou verdicts.

Mesmo três execuções aprovadas não liberam produção. Elas tornam o sistema elegível para revisão humana. Requisitos não métricos e aprovação de rollout continuam separados.

O gate atual permanece fechado. O contrato exige pelo menos 30 casos aceitos e três execuções shadow consecutivas. O conjunto ainda está em processo de aceitação, e a confiança de assinatura precisa ser provisionada. Isso é uma característica de segurança, não um atraso a esconder.

## O que fica mais difícil

A arquitetura adiciona componentes e chamadas. Há mais contratos para manter, mais estados de falha para observar e mais trabalho editorial para revisar fontes, datas e escopo. No início, recusas e handoffs serão mais frequentes porque o corpus é deliberadamente pequeno.

Também aceitamos latência adicional na recuperação governada. No modo shadow, ela não altera a resposta pública, mas precisa ser medida antes de qualquer integração síncrona.

O ganho é que cada responsabilidade tem dono:

- o pacote curado define o conhecimento permitido
- rbx-memory persiste e recupera
- Thalamus autoriza e audita
- TruthMetal define o que é correto
- Verentir mede o comportamento ao longo do tempo
- humanos aprovam o rollout

Nenhum desses componentes consegue, sozinho, declarar o sistema pronto.

## O princípio que queremos preservar

RAG útil não é apenas contexto semelhante. É contexto autorizado, atual, atribuível e avaliado.

Rust nos ajudou a tornar os contratos explícitos e as falhas difíceis de ignorar. Thalamus garantiu que embeddings e recuperação não se tornassem um caminho paralelo fora da política institucional. rbx-memory manteve a busca onde ela pertence. TruthMetal e Verentir impediram que runtime, verdade e avaliação fossem confundidos.

A integração permanece preparada para shadow e desativada por padrão porque essa separação precisa ser provada antes de qualquer promoção. Esse é o padrão que descrevemos em [Trust](/trust): primeiro evidência, depois confiança.

Se sua organização está transformando um protótipo de IA em um sistema controlável, conheça nossa abordagem de [engenharia de IA](/servicos/engenharia-de-ia) ou [fale com a RBX](/contato).

## Versão curta para LinkedIn

RAG público não é apenas vetor, ranking e prompt.

Na RBX, separamos seis responsabilidades: pacote curado, recuperação, controle, verdade, medição e aprovação humana.

Usamos Rust para representar contratos sensíveis como tipos explícitos e falhar de forma previsível. Usamos Thalamus como plano de controle, não como banco vetorial. rbx-memory continua dono de pgvector e da recuperação, mas todo embedding passa por política, autorização, alias, redaction, trace e auditoria.

A integração está preparada para shadow e desativada por padrão. O gate exige casos aceitos, três execuções consecutivas e revisão humana. Métrica não faz deploy.

Princípio: RAG confiável precisa de contexto autorizado, atual, atribuível e avaliado.
