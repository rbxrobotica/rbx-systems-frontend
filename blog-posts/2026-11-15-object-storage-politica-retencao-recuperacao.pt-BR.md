---
title: 'Object Storage: política, retenção e recuperação'
date: '2026-11-15'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engineering, resilience, governance, storage]
excerpt: 'Como transformar criticidade e retenção em cópias automáticas, proteção contra exclusão e recuperação entre provedores.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-11-15-object-storage-politica-retencao-recuperacao-v1.png'
---

Uma empresa precisa conseguir recuperar seus dados quando um fornecedor, uma conta ou uma máquina deixa de estar disponível. Também precisa controlar o custo de preservar esse patrimônio. Guardar todos os arquivos e todas as versões para sempre consome recursos sem distinguir o que sustenta a operação do que já cumpriu sua função.

A arquitetura que estamos qualificando na RBX começa com uma política por conjunto de dados. Ela descreve o que preservar, por quanto tempo, em quais destinos e como demonstrar a recuperação. Continua a discussão de [recuperar, mudar e provar](/journal/2026-08-26-recuperar-mudar-e-provar), com atenção ao armazenamento de objetos. O desenho é uma proposta de engenharia em qualificação, sem afirmar que todos os dados já estejam cobertos.

## Criticidade e retenção respondem a perguntas diferentes

Criticidade expressa o impacto da perda. Ela orienta a prioridade, o intervalo aceitável sem uma cópia recente e o tempo disponível para recuperar a função. Podemos trabalhar com três níveis: crítico, importante e de apoio. Uma dependência necessária à recuperação de um serviço crítico também precisa receber esse cuidado.

Retenção expressa por quanto tempo um dado ou ponto de recuperação precisa continuar disponível. Um estado operacional crítico pode exigir cópias frequentes com histórico de três meses. Um documento estratégico pode mudar raramente e precisar de preservação permanente.

| Conjunto | Política dos originais | Política dos backups |
| --- | --- | --- |
| Depuração efêmera | Prazo curto e explícito | Retenção curta ou exclusão justificada do backup |
| Estado operacional e uploads | Preservação enquanto necessários à função | Histórico de recuperação com janela definida |
| Registros estratégicos selecionados | Sem expiração automática | Cópias independentes e preservação de versões relevantes |
| Auditoria e evidências de incidentes | Prazo próprio conforme o valor da evidência | Histórico e exceções de preservação explícitos |

Esses exemplos não autorizam uma regra universal de exclusão. O nome de uma pasta não decide seu valor. Um log associado a um incidente pode precisar ser preservado, enquanto outro perde utilidade em poucos dias. Como discutimos em [logs voláteis e evidência](/journal/2026-07-12-volatile-logs-are-not-evidence), diagnóstico e prova operacional têm papéis diferentes.

## Como a política chega ao armazenamento

O provedor não interpreta sozinho o conceito de dado estratégico. A política precisa ser traduzida em configurações e procedimentos verificáveis.

Um catálogo versionado pode conter uma entrada como esta. Os nomes e valores são ilustrativos; o exemplo não é uma configuração ativa:

```yaml
dataset: documentos_operacionais
criticality: 1
source_ref: origem_aprovada
source_policy:
  automatic_expiration: false
backup_policy:
  capture: daily
  history_days: 90
  independent_provider_required: true
  deletion_enabled: false
```

As credenciais ficam em um mecanismo próprio de segredos, fora do catálogo. A aplicação usa uma identidade de conjunto de dados e um destino permitido. A classificação vem da configuração confiável do serviço; um cliente não recebe autoridade para reduzir a proteção enviando um parâmetro arbitrário.

Um adaptador traduz a política para os mecanismos compatíveis com cada destino. Parte vira configuração de infraestrutura, como permissões, versionamento ou retenção imutável. Parte vira configuração do executor, como frequência, seleção de versões, criptografia e verificação. Outra parte pertence ao procedimento de restauração e aos testes da aplicação.

Um rótulo ou tag ajuda a identificar dados, mas não comprova que a regra está sendo aplicada. O controlador deve comparar a configuração esperada com a observada e registrar divergências. Alterações destrutivas exigem uma etapa própria de revisão e ativação.

## Quem chama quem

A proposta separa a escrita operacional da preservação:

1. A aplicação grava os objetos na origem definida para seu conjunto de dados.
2. Um agendador independente inicia o executor de backup conforme a política aprovada.
3. O executor consulta a origem, captura um conjunto consistente e produz um manifesto de cobertura e integridade.
4. Ele envia o material protegido aos destinos e verifica cada resultado separadamente.
5. Um monitor externo acompanha a idade da última cópia utilizável, as falhas e os exercícios de recuperação.

O executor recebe somente os acessos necessários à tarefa. O produtor cotidiano não deve poder apagar todas as cópias históricas nem reduzir sua retenção. A recuperação usa uma identidade e um procedimento próprios. A chave necessária para abrir o backup também precisa existir fora do fornecedor cuja perda estamos tentando suportar.

Eventos podem antecipar uma captura, mas a reconciliação periódica continua importante para detectar eventos perdidos e conjuntos esquecidos. Uma listagem paginada de objetos não equivale a uma fotografia consistente da aplicação. Bancos de dados, objetos e referências entre eles precisam de um contrato de captura adequado.

## Até onde o fluxo é bidirecional

Podemos ter dados originados no provedor A com backup no B e outros dados originados no B com backup fora dele. Cada conjunto mantém uma origem autoritativa e uma direção de captura conhecida.

A restauração faz o caminho de volta, ou segue para um terceiro destino, como uma operação explícita. Ela não transforma automaticamente o arquivo histórico em uma nova origem de produção.

Replicação bidirecional pode atender uma aplicação que realmente precise escrever em mais de um local. Nesse caso, conflitos, exclusões, ordem dos eventos e troca de origem precisam de regras próprias. Essa capacidade de disponibilidade deve coexistir com um histórico recuperável que sobreviva a uma alteração indesejada.

O objetivo é automatizar a preservação sem fazer uma exclusão na origem destruir imediatamente as versões que permitem desfazê-la.

## O formato do backup determina a retenção segura

Arquivos de exportação fechados, repositórios incrementais e bancos de dados exigem tratamentos diferentes.

Uma exportação criptografada pode receber uma retenção imutável delimitada, depois de testar as permissões e o comportamento do destino. Já um repositório como Restic mantém blocos compartilhados entre snapshots. Apagar um bloco apenas porque ele é antigo pode quebrar um snapshot recente que ainda o utiliza. Nesse caso, a retenção precisa ser aplicada pelo software que entende essas referências.

Versionamento e Object Lock também têm funções distintas. Versionamento preserva versões enquanto elas continuam retidas. Object Lock pode impedir a exclusão de versões protegidas durante um período, conforme o modo e as permissões. Ambos precisam ser qualificados com a ferramenta real. Nenhum deles substitui uma cópia acessível fora daquele fornecedor.

## Recursos finitos fazem parte do desenho

Dimensionamos armazenamento usando o volume atual, as versões necessárias, o crescimento observado, a retenção e a folga para operar e recuperar. Compressão e deduplicação entram na conta depois de medidas. Uma cópia completa diária mantida por noventa dias pode custar muito mais que um histórico incremental.

Para dados críticos, buscamos a origem e duas cópias de recuperação sob falhas independentes. Uma delas pode ser uma mídia criptografada, rotacionada e desconectada em outro local. Se o volume ou a frequência tornarem isso impraticável, outro destino online protegido pode complementar um kit essencial offline. A cobertura e a idade de cada cópia precisam ficar explícitas.

| Falha | Comportamento esperado |
| --- | --- |
| Origem indisponível | Preservar as cópias existentes e alertar sobre o atraso |
| Um destino indisponível | Registrar a cobertura incompleta e tentar novamente sem declarar sucesso global |
| Executor parado | O monitor externo detecta a ausência da execução esperada |
| Política ou acesso divergente | Suspender a ação incompatível e registrar a diferença |
| Restauração falha | Manter a lacuna visível e corrigir o caminho antes de afirmar recuperabilidade |

Preservação permanente também exige manutenção: conferir integridade, testar ferramentas e formatos, recuperar chaves e substituir mídias. O compromisso é manter o material estratégico utilizável ao longo do tempo.

## Como demonstrar que funciona

A qualificação começa com um conjunto limitado e conhecido. Exercitamos sobrescrita e exclusão em dados descartáveis, verificamos a proteção das versões e restauramos em um ambiente isolado, sem as credenciais da origem perdida. Conferimos os bytes, os metadados necessários e as leituras da aplicação.

Depois medimos a perda de atualização e o tempo real de recuperação. Repetimos o exercício para a perda de cada fornecedor relevante. A cobertura aumenta a partir dessas evidências, com custos e exceções registrados por conjunto.

Para estruturar essa política em uma operação existente, [converse com a RBX](/contato). O primeiro trabalho é descobrir o que precisa sobreviver, localizar suas dependências e demonstrar um caminho de recuperação.

Referências técnicas: [verificação de recuperação da AWS](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_backing_up_data_periodic_recovery_testing_data.html), [Object Lock no Backblaze B2](https://www.backblaze.com/docs/cloud-storage-object-lock) e [cópia entre repositórios Restic](https://restic.readthedocs.io/en/stable/045_working_with_repos.html).
