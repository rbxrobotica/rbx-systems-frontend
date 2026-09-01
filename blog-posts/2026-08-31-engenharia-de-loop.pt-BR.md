---
title: 'Engenharia de Loop'
date: '2026-08-31'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, processo, agentes, flightdeck]
excerpt: '58 rodadas de revisão adversarial entre dois modelos, com um humano na triagem, levaram um plano de migração de runtime de 12 achados a zero.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-31-engenharia-de-loop.png'
---

# Engenharia de Loop

No sábado, o plano de migração de runtime do nosso FlightDeck entrou em revisão com 12 achados na primeira rodada. No domingo à noite, depois de 58 rodadas, o veredito do revisor chegou assim, literalmente:

```
No material findings.

Checkpoint A passes: 0 critical, 0 high, 0 medium, 0 low
```

Este artigo documenta o processo que chamamos de Engenharia de Loop: o que é, o que ele encontrou no caminho, e a lição contraintuitiva que ficou. O valor do loop não está só no rigor que ele adiciona. Está no que ele nos obriga a remover.

## O loop

O processo vem de um ADR interno nosso e tem três papéis fixos. Um agente escreve e emenda o plano de arquitetura. Um segundo modelo, de outro fornecedor, revisa em sandbox somente leitura com esforço máximo de raciocínio, sem poder editar nada, e termina cada rodada com uma linha de veredito padronizada e uma lista de achados com severidade e correção concreta. Um humano faz a triagem: nenhum achado é aceito automaticamente, e nenhuma emenda dispensa registro.

Cada rodada é o mesmo ciclo: revisão, triagem documentada, emenda no mesmo dia, commit, próxima rodada. O detalhe que sustenta tudo é que o prompt da rodada seguinte exige verificar se as resoluções anteriores foram de fato refletidas nos documentos. O revisor relê tudo e cobra resolução por resolução. Uma correção prometida na triagem mas ausente no texto vira achado novo. O plano não pode fingir.

Esse desenho é primo direto do que já descrevemos em [autonomia agêntica governada](/blog/2026-08-01-governed-autonomy-distributed-systems): autonomia com gates humanos nos pontos que importam.

## Os números

Foram 58 rodadas em 3 dias corridos, 257 achados triados um a um, e zero achados críticos em todas as rodadas. A curva não desceu em linha reta. A primeira rodada trouxe 12 achados; por volta da vigésima o plano oscilava entre 2 e 5; entre as rodadas 29 e 34 a contagem voltou a subir, com picos de 7 e 8, exatamente sobre a maquinaria que depois decidimos extrair ou retirar; da rodada 45 em diante a série foi 3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 3, 2, e então zero.

Para contexto: esta foi a segunda missão a passar pelo loop. A primeira, o plano de estados de execução externa do mesmo produto, passou em 25 rodadas. O programa inteiro soma 83 rodadas de revisão adversarial em uma semana, tudo sobre documentos de arquitetura, antes de qualquer linha de implementação.

## O que um revisor incansável encontra

A objeção óbvia é que 58 rodadas seriam pedantismo. A resposta está na qualidade do que apareceu depois da rodada 20, quando um revisor humano já teria aprovado por cansaço:

- O SvelteKit só chama `handleError` para erros inesperados, então nosso ponto de emissão de telemetria deixaria escapar um `error(503)` esperado. O revisor citou o código-fonte do framework.
- A opção `run.bun = true` do bunfig cria um alias recursivo de `node` para Bun, o que rodaria o CLI do Playwright, nossa única exceção Node declarada, sob o runtime errado. E omitir a flag não basta: o Bun faz merge raso com a configuração global da máquina.
- O digest de uma imagem OCI não é uma identidade única. Proveniência de build gera um index cujo digest difere do manifesto implantável, e o `imageID` do Kubernetes adiciona uma terceira camada. Nossas igualdades exigidas comparavam objetos diferentes.
- As conditions do ExternalSecret v1 não expõem `observedGeneration`. O predicado de frescor que escrevemos bloquearia para sempre, ou seria enfraquecido na implementação. De novo, citação da API oficial.
- O coletor de logs que íamos usar como fronteira permanente de privacidade chegou ao fim de vida em março. Trocamos pelo sucessor suportado antes de escrever uma linha.
- Numa aritmética de gerações de compare-and-set, contamos mais 11 onde duas transições bifásicas somam mais 13. O revisor refez a conta.

Nenhum desses seis sobreviveria a um teste de fumaça em produção. Todos sobreviveriam a um code review humano típico.

## A lição: o loop ensina a remover

O padrão mais valioso das 58 rodadas foi este: sempre que um subsistema entrava em espiral, cada correção abrindo dois problemas novos por três rodadas seguidas, a resposta certa nunca foi a nona camada de correção. Foi retirada. Fizemos isso oito vezes, e cada retirada está registrada no próprio plano com a justificativa por extenso.

| Rodada | O que saiu | O que entrou no lugar |
| --- | --- | --- |
| 19 | Coletor de evidência dentro do cluster, com RBAC entre namespaces | O operador com um script fixado: a automação removida era cerimônia, não controle |
| 20 | Tabela nova de eventos no banco | Schema congelado; evidência por identidade de pod e varredura de logs |
| 21 | Sonda ativa de sessão em produção | Vetores de compatibilidade em CI como prova; produção como evidência passiva tipada |
| 30 | Modo de recuperação por restore de banco | Proibido: rewind apaga um ledger append-only; recuperação só para frente |
| 31 | Maquinaria inteira de releases incompatíveis | Compatibilidade como requisito de publicação; o resto deferido a um ADR futuro |
| 34 | Contrato de release de regime permanente, crescido dentro do plano | Extraído para um ADR companheiro, com checkpoint próprio e gate que falha fechado |
| 40 | Gerações imutáveis de Secrets, cutovers drenados, verificadores | Detecção por metadados mais disciplina do operador: prevenção brigava com a plataforma |
| 45 | Job de fingerprint com chave HMAC | Prova nativa do controller: o ciclo de vida da chave era superfície de ataque própria |

Repare no que essas oito linhas têm em comum. Em todas, a versão retirada era mais impressionante no papel. O loop forçou a pergunta que planos raramente respondem: quem executa isto, com que credencial, em que ordem, e o que acontece quando falha no meio? Quando a resposta honesta era um castelo de cartas, o castelo caía. É a mesma disciplina de evidência que defendemos em [auditoria ou telemetria](/blog/2026-08-01-auditoria-ou-telemetria): o que não se sustenta como registro executável não conta.

## O playbook que fica

- Veredito literal, sempre. Cada rodada termina com uma linha padronizada e contagens. Sem "parece bom": ou passa, ou não passa, com números.
- O prompt seguinte cobra o anterior. Resolução alegada e não refletida é achado. Isso transforma triagem em contrato.
- Zero críticos é o sinal de saúde. Em 83 rodadas do programa, nenhum achado crítico: a arquitetura de base aguentou; o loop lapidou executabilidade.
- Espiral de três rodadas pede retirada, não correção. Se o mesmo subsistema gera achados novos por três rodadas, o design está errado, não incompleto.
- Honestidade declarada vence garantia fingida. O revisor aceitou repetidamente "este residual existe, está limitado por X e dito por extenso", e rejeitou toda garantia que o mecanismo não sustentava.
- Escopo é ferramenta de convergência. Extrair o contrato de regime permanente para um ADR próprio devolveu o checkpoint ao tamanho da missão e destravou a reta final.

## O que vem agora

Com o checkpoint de arquitetura fechado, a missão entra em implementação sob o mesmo processo: um checkpoint no slice vertical, outro no final, e só então a mudança de infraestrutura, o canário em produção, o soak de um ciclo semanal completo e a aposentadoria do runtime antigo.

Dois modelos em adversário, um humano na triagem, e a regra de que nada passa sem virar texto executável. O resto é repetição barata. É isso a Engenharia de Loop.

Se esse tipo de processo interessa para os seus sistemas, [fale com a RBX](/contato). E para acompanhar as próximas notas de campo, o [Journal](/journal) tem RSS.
