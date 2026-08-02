---
title: 'Autonomia governada é um problema de sistemas distribuídos'
date: '2026-08-01'
author: 'Leandro Damasio'
authorRole: 'Fundador e CEO, RBX Systems'
tags: [agentes, governança, sistemas-distribuídos, observabilidade, engenharia]
excerpt: 'Por que idempotência, proveniência, resultados desconhecidos e observabilidade vendor-neutral são o centro da arquitetura agêntica, não a margem do prompt.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-01-governed-autonomy-distributed-systems.png'
---

Há um momento, em toda organização que leva agentes de IA a sério, em que a pergunta muda. Ela deixa de ser "o que o modelo consegue fazer?" e passa a ser "o que este sistema acabou de fazer, e quem autorizou?". Esse momento chega mais cedo do que a maioria espera: basta um agente com acesso a ferramentas reais para que um efeito seja produzido no mundo antes que alguém consiga reconstruir por que ele ocorreu.

A resposta dominante do mercado para esse desconforto tem sido melhorar o prompting: instruções mais cuidadosas, exemplos melhores, guardrails textuais. Tudo isso ajuda, e nada disso resolve. Um prompt melhora a formação da intenção. Ele não governa o efeito. Entre a intenção do agente e a consequência no mundo existe uma cadeia inteira de autorização, execução, falha parcial e evidência, e essa cadeia é, com precisão técnica, um problema de sistemas distribuídos.

Esta é a tese que orienta a engenharia da RBX: autonomia agêntica em produção é um problema de sistemas distribuídos, governança e evidência, não apenas de prompting.

## O salto do protótipo para o sistema

O setor inteiro está atravessando esse salto agora. O relatório [The Pulse of Agentic AI in 2026](https://www.dynatrace.com/info/reports/the-pulse-of-agentic-ai-in-2026/), publicado pela Dynatrace a partir de uma pesquisa com 919 líderes seniores de grandes empresas, descreve o estado da transição: 50% das organizações pesquisadas têm agentes em produção para casos de uso limitados, 69% das decisões tomadas por agentes ainda passam por verificação humana, e 44% ainda revisam manualmente os fluxos de comunicação entre agentes. Entre os principais bloqueios de escala aparecem justamente visibilidade, governança e monitoramento.

Vale a qualificação: trata-se de uma pesquisa de percepção executiva, conduzida em nome de um fornecedor de observabilidade, e não de uma medição direta de sistemas. Ainda assim, o padrão que ela captura é reconhecível para qualquer equipe que operou agentes de verdade. A verificação humana de 69% das decisões não é conservadorismo. É o sintoma de uma arquitetura que ainda não oferece à organização uma alternativa confiável à supervisão manual: sem evidência estruturada, sem limites executáveis, sem trilha de decisão, o humano no circuito é o único mecanismo de controle disponível.

O caminho para reduzir essa dependência não passa por confiar mais no modelo. Passa por construir o sistema em volta dele.

## Autonomia é produção de efeitos

Um agente que apenas gera texto é um gerador de rascunhos. Um agente que chama ferramentas é outra coisa: é um cliente de sistemas distribuídos, com tudo o que isso implica. Chamadas atravessam fronteiras de rede. Timeouts acontecem. Confirmações se perdem. Retries duplicam. Efeitos parciais ficam órfãos. Nada disso é novidade para quem constrói sistemas transacionais; a novidade é que agora o componente que decide iniciar essas chamadas é probabilístico, e a pressão comercial empurra para dar a ele cada vez mais alcance.

Quando a autonomia é entendida como produção de efeitos, as prioridades de arquitetura mudam. As perguntas centrais deixam de ser sobre a qualidade da resposta e passam a ser as perguntas clássicas de sistemas críticos: o que acontece quando esta operação for repetida? O que sabemos quando ela não responde? Que registro sobrevive para provar o que foi feito e sob qual autorização? Quatro décadas de engenharia de sistemas distribuídos já trataram essas perguntas. O trabalho agora é aplicá-las ao circuito agêntico, onde elas ganham uma dimensão extra: a de governança.

## Idempotência como governança

A literatura trata idempotência como uma propriedade defensiva de APIs: repetir a requisição não duplica o efeito. Correto, e insuficiente. Em sistemas agênticos, a idempotência protege algo mais valioso do que o estado: protege a relação entre intenção, autorização, decisão, execução, efeito e evidência.

Considere uma aprovação humana. Um operador autoriza uma ação de risco. A rede oscila, o cliente reapresenta a requisição, e o sistema registra duas aprovações. Do ponto de vista do estado, talvez inofensivo. Do ponto de vista da governança, grave: o registro agora afirma que o humano autorizou duas vezes algo que ele autorizou uma vez. A trilha de auditoria passou a mentir. O mesmo vale para a execução de uma ferramenta com efeito externo: se o retry dispara uma segunda execução, o sistema produziu um efeito que nenhuma decisão cobriu.

Por isso, na RBX, idempotência é tratada como requisito de governança, não como otimização. No nosso control plane, operações de governança como aprovações e decisões de ferramenta são idempotentes por contrato: reapresentar a mesma operação retorna o registro original em vez de criar um segundo. Cada efeito externo carrega uma identidade estável que o liga à decisão que o autorizou. A pergunta de projeto deixa de ser "e se a rede repetir?" e passa a ser "como garantimos que todo efeito produzido corresponde a exatamente uma decisão?".

## O problema dos resultados desconhecidos

Todo sistema distribuído convive com uma verdade incômoda: um timeout não prova que a operação falhou. A requisição pode ter sido executada e a confirmação se perdido no caminho. Para um agente autônomo, esse é o cenário mais perigoso que existe, porque a reação ingênua, tentar de novo, é exatamente a que duplica efeitos.

No runtime de engenharia agêntica que a RBX constrói para o Robson, nosso sistema de trading, esse cenário tem nome e tratamento próprios: resultado desconhecido. Quando uma conexão cai no meio de uma inferência ou de uma execução, o motor não fabrica um veredito local. Ele não registra falha, não registra cancelamento, não descarta nem aproveita conteúdo parcial, e sobretudo não repete a operação. Ele registra que o desfecho é desconhecido e inicia uma reconciliação: consulta o registro autoritativo do outro lado da fronteira, descobre o que de fato aconteceu, e só então decide o próximo passo. A repetição automática é proibida por construção; há testes que garantem exatamente uma reconciliação e nenhuma reexecução espontânea.

Esse desenho conecta camadas que costumam ser discutidas separadamente. Para o sistema distribuído, é correção. Para o operador, é a diferença entre confiar e vigiar: um sistema que admite "não sei o que aconteceu, fui verificar" é mais confiável do que um que esconde a incerteza atrás de um retry. Para a auditoria, é a garantia de que o registro reflete o que ocorreu, não o que o cliente presumiu. E para a governança, é a condição mínima para autorizar efeitos de maior risco: só se delega autonomia a quem sabe reconhecer a própria incerteza.

## Proveniência antes de explicabilidade

Quando algo dá errado em um sistema agêntico, a pergunta forense é sempre a mesma: o que exatamente o modelo recebeu, sob quais regras, e o que ele devolveu? Logs convencionais raramente respondem, porque capturam fragmentos soltos: um trecho de prompt aqui, uma resposta ali, sem versão, sem hash, sem a fronteira entre o que era instrução e o que era contexto.

A resposta arquitetural da RBX é registrar proveniência como artefato de primeira classe. No runtime agêntico do Robson, cada compilação de prompt produz um manifesto: quais instruções entraram, de qual fonte, com qual autoridade e qual hash de conteúdo. Cada passo de modelo produz seu próprio manifesto, ligando prompt, modelo, provider, ferramentas disponíveis e políticas aplicadas àquela inferência específica. O conjunto forma uma cadeia verificável entre o que foi autorizado e o que foi executado.

O detalhe mais importante desse desenho não é o registro, é a hierarquia de autoridade que ele torna explícita. Instrução é instrução: vem de fontes autorizadas e tem força normativa. Contexto é evidência: informa, mas não comanda. Memória é contexto, não é fonte de ordens. Saída de ferramenta é dado a ser interpretado. E código recuperado de um repositório não ganha autoridade de instrução só porque entrou na janela do modelo. Sem essa separação registrada, qualquer conteúdo que toca o prompt vira, na prática, uma ordem em potencial, e é dessa confusão que nascem tanto os incidentes de segurança quanto a impossibilidade de explicar decisões depois.

## Determinismo ao redor do probabilístico

Modelos são probabilísticos, e devem ser: é daí que vem a capacidade. O erro de arquitetura é deixar que a fronteira de política também seja probabilística. Pedir a um modelo que "sempre confirme antes de executar" é uma esperança, não um controle.

O padrão que adotamos é cercar o núcleo probabilístico de pontos determinísticos: ganchos que disparam sempre, em posições fixas do ciclo de vida, independentemente do que o modelo diga. Antes de aceitar uma solicitação. Antes de disponibilizar uma ferramenta. Antes de executar. Depois de executar. Diante de orçamento excedido. Na parada, no cancelamento, na reconciliação. Cada disparo é registrado, e um bloqueio nesses pontos é definitivo: não existe argumentação do modelo que o reverta. No runtime do Robson, esses pontos de ciclo de vida são implementados e testados como parte do protocolo, não como convenção.

O mesmo raciocínio vale para as decisões de ferramenta. Reduzir uma chamada de ferramenta a uma linha de log é jogar fora a estrutura do evento. Intenção do agente, validação do schema, classificação de risco, autorização pela política, aprovação humana quando exigida, execução, resultado e efeito downstream são eventos distintos, com autores distintos e consequências distintas. Registrá-los separadamente é o que permite responder, meses depois, não só "o que aconteceu", mas "quem decidiu, com base em quê, e o que teria acontecido se a política fosse outra".

## Evidência, limites e decisão

Existe hoje uma tentação de mercado de resolver tudo isso comprando uma plataforma de observabilidade e declarando o problema encerrado. A distinção que fazemos é mais exigente:

Observabilidade fornece evidência. Governança define os limites. O control plane aplica e registra as decisões.

São três responsabilidades diferentes, e nenhuma substitui as outras. Um dashboard não é uma política. Um trace não é uma autorização. Uma plataforma de observabilidade, por melhor que seja, informa a decisão; ela não tem autoridade institucional para tomá-la.

Na camada de evidência, a fórmula da RBX é deliberadamente dupla: OpenTelemetry para interoperabilidade e correlação; Langfuse para semântica, avaliação e análise de IA. OpenTelemetry é o padrão vendor-neutral que garante que um trace atravesse serviços, filas e bancos com contexto propagado, que spans, métricas e logs se correlacionem, e que tudo viaje por OTLP até onde a organização decidir, com fan-out e portabilidade via Collector. Ele é fundamento de interoperabilidade, não produto analítico final. Langfuse é o backend especializado onde a semântica de IA mora: generations, versões de prompt, tool calls, tokens, custos, latência, scores, avaliações, datasets e experimentos. Um responde "o que aconteceu no sistema inteiro"; o outro responde "o que o modelo fez, quanto custou e quão bom foi". Confundir os dois papéis é como usar um data warehouse no lugar de um debugger, ou o contrário. Na RBX, essa separação é decisão de arquitetura registrada e implementada como serviço próprio de ingestão e redação de dados sensíveis; parte dessa camada ainda está em consolidação, e dizemos isso com a mesma precisão que exigimos do resto.

Acima da evidência fica a decisão. A RBX desenvolve o Thalamus como control plane institucional para tráfego de IA: o ponto que responde, antes de cada chamada, quem pode chamar qual modelo, com qual orçamento, sob qual política, com qual contexto autorizado, e que valida depois da chamada o que pode virar ação. Ele é separado, por fronteira explícita, do modelo, do provider, do gateway e do backend de observabilidade, precisamente para que a autoridade não se dissolva na infraestrutura. Aqui também a precisão importa: o Thalamus é um contrato documentado com implementação em evolução, com partes operando internamente e partes ainda em construção. Publicamos o princípio com convicção e o estado com honestidade, porque um control plane que exagera as próprias capacidades trai a função que existe para cumprir.

## Medir resultado, não atividade

Resta a pergunta que sustenta todas as outras: está funcionando? A resposta habitual conta tokens, chamadas, latência e custo de provider. São métricas de atividade, e atividade não é retorno. Um agente pode consumir menos tokens e gerar mais retrabalho. Pode produzir mais código e menos valor.

A atribuição que interessa relaciona trabalho realizado com qualidade, tempo, intervenção humana necessária, retrabalho gerado, custo total e efeito operacional ou de negócio. No roadmap da RBX, essa camada de atribuição de rendimento existe como direção declarada de arquitetura, apoiada na mesma trilha de eventos e evidências descrita acima; é trabalho planejado, não produto em produção, e apresentá-la além disso seria contradizer o espírito deste texto. O ponto conceitual, porém, já orienta o desenho: um sistema que registra decisões, efeitos e evidências de ponta a ponta é um sistema em que o retorno pode ser calculado em vez de estimado.

## Uma conclusão sóbria

Nada aqui é um argumento contra os modelos. É um argumento sobre onde mora a confiança. Modelos vão continuar melhorando, e cada melhoria amplia o que vale a pena delegar. Mas a delegação segura nunca virá do prompt: virá do sistema em volta, o que garante que efeitos correspondam a decisões, que incertezas sejam reconciliadas antes de repetidas, que a proveniência de cada passo sobreviva ao passo, e que a evidência alimente limites que alguém com autoridade definiu.

A RBX opera nesse terreno como laboratório e como praticante: as ideias deste texto não vêm de slides, vêm de um sistema de trading que executa com dinheiro real, de um runtime agêntico que trata desfecho desconhecido como estado de primeira classe, e de um control plane que aprendeu a tornar aprovações idempotentes antes de precisar disso em uma crise. Escrevemos sobre o que construímos, no estado em que está, como fizemos ao mostrar [por que auditoria não é telemetria](/blog/2026-08-01-auditoria-ou-telemetria) e [como governamos RAG público](/blog/2026-07-29-governed-public-rag). Essa é a régua que aplicamos a nós mesmos, registrada na nossa página de [Trust](/trust): primeiro evidência, depois confiança.

Se a sua organização está atravessando o salto do protótipo para o sistema, nossa prática de [LLMOps e engenharia de IA](/servicos/llmops) trata exatamente dessa travessia. E se quiser discutir a arquitetura antes de qualquer outra coisa, [fale com a RBX](/contato).
