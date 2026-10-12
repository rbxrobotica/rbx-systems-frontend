# Revisão do rascunho: consulta humana por IRC

Data: 2026-10-12. Estado: rascunho bilingue para revisão, sem publicação.
Pedido: atualizar a documentação agnóstica após o merge e escrever um post para
o Journal da RBX. Não houve pedido de publicar no site ou em redes sociais.

## Artefatos e proveniência

- Slug de armazenamento proposto: `2026-10-12-irc-human-agent-sessions`.
- [Texto em português](2026-10-12-irc-human-agent-sessions.pt-BR.md) e
  [tradução em inglês](2026-10-12-irc-human-agent-sessions.en.md).
- Byline editorial: `RBX Systems`, `Engineering Team`. Não atribui a redação a
  uma pessoa nem representa aprovação humana já concedida.
- Redação assistida por Codex, OpenAI, família GPT-6 informada pelo ambiente.
  O identificador exato da variante desta sessão não está disponível na
  evidência consultada; não inferi-lo do modelo solicitado em outro piloto.
- Contexto de autoria: `rbx-systems-frontend`, documentação versionada de
  `rbx-infra`, regras do Journal e RBX Voice System v0.1. Tarefa de redação
  `journal_irc_draft`, nesta sessão coordenada por Codex. Sem alegação de
  auditoria institucional desta redação ou de medição de tokens da autoria.
- Voz: R2, post externo, com overlay R6. Esta nota usa R7 com overlay R6.
  Fontes e incertezas foram preservadas após a revisão de voz.

O diretório `docs/journal-drafts/` preserva o texto revisável antes de existir
uma capa publicada. O contrato do repositório proíbe um campo `cover` sem a
imagem efetivamente enviada ao S3. Os dois textos, portanto, omitem esse campo.
Não foi executado upload, publicação, alteração de conteúdo remoto ou deploy.

A capa tem fonte editável em
[`blog-covers-src/2026-10-12-irc-human-agent-sessions.svg`](../../blog-covers-src/2026-10-12-irc-human-agent-sessions.svg)
e entrada declarativa em [`covers.json`](../../blog-covers-src/covers.json).
A derivada prevista é `2026-10-12-irc-human-agent-sessions-v1.png`. Gerar ou
revisar esse arquivo localmente não o torna um objeto publicado.

## Evidência factual e limite de cada afirmação

Todas as fontes técnicas abaixo usam o merge de `rbx-infra`:
`03a99d8201542624fdf32c1b73a1cd070f6c906b`. PR 361 foi integrado em
`e057cc943c5abfec771b94cb743901d097e8ff28`; PR 362, no SHA citado acima.
Os fatos descrevem o checkpoint de 12 de outubro, não o estado operacional
futuro de serviços.

| Afirmação no texto | Evidência | Limite preservado |
| --- | --- | --- |
| Uma rodada supervisionada de pergunta e resposta foi exibida no Halloy | [Registro do piloto](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/docs/HUMAN-FLIGHTDECK-PILOT.md) | Captura confirma exibição; não mede latência visual, estabilidade prolongada ou múltiplas rodadas |
| Resposta preparada por subagente Codex com documentação Flight Deck | Mesmo registro, seções de proveniência e segunda janela | Não houve chamada ao backend Flight Deck, Maestro ou Thalamus no piloto IRC |
| Entrada legível, referência curta e metadados consultáveis | [Runbook da entrada humana](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/docs/HUMAN-QUERY-RUNBOOK.md) | Implementação opt-in, não instalada; modelo declarado não é atestado de inferência |
| Conta autenticada, sessão local, três perguntas em 600 segundos e consumo exclusivo | Mesmo runbook e [contrato](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/docs/IRC-AGENT-QUERY-CONTRACT.md) | Entrada IRC não abre sessão nem concede autorização a ferramentas ou missões |
| Persistência antes de publicar e tratamento conservador de incerteza | Mesmo runbook, limites e confiança | No máximo uma tentativa automática por frame; `socket_sent` não comprova exibição ou leitura |
| Uma consulta local pela autenticação ChatGPT solicitou `gpt-6.1-sol` | [Evidência da execução](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/pilots/evidence/codex-subscription-trial.json) | Campo `model_requested`; a evidência não traz confirmação do modelo efetivamente servido |
| 9,653 segundos; 8.161 tokens de entrada, 6.912 deles em cache; 178 de saída; total 8.339; prompt explícito de 2.191 bytes | Mesma evidência e [README dos pilotos](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/infra/irc/pilots/README.md) | Uma amostra; cache é subconjunto da entrada; total inclui contexto nativo; não estabelece economia ou desconto de cota |
| Três tentativas anteriores falharam sem uso informado | README dos pilotos e seus três arquivos de falha vinculados | Consumo desconhecido, não zero; sem retry automático |
| Pre/post-call no Thalamus local | README dos pilotos e evidência da execução | Política sintética, auditoria em memória, mediação do job completo; sem validação por inferência ou cota compartilhada |
| 170 testes de comunicação e 37 de pilotos passaram | [PR 362](https://github.com/rbxrobotica/rbx-infra/pull/362), head validado `8f6381feecbb3ca18d472304f10d28e9a86e1284`; [teste CI](https://github.com/rbxrobotica/rbx-infra/actions/runs/38199614631/job/114649878258) | Contagem de testes, não de casos reais; seis checks verdes do PR não comprovam implantação |
| Integração do consumidor, orçamento e ensaio real ainda pendentes | Runbook, contrato e [roadmap](https://github.com/rbxrobotica/rbx-infra/blob/03a99d8201542624fdf32c1b73a1cd070f6c906b/docs/network/local/ROADMAP.md) | O texto não apresenta serviço permanente, cliente corrigido ou economia comprovada |

## Gate promocional

A evidência técnica acima sustenta a revisão factual do rascunho. O registro
canônico `rbx-growth/marketing/2026-h2-growth/research/claims-register.md` não
contém entradas específicas para os novos resultados e capacidades deste
incremento. A entrada geral de governança pré/pós-chamada não autoriza ampliar
o experimento local para uma alegação de atendimento operacional.

Para `rbx-marketing-claim-validation`, as afirmações técnicas novas da tabela
pertencem à categoria A e permanecem **sem-evidencia no registro promocional**.
Isso identifica a ausência de uma entrada aprovada nesse registro, não a
ausência dos artefatos técnicos vinculados. Veredito promocional geral:
**FAIL para publicação**. Nenhum claim foi aprovado ou inserido no registro
por esta redação. Não há claims de retorno financeiro, clientes, rentabilidade
ou disponibilidade contínua no texto.

Antes de uso público, o responsável precisa aprovar as entradas aplicáveis no
registro e a redação final. A skill de Voice estabelece: "A factual claim has
no claims-register entry. Resume evidence: a claims-register id from
`rbx-marketing-claim-validation`." A skill de claims exige aprovação humana e
commit para mudanças no registro. O preparo deste rascunho não substitui esses
gates, nem inicia uma solicitação de publicação.

## Validação editorial

- Mesmos slug, data, tags, autor e papel nas duas variantes; sentido alinhado.
- Título PT-BR: 39 caracteres. Título EN: 36 caracteres.
- Excerpt PT-BR: 143 caracteres. Excerpt EN: 128 caracteres.
- O componente `src/routes/blog/[slug]/+page.svelte` injeta o H1 a partir do
  título. O corpo não declara outro H1.
- Quatro links internos por variante, conferidos nos arquivos e rotas deste
  checkout: artigo de evidência/autoridade, artigo de engenharia de loops,
  `/journal` e `/trust`. O artigo de loops tem alias público inglês
  `2026-08-31-loop-engineering`. Existência local não é uma nova checagem HTTP
  do conteúdo remoto.
- Tags canônicas existentes: `agents`, `governance`, `distributed-systems`,
  `engineering`.
- Uma CTA por variante, nenhum superlativo, aforismo ou pergunta retórica.
- Sem IPs, contas, hostnames internos, topologia, credenciais ou conteúdo de
  conversas privadas. Nomes de produtos e métricas derivam das fontes citadas.
- Lint de Voice v0.1: sem ocorrências de travessões, setas, emoji, exclamações
  ou vocabulário proibido nos dois textos. Inspeção semântica preserva limites
  da prova e estado não implantado.

Checks informados pela sessão coordenadora em 2026-10-12, após as alterações:

- 94 testes unitários passaram.
- `pnpm seo-check`: passou.
- Svelte: zero erros, zero avisos.
- Build: passou.
- Quatro checks da capa passaram, incluindo reprodução da fonte SVG.
- Instalação frozen com pnpm 9.15.9; lockfile inalterado. A tentativa com
  pnpm 11 encontrou incompatibilidade de ferramenta e foi substituída pela
  versão 9, sem atualização de dependências.
- SVG SHA-256:
  `1f170a1671bc51ae6ea77cb6c9e4992925930a0cbd446fe0bf9a0add641cfd59`.
- PNG local SHA-256:
  `e4ed75ff5352bb981f97edbdd2200e718a2085e578f04d148bfdfddc1168334f`.

Esses checks foram executados pelo coordenador, não pelo agente de redação.
A revisão independente solicitou preservar a ordem de backup/retorno,
instalação controlada e aceitação com consumidor supervisionado antes da
integração automática. As duas variantes foram alinhadas a essa sequência.

## Versão curta para LinkedIn, pendente de aprovação

### Português

Uma pergunta por IRC recebeu uma resposta de um subagente Codex com contexto
documental do Flight Deck. O piloto confirmou uma rodada exibida no cliente.

O incremento seguinte implementa sessões de até três perguntas em dez minutos,
identidade autenticada, consumo exclusivo e resposta persistida antes do envio.
Ainda está desativado por padrão e sem implantação. Resultado incerto exige
reconciliação; a conversa não concede autorização para executar trabalho.

Um ensaio separado mediu uma consulta por assinatura: 8.339 tokens no total.
Não há comparação de economia com o piloto anterior.

Acompanhe os registros no [RBX Journal](https://rbx.ia.br/journal).

Governança e evidências: [Trust Center](https://rbx.ia.br/trust) e
[incremento integrado](https://github.com/rbxrobotica/rbx-infra/pull/362).

### English

An IRC question received an answer from a Codex subagent given Flight Deck
documentation. The pilot confirmed one round displayed in the client.

The next increment implements sessions of up to three questions in ten
minutes, authenticated identity, exclusive consumption and answers persisted
before transmission. It remains disabled by default and undeployed. Uncertain
outcomes require reconciliation; conversation grants no authority to execute
work.

A separate trial measured one subscription-backed query: 8,339 total tokens.
There is no savings comparison with the earlier pilot.

Follow the records in the [RBX Journal](https://rbxsystems.ch/journal).

Governance and evidence: [Trust Center](https://rbxsystems.ch/trust) and the
[merged increment](https://github.com/rbxrobotica/rbx-infra/pull/362).

As versões curtas herdam os mesmos limites factuais e o gate promocional
pendente. Não foram publicadas ou enviadas.

## Preparação futura para publicação autorizada

Depois das aprovações editoriais e de claims, conferir novamente o contrato
do Journal, mover as duas variantes para `blog-posts/`, publicar a derivada
versionada da capa e só então inserir sua URL real e idêntica nos dois
frontmatters. Validar as variantes, a capa, o SEO e os links antes do upload
dos posts. A publicação exige autorização própria; este documento não a
concede nem recomenda executar os scripts durante a revisão do PR.
