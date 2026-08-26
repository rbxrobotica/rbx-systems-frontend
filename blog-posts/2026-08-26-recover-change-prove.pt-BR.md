---
title: 'Recuperar, mudar e provar'
slugAlias: '2026-08-26-recuperar-mudar-e-provar'
date: '2026-08-26'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [resiliência, infraestrutura, IA, observabilidade, governança]
excerpt: 'Resiliência não é uptime. É a capacidade testada de recuperar, mudar dependências e produzir evidência de que funções críticas seguem dentro dos limites.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-26-recover-change-prove.png'
---

Um sistema pode responder `HTTP 200` e ainda estar operacionalmente quebrado. A latência pode tornar o checkout impraticável. Um pagamento pode ser duplicado. Uma fila pode crescer mais rápido do que o consumo. Um agente pode continuar respondendo enquanto perde a capacidade de usar ferramentas. Um modelo pode permanecer disponível e mudar o comportamento que sustentava o produto.

Uptime mede se um endpoint respondeu. Resiliência mede se a organização continua entregando uma função crítica dentro de limites aceitáveis, e se consegue restaurá-la quando esses limites são rompidos.

Durante anos, a discussão empresarial sobre resiliência se concentrou em bancos de dados, redes, redundância e disaster recovery. Esses elementos continuam necessários. O grafo de dependências, porém, mudou. Agora ele inclui modelos que a empresa não possui, APIs que ela não pode restaurar, preços que não controla, identidades externas, registries, pipelines e comportamentos que podem mudar sem uma nova versão da aplicação.

É nesse contexto que a RBX adota uma tese simples:

> **Systems designed to recover, change and prove it.**

Os três verbos são diferentes de propósito. Recuperar é reconstruir capacidade operacional. Mudar é substituir dependências sem perder controle do sistema. Provar é produzir evidência durável de que as duas capacidades funcionam.

## Uptime não é impacto

Disponibilidade binária é uma aproximação pobre do efeito operacional. Healthchecks, métricas de infraestrutura e SLOs técnicos continuam úteis, mas não respondem sozinhos às perguntas que importam durante um incidente:

- Qual função de negócio foi degradada?
- Quantos clientes, operações ou transações foram afetados?
- Por quanto tempo o efeito permaneceu acima da tolerância?
- Houve perda de disponibilidade, integridade, autenticidade ou confidencialidade dos dados?
- Qual foi o impacto financeiro, regulatório e operacional?

Esse é o ponto em que observabilidade deixa de ser apenas um conjunto de dashboards e passa a servir como evidência. A métrica `payment-api p99 = 4,3 s` descreve um sintoma. A afirmação `12,4% das tentativas de pagamento excederam o SLO durante 38 minutos, afetando X transações` descreve impacto. A segunda formulação permite classificar, escalar, decidir e explicar.

Isso não significa automatizar a decisão regulatória. Telemetria informa a decisão; ela não recebe autoridade jurídica para tomá-la. O sistema deve preparar os fatos, preservar a linha do tempo e tornar a materialidade calculável. A classificação final continua sujeita à governança da instituição.

## Recuperar significa reconstruir

Reiniciar não é recuperar. Subir novamente um processo resolve uma classe estreita de falhas. Recuperar uma função exige reconstruir runtime, estado, acesso e confiança a partir de fontes conhecidas.

Uma arquitetura recuperável precisa responder onde estão:

- a fonte autoritativa de código, configuração, políticas, prompts e infraestrutura;
- as cópias de dados e os objetivos de RPO e RTO observados em restaurações reais;
- o caminho de identidade, segredos e acesso break-glass quando a plataforma principal não existe;
- os artefatos imutáveis e verificáveis necessários para o rebuild;
- o conhecimento operacional que permite a outra pessoa executar o procedimento;
- o registro durável do último exercício, incluindo o que falhou e o que ainda precisa ser corrigido.

A regra arquitetural é exigente: nada necessário para reconstruir a plataforma pode depender exclusivamente de a própria plataforma já estar funcionando.

Isso também separa resiliência de redundância. Ter duas instâncias, regiões ou cópias pode reduzir indisponibilidade, mas não prova que a organização consegue restaurar a capacidade depois de perda de estado, credenciais, fornecedor ou conhecimento humano. Redundância compra tempo. Reconstruibilidade compra um caminho de volta.

Backups só passam a ser capacidade operacional quando a restauração é exercitada. Planos só passam a ser runbooks quando outra pessoa consegue executá-los. Uma opção arquitetural que nunca foi testada ainda não é uma capacidade.

## Mudar faz parte da resiliência

Sistemas mudam mesmo quando a empresa preferiria que permanecessem estáveis. Fornecedores encerram produtos, regiões ficam indisponíveis, contratos terminam, requisitos de jurisdição evoluem e preços alteram a viabilidade de uma arquitetura. Tratar cada mudança como exceção cria dependência acumulada.

Portabilidade não exige fingir que todos os fornecedores são iguais. Exige escolher fronteiras em que a substituição seja deliberada:

- dados exportáveis em formatos conhecidos;
- interfaces e contratos explícitos;
- infraestrutura declarativa;
- identidades e segredos com procedimentos de transição;
- observabilidade interoperável;
- planos de saída com responsáveis, prazos e critérios de sucesso.

Portabilidade perfeita é ficção e abstrações também têm custo. Elas podem esconder recursos úteis do fornecedor, ampliar a superfície de testes e reduzir velocidade no curto prazo. A decisão madura é investir primeiro onde a falha seria irreversível, onde a concentração é maior e onde a capacidade pode ser reutilizada em vários sistemas.

O objetivo não é trocar de fornecedor toda semana. É preservar a liberdade de fazê-lo quando o negócio exigir. A formulação comercial coerente para a RBX é direta: portable by design, retained by trust.

## IA cria uma dependência comportamental

Em sistemas de IA, a dependência crítica não termina na disponibilidade da API. Um modelo pode ser descontinuado, mudar de versão, receber uma política de segurança diferente ou produzir uma distribuição de respostas incompatível com o produto. A mesma aplicação com outro modelo pode ser, do ponto de vista operacional, outro sistema.

Por isso, resiliência de IA exige versionar mais do que código. O conjunto recuperável inclui:

- prompts e instruções;
- manifestos de modelo e políticas de roteamento;
- schemas de ferramentas e limites de autorização;
- datasets de avaliação, casos canônicos e thresholds;
- políticas de fallback e rollback;
- limites de custo, latência e qualidade;
- proveniência suficiente para reproduzir uma decisão.

Um fallback entre provedores que nunca passou pelo mesmo harness de avaliação não é uma salvaguarda. É uma mudança de comportamento não governada. Um exercício de saída do fornecedor precisa provar não apenas que a segunda API responde, mas que o sistema preserva qualidade, segurança, custo e limites de ação.

Essa é a nova classe de risco: dependência comportamental. Compute pode ser reconstruído e dados podem ser restaurados enquanto o produto continua incapaz de reproduzir o comportamento que os usuários e os controles esperam.

## Provar exige evidência durável

Resiliência declarada aparece em diagramas, contratos e apresentações. Resiliência exercitada deixa artefatos.

Um exercício de recuperação deve registrar o cenário, as funções afetadas, o tempo observado, o ponto de recuperação, as validações de integridade, as decisões tomadas e as lacunas encontradas. Um exercício de troca de modelo deve preservar casos, versões, scores, regressões, custos e aprovações. Um teste de saída de fornecedor deve demonstrar que dados, acessos, integrações e operação atravessaram a fronteira prevista.

Logs ajudam no diagnóstico, mas não devem ser a única memória dessas capacidades. Como já mostramos em [logs voláteis não são evidência](/blog/2026-07-12-volatile-logs-are-not-evidence), uma rotina crítica precisa emitir um evento, estado ou artefato que sobreviva à própria falha. E, como explicamos em [auditoria ou telemetria](/blog/2026-08-01-auditoria-ou-telemetria), evidência operacional e registro de autoridade cumprem funções diferentes.

O princípio é curto:

> Resiliência precisa ser exercitada, não declarada. Observabilidade precisa produzir evidência, não apenas dashboards.

## A regulação está convergindo com a engenharia

O movimento regulatório em finanças não cria essa tese, mas confirma sua direção.

Na União Europeia, o [DORA, Regulamento (UE) 2022/2554](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32022R2554), é aplicável desde 17 de janeiro de 2025. A classificação de incidentes considera clientes e transações afetados, duração e downtime, dispersão geográfica, perdas de dados, criticidade dos serviços e impacto econômico. O [regulamento delegado sobre materialidade](https://eur-lex.europa.eu/eli/reg_del/2024/1772/oj/por) combina serviço crítico e limiares específicos para determinar um incidente major.

A nuance importa. Quarenta minutos de latência degradada não constituem, por si só, um incidente major sob o DORA. A degradação pode integrar um incidente major quando o serviço crítico e os critérios aplicáveis cruzam os limiares definidos. A lição de engenharia não é que toda degradação deve ser reportada. É que um healthcheck verde não contém informação suficiente para avaliar impacto.

O DORA também exige um programa abrangente e baseado em risco de testes de resiliência digital, com testes apropriados pelo menos anuais para sistemas e aplicações que suportam funções críticas ou importantes. Para serviços críticos prestados por terceiros de TIC, planos de saída devem ser documentados, periodicamente revisados e suficientemente testados.

Na Suíça, a [Circular FINMA 2023/1](https://www.finma.ch/en/~/media/finma/dokumente/dokumentencenter/myfinma/rundschreiben/finma-rs-2023-01-20221207.pdf) define resiliência operacional em torno da restauração de funções críticas dentro de tolerâncias a interrupções. Ela exige inventário de conexões e dependências, além de exercícios regulares sob cenários severos, porém plausíveis, incluindo dependências externas e a saída sob estresse de um prestador relevante.

No Brasil, a [Resolução CMN 4.893, em sua versão vigente](https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=4893&tipo=Resolu%C3%A7%C3%A3o%20CMN), trata da política de segurança cibernética e da contratação de processamento, armazenamento e nuvem para instituições dentro de seu escopo. Com as alterações da Resolução CMN 5.274/2025, o texto reforça rastreabilidade, cópias de segurança, gestão de vulnerabilidades, controles aplicados ao desenvolvimento seguro e à adoção de novas tecnologias, métricas, trilhas de auditoria e testes documentados. A continuidade deve considerar interrupção e substituição do prestador, além do restabelecimento da operação normal.

Essas normas não transformam automaticamente todo fornecedor de tecnologia em entidade diretamente regulada. O enquadramento depende do serviço, da jurisdição e do contrato. As expectativas, porém, atravessam a cadeia por requisitos contratuais, auditoria, gestão de terceiros, procurement e deveres de incidente.

## A pergunta que fica

Um sistema resiliente deve responder, com evidência:

- Qual função crítica está dentro ou fora da tolerância agora?
- Conseguimos quantificar impacto, não apenas disponibilidade?
- Conseguimos restaurar estado e acesso a partir de fontes independentes?
- Conseguimos substituir uma dependência sem regressão invisível?
- Quando essa capacidade foi exercitada pela última vez?
- Qual artefato prova o resultado?

Construir essas respostas custa tempo e adiciona complexidade. Sobre-engenharia também é fragilidade. A prioridade deve seguir a irreversibilidade da falha, a concentração de dependências e o potencial de reúso da capacidade.

Ainda assim, a direção é inequívoca. Infraestrutura resiliente não é a que promete nunca falhar. É a que preserva um caminho conhecido para recuperar, mudar e demonstrar, depois do fato, que as funções importantes permaneceram governadas.

Essa é a régua registrada na nossa página de [Trust](/trust) e aplicada na prática de [LLMOps e engenharia de IA](/servicos/llmops). Se sua organização precisa transformar opções arquiteturais em capacidade operacional verificável, [fale com a RBX](/contato).
