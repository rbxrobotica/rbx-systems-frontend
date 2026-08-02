---
title: 'O painel dizia Synced'
date: '2026-08-02'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [engenharia, gitops, kubernetes, argocd, deploy, confiabilidade]
excerpt: 'Nosso pipeline de deploy morreu e ficou quatro dias morto enquanto todos os painéis diziam Synced e Healthy. A anatomia de uma falha silenciosa, o que estava represado sem ninguém saber, e o critério que passamos a exigir de qualquer automação: quando ela quebrar, o que fica vermelho?'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-08-02-o-painel-dizia-synced.png'
---

Durante quatro dias, dez aplicações da nossa frota não receberam nenhum deploy. Merges aconteciam, imagens eram construídas e publicadas no registry, e nada chegava ao cluster. Nenhum alerta disparou. Nenhum job falhou. Todos os painéis do ArgoCD diziam a mesma coisa: Synced, Healthy.

Os dois estavam tecnicamente certos. E era exatamente esse o problema.

## Como descobrimos

Não foi um alerta. Foi disciplina de verificação: depois de mergear uma correção, fomos conferir de forma independente se ela tinha chegado à produção. A imagem nova existia no registry. O cluster rodava a imagem de quatro dias atrás. Entre uma coisa e outra, um elo da cadeia tinha simplesmente parado de existir.

O elo era o ArgoCD Image Updater, o componente que vigiava o registry e promovia imagens novas para o nosso repositório GitOps. Uma atualização de versão o havia substituído pela variante nova da ferramenta, que abandona o modelo de configuração por anotações e passa a exigir recursos dedicados. Nossas dez aplicações estavam configuradas no modelo antigo. O controller novo subiu, olhou em volta, registrou uma única linha de log dizendo que não havia nada para processar, e ficou quieto para sempre.

## Por que nenhum painel acusou

Aqui mora a lição. O ArgoCD responde a uma pergunta precisa: o cluster está igual ao que o Git descreve? Estava. O Git dizia "rode a imagem de quatro dias atrás" e o cluster rodava a imagem de quatro dias atrás. Synced, com razão.

O que nenhum painel perguntava era: **o processo que deveria estar mudando o Git está vivo?** A automação de promoção não tinha healthcheck que importasse, não tinha heartbeat, não tinha nenhum efeito observável quando parava. O modo de falha dela era a ausência de eventos, e ausência de eventos é indistinguível de "nada para fazer". Silêncio, nos dois casos.

Quando medimos o estrago, o silêncio tinha preço: um ambiente de sandbox estava sete semanas e dezenas de commits atrás da main. Um site em produção devia duas correções. E, de bônus, a investigação revelou três serviços internos apontando para a tag flutuante latest, o que significa que a versão em execução era simplesmente indeterminável. Nada disso aparecia em lugar nenhum.

## A troca que fizemos

Poderíamos consertar o controller: criar os recursos novos, migrar a configuração, seguir em frente. Escolhemos o contrário: aposentar a categoria inteira de automação silenciosa.

No padrão que adotamos, o repositório que constrói a imagem é o mesmo que a promove. No fim do build, o próprio CI abre o repositório GitOps, atualiza a referência da imagem para a tag exata que acabou de publicar, e faz o commit como bot. O ArgoCD continua fazendo o que faz bem: convergir o cluster para o que o Git manda.

As propriedades que compramos com essa troca:

- **Falha barulhenta.** Se a promoção quebrar, o job de CI do merge fica vermelho, no repositório certo, no commit certo, com o log do erro. Não existe mais o estado "quebrado e verde".
- **Trilha auditável.** Cada deploy é um commit no repositório de infraestrutura, com autor, hora e o merge que o disparou. A pergunta "o que está em produção e por quê" tem resposta em um git log.
- **Coerência estrutural.** A promoção acontece no mesmo job que publicou a imagem, então a tag promovida existe por construção. Uma classe inteira de erro, promover uma imagem que não existe, deixou de ser possível.
- **Um padrão só.** A frota inteira, doze repositórios, promove do mesmo jeito. Menos superfície para divergir, menos mecanismos para morrer em silêncio.

No primeiro dia do padrão novo, seis promoções automáticas aterrissaram sem um toque humano. O ambiente de sete semanas foi atualizado de uma vez. As tags flutuantes foram pinadas em versões exatas.

## O critério que fica

A pergunta que passamos a fazer para qualquer automação, antes de confiar nela: **se isto morrer agora, o que fica vermelho?**

Se a resposta for "nada", você não tem automação monitorada, tem uma esperança agendada. O painel verde só cobre o que ele mede, e quase nunca mede a saúde de quem o alimenta.

Ontem escrevemos aqui que auditoria não é telemetria, sobre os dados que o sistema guarda. Esta é a mesma lição na camada de cima, sobre as máquinas que movem esses dados: silêncio não é saúde. Nos dados e na automação, saúde é o que sobrevive a uma verificação independente.
