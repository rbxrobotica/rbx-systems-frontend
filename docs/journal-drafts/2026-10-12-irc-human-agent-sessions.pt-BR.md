---
title: 'Uma conversa por IRC precisa de limites'
date: '2026-10-12'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [agents, governance, distributed-systems, engineering]
excerpt: 'Um piloto entre humano e agente orientou sessões de consulta por IRC, com identidade, correlação e tratamento explícito de resultados incertos.'
---

Em 11 de outubro, um operador da RBX enviou uma pergunta por IRC sobre a diferença entre aprovar uma Action e executar uma Mission no Flight Deck. Um subagente Codex consultou a documentação do projeto, preparou a resposta e a devolveu ao coordenador. O coordenador publicou três trechos no canal. Uma captura posterior do Halloy confirmou a exibição.

Esse resultado demonstrou uma consulta supervisionada, com uma rodada completa. O backend do Flight Deck não participou. O interlocutor era um subagente com contexto documental do produto, criado para aquele ensaio. Encerrada a janela de atendimento, ele não permaneceu escutando o canal.

O [registro do piloto](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/docs/HUMAN-FLIGHTDECK-PILOT.md) preserva essa distinção. Ela determina o que o sistema pode afirmar sobre a origem de uma resposta e sobre a autoridade de quem responde.

## Da mensagem à consulta

O protocolo do ensaio exigia que o humano colasse identificador e horário junto da pergunta. A resposta aparecia fragmentada, com dados de transporte no texto. A experiência funcionou, mas transferia ao operador detalhes que pertencem ao adaptador.

O incremento integrado em 12 de outubro adiciona uma entrada legível por menção a um papel de agente. O adaptador gera a correlação e apresenta uma referência curta na resposta. Essa referência permite consultar a sessão, a revisão documental, o modelo declarado e o estado da entrega. O nome do modelo registrado pelo coordenador continua sendo metadado declarado, sem comprovar qual inferência ocorreu.

A implementação está desativada por padrão e ainda não foi instalada. Abrir uma sessão exige uma ação local explícita. Uma mensagem no canal não inicia um modelo nem cria um atendimento por conta própria. Esse recorte mantém separadas as responsabilidades discutidas em [Evidência não é autoridade](/blog/2026-08-07-evidence-authority-boundaries).

## Identidade e tempo antes da inferência

O acesso usa a conta autenticada pelo servidor, o canal permitido e uma sessão ativa. O apelido visível não concede acesso. Histórico, mensagens privadas e conversas sem endereçamento ao agente ficam fora da admissão. O adaptador exige identificador e horário fornecidos pelo servidor para verificar repetição e atualidade.

A sessão admite até três perguntas em 600 segundos. Apenas um consumidor reserva o atendimento, e uma consulta fica em processamento por vez. A conclusão exige a posse válida dessa reserva, com um token que impede um consumidor antigo de publicar depois de perder sua vez.

A sessão autoriza apenas a consulta previamente delimitada; a admissão de uma mensagem não amplia essa autorização. Texto no IRC não concede permissão para executar comandos, alterar código ou iniciar missões. A consulta documental continua separada dos contratos de aprovação e execução do produto, inclusive quando o assunto da conversa são esses contratos.

## Persistir antes de publicar

A resposta é registrada antes do envio. Cada trecho recebe no máximo uma tentativa automática. Se o processo falha em um ponto no qual a entrega ou uma chamada externa pode ter ocorrido, o estado passa a exigir reconciliação. A sessão não repete o trabalho automaticamente para tentar descobrir o resultado.

Há uma consequência operacional: diante da dúvida, a disponibilidade diminui até que o responsável verifique o ocorrido. Essa escolha evita transformar uma reconexão em uma segunda chamada sem contabilização ou em respostas repetidas. O mesmo princípio orienta a [engenharia de loops](/blog/2026-08-31-engenharia-de-loop): cada avanço precisa de um estado verificável.

Também há limites na evidência de transporte. Escrever no socket não comprova que o cliente desenhou a mensagem, e presença no histórico não mede a atualização da janela. O piloto confirmou exibição por captura, sem medir latência visual nem resolver o relato de instabilidade prolongada do Halloy.

## Assinatura também precisa de medição

Em um ensaio separado do IRC, uma consulta local usou a autenticação ChatGPT existente no Codex CLI. A execução solicitou `gpt-6.1-sol`; a telemetria não informou o identificador exato do modelo efetivamente servido. A resposta validada levou 9,653 segundos na CLI.

Foram registrados 8.161 tokens de entrada, dos quais 6.912 em cache, e 178 de saída: 8.339 no total. Cache é parte da entrada. O prompt explícito tinha 2.191 bytes, mas o total incluiu o contexto nativo do executor. Portanto, reduzir o texto fornecido não basta para conhecer o consumo completo.

O piloto anterior não mediu tokens. Não existe, nesta evidência, comparação de economia. Três tentativas anteriores falharam sem telemetria de uso; seu consumo permanece desconhecido.

Nesse ensaio, o Thalamus verificou o trabalho completo da CLI antes e depois, com política sintética e auditoria em memória. O experimento não demonstrou mediação de cada inferência interna nem controle de cota compartilhada. Seus [resultados e limites](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/pilots/README.md) foram preservados junto do código.

## O próximo teste tem critérios próprios

As verificações do incremento passaram em 170 testes de comunicação e 37 testes dos pilotos. Isso ainda não comprova o novo percurso no servidor e no cliente reais. A próxima etapa é preparar backup e retorno, instalar de forma controlada e testar com um consumidor supervisionado. Esse ensaio precisa verificar abertura, parada, expiração, entrega e recuperação. Integração automática do executor e reserva de orçamento compartilhado vêm depois. A estabilidade prolongada do cliente continua uma investigação separada.

O resultado é uma base implementada para consultas delimitadas. A passagem para atendimento contínuo depende dessas evidências, mantendo explícitos o executor, o contexto e a autoridade de cada componente.

Acompanhe os próximos registros de engenharia no [RBX Journal](/journal).

Governança e evidências: [Trust Center](/trust), [PR 361](https://github.com/rbxrobotica/rbx-infra/pull/361) e [PR 362](https://github.com/rbxrobotica/rbx-infra/pull/362). Este relato descreve pilotos e código integrado; o novo atendimento permanece sem implantação.
