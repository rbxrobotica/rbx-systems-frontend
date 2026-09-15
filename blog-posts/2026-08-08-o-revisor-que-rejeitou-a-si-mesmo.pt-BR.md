---
title: 'O revisor que rejeitou a si mesmo'
date: '2026-08-08'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, dados, adr, robson, qualidade]
excerpt: 'Anteontem contamos como um plano de dados encolheu até sobrar só o essencial. O que veio depois foi mais interessante: construir o que sobrou sob revisão adversarial contínua, com dois modelos em papéis opostos. Um contrato passou por três vereditos, uma migration numerada errada quase quebrou o banco vivo, um SDK escondia o vencedor de uma corrida de escrita, e no meio disso o revisor encontrou um defeito no texto que ele mesmo tinha exigido. A história de por que certeza se compra por passe, e do momento certo de parar de comprar.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-08-o-revisor-que-rejeitou-a-si-mesmo-v2.png'
---

Anteontem contamos aqui a história do plano que encolheu: uma plataforma de dados inteira para o Robson, nosso motor de execução e risco que opera capital real, reduzida por revisão adversarial a duas tabelas copiadas com disciplina. O que não contamos é o que aconteceu quando começamos a construir o que sobrou. Encolher o escopo foi a parte fácil. A parte difícil foi descobrir quantas vezes um texto tecnicamente correto consegue estar errado.

## O método

Cada artefato desta fase, o contrato de dados, o registro de eventos, o perfil canônico de bytes, as migrations, o runbook, a ferramenta de conformidade, foi escrito por um modelo e atacado por outro, em papéis fixos: o Claude Fable 5, da Anthropic, implementa; o Codex da OpenAI, rodando GPT-5.6 Sol em esforço máximo de raciocínio, tenta quebrar. Nada segue para o operador sem um veredito explícito de pronto. E o veredito nunca é opinião: é lista numerada de defeitos, cada um com severidade e evidência apontando arquivo e linha, re-verificada de forma independente antes de qualquer correção.

## O que os passes pagaram

Uma migration nova chegou numerada sobre um número que já existia no repositório. Parece detalhe de nomenclatura; não é. O runner de migrations identifica cada uma exclusivamente pelo número, e a colisão teria falhado no banco vivo, com o sistema operando capital real, na primeira sincronização após o merge. O revisor pegou lendo, não implantando. Custo do achado: um passe. Custo do não achado: um incidente.

Um cliente de armazenamento fazia retry automático e silencioso. Em condições normais, cortesia; num teste de corrida entre quatro escritores concorrentes, veneno: uma primeira tentativa aplicada mas com resposta perdida seria repetida, o retry receberia a rejeição da precondição, e o verdadeiro vencedor da corrida apareceria como perdedor. O teste passaria mentindo. A correção foi desligar os retries e observar cada resposta exatamente uma vez.

O relógio do banco marcava a hora do início da transação, não do commit. Uma transação aberta às 23:59:50 e commitada depois da meia-noite insere uma linha dentro de uma janela que o exportador já tinha selado como imutável. Nenhum período de tolerância fixo resolve isso; virou uma cerca formal contra transações antigas, verificada antes e depois de cada snapshot.

E o mais fino de todos: um procedimento de limpeza selecionava índices para remover comparando as colunas. O revisor perguntou o que aconteceria com uma constraint de exclusão construída sobre as mesmas colunas, que se disfarça de índice comum nos catálogos. A resposta honesta era: seria removida. Plantamos quatro índices-isca num banco de teste, um equivalente exato e três impostores, e só aceitamos o procedimento quando ele escolheu exatamente um.

## O veredito contra o próprio veredito

No segundo passe sobre o contrato, o revisor rejeitou o texto de novo. Entre os defeitos novos, um se destacava: uma regra sobre janelas vazias que não tinha representação válida possível, porque duas exigências dela se contradiziam. O autor daquele trecho não era o implementador. Era o próprio revisor, que o tinha ditado, palavra por palavra, um passe antes. Ele apontou o defeito com a mesma frieza com que apontava os dos outros.

Esse momento vale mais que todos os bugs somados, porque destrói a fantasia de oráculo. Não existe revisor infalível, humano ou modelo. Existe processo que trata todo veredito como hipótese falsificável: referência pinada, evidência por afirmação, re-verificação independente, e a disposição de aplicar o método ao próprio método.

## Quando parar de comprar certeza

Ciclos de quatro a sete passes compraram muita certeza, a um custo real de tempo e cômputo. Quando os artefatos estabilizaram, mudamos a economia: um único passe crítico e denso, feito por uma segunda instância independente do Claude Fable 5, com contrato de saída rígido, limite de linhas, severidades, evidência obrigatória, e a instrução de declarar o que exige verificação de janela em vez de especular. O passe único continuou pagando: encontrou um comando de reload que podia ser inofensivo demais, silenciosamente sem efeito, e regras de acesso legadas, amplas, que anulariam por baixo o isolamento estreito que acabávamos de construir.

E quando dois revisores discordaram sobre o comportamento do reload, a arbitragem não foi retórica: perguntamos ao servidor. Os dois estavam meio certos, cada um olhando metade da configuração. A máquina que executa o código é o único revisor sem opinião.

## O critério que fica

Tudo desta fase está integrado, e as mudanças de schema atravessaram o pipeline normal até o banco vivo no mesmo dia, sem um segundo de indisponibilidade. Nada roda até a janela do operador; a última palavra continua humana. O que o processo comprou não foi perfeição, foi rastreabilidade do erro: sabemos quem afirmou o quê, com que evidência, e o que derrubou cada afirmação. Certeza se compra por passe. Sabedoria é saber em qual passe parar, e humildade é aceitar que, às vezes, o defeito mais importante da rodada está na frase que o próprio revisor escreveu.
