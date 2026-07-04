---
title: 'Uma entrada, quatro bugs: uma noite de depuração em produção no Robson'
date: '2026-07-04'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, execução, risco, depuração, trading]
excerpt: 'Publicamos uma nova camada protetora para o motor de stops e usamos entradas reais para validá-la. A primeira ordem foi rejeitada pelo nosso próprio gate de risco, por uma margem de 0,0000000000000000000002. Três outros bugs se escondiam atrás desse.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-04-one-entry-four-bugs.jpg'
---

Ontem publicamos o invalidation guard, uma nova camada protetora para o motor de stops do Robson. Para validá-lo, o operador executou uma sequência de entradas reais em produção enquanto um agente monitorava logs, eventos e a exchange em tempo real. A primeira ordem nunca chegou à Binance. A segunda chegou e foi rejeitada. A terceira também. A quarta ativou sem ressalvas.

Cada rejeição era um bug distinto. Cada bug era invisível até o anterior ser corrigido. Este artigo documenta a cadeia, porque o padrão é mais interessante do que qualquer correção isolada.

## A feature: o stop precisa superar o último extremo

O Robson deriva o stop da estrutura do gráfico: o segundo nível de swing confirmado no gráfico de 15 minutos. Um short real de BTCUSDT expôs um ponto cego nessa regra. O analisador escolheu um stop técnico em 62.214,70 enquanto uma máxima recente estava em 62.386,70, acima do stop. Um simples reteste dessa máxima encerraria um trade ainda válido.

O buffer de stop executável que já tínhamos não resolvia isso. O buffer desloca a execução a partir do nível escolhido. O problema era qual nível foi escolhido. Alargar o índice de swing do analisador mudaria o modelo de gráfico globalmente, o que é pior.

O invalidation guard é uma camada separada, aplicada depois da análise. Quando habilitado, ele amostra o extremo adverso recente, a maior máxima para shorts ou a menor mínima para longs nos últimos vinte candles de 15 minutos incluindo o candle em formação, e trava o stop efetivo além desse extremo. O dimensionamento da posição paga pela distância maior, então o teto de perda de 1% se mantém. Se o guard alargar o stop além do máximo da política, a entrada é rejeitada. A regra técnica em si permanece intocada, e o guard é liberado no primeiro avanço do trailing.

Três agentes implementaram a partir de um plano revisado, em paralelo onde os arquivos permitiam. A suíte completa de testes do workspace, um smoke local de ponta a ponta contra um Postgres real e uma revisão de código foram os portões do merge. Só o smoke capturou três lacunas de integração antes de o código chegar a qualquer cluster.

## Ato um: o gate rejeitou o próprio dimensionamento

A primeira entrada em produção foi cancelada pelo próprio gate de risco do Robson: margem insuficiente. Os números no log eram suspeitos. A margem inicial calculada excedia o capital disponível em 2e-22.

A causa era um round trip de Decimal. Quando um stop apertado faz a quantidade dimensionada por risco superar o que a conta comporta a 1x de alavancagem, o dimensionamento trava a quantidade em capital dividido pelo preço de entrada. A divisão arredonda em 28 dígitos significativos. O gate de risco então recalcula a margem como quantidade vezes preço de entrada, e esse produto pode cair um fio acima do capital de onde a divisão partiu. O gate comparava de forma estrita e rejeitava exatamente a quantidade que o dimensionamento havia escolhido.

Toda entrada travada pela margem era silenciosamente impossível. Ninguém havia percebido porque as validações anteriores rodavam com capital sintético pequeno e stops largos, onde a quantidade por risco nunca tocava o teto. A primeira entrada com capital real e stop apertado encontrou o bug em minutos.

A correção trunca o teto de margem em oito casas decimais, mais fino que qualquer step de quantidade de exchange. Com a quantidade truncada, o produto é exato na aritmética Decimal e comprovadamente cabe no capital. O teste de regressão usa os números exatos da entrada rejeitada.

## Ato dois: cem por cento da carteira não é executável

Com o gate satisfeito, a entrada seguinte chegou à Binance e voltou com o erro -2019, margem insuficiente. Desta vez era a exchange dizendo não.

O dimensionamento havia travado a posição em cem por cento da carteira. Numa exchange real essa ordem não executa. A taxa taker é cobrada do saldo disponível, e a margem inicial é calculada pelo mark price com uma folga de pior preço, não pelo fechamento do último candle que o daemon usou como referência. Qualquer divergência, e sempre existe alguma, empurra o custo da ordem para além da carteira.

O teto de margem agora reserva uma folga configurável, um por cento por padrão, para que a taxa da exchange e a folga de preço caibam dentro do saldo. Só entradas travadas pela margem mudam. Entradas dimensionadas por risco nunca foram afetadas.

## Ato três: o livro-razão não é a carteira

A terceira entrada foi rejeitada com o mesmo -2019, e foi a falha mais informativa da noite. A folga estava funcionando. Os números, não.

O Robson ancora o orçamento de risco em uma base de capital mensal, uma fotografia tirada no início do mês. Isso é deliberado: perdas governadas durante o mês são registradas, mas não encolhem o orçamento de 1% por trade. O código de dimensionamento, porém, usava esse mesmo valor do livro-razão como base do teto físico de margem. A carteira viva era menor que o livro-razão exatamente pela perda realizada do mês, cerca de 1,55%. A folga de um por cento não conseguia absorver uma diferença de 1,55%, e nenhuma folga fixa conseguiria.

Dois conceitos estavam misturados. O capital de política responde quanto podemos arriscar. A carteira responde quanto a exchange vai fisicamente deixar a posição ocupar. A correção separa os dois: o dimensionamento por risco mantém o capital de política, e o teto de margem passa a usar o saldo disponível vivo da exchange, limitado por cima pelo capital de política, consultado no momento da decisão e com um fallback seguro se a chamada falhar. A quarta entrada ativou: gate aprovou, ordem executou, stop de seguro descansando na exchange.

## Ato quatro: o buffer encontra a exchange real

Com o pipeline comprovado, habilitamos o guard e o buffer de dez pontos-base na configuração de produção. O restart derivou de novo o stop executável da posição viva e encontrou imediatamente mais dois bugs, desta vez no adaptador da exchange.

Primeiro, a etapa de cancelamento da substituição do stop falhou ao interpretar a resposta da Binance. A API devolve o campo code como a string "200" onde o cliente esperava um inteiro. O erro de parse apareceu depois de a exchange já ter cancelado o stop antigo, então a substituição abortou entre o cancelamento e a colocação. A posição ficou sem a proteção do lado da exchange, vigiada apenas pelo monitor de software.

Segundo, quando o caminho tolerante tentou de novo a colocação, a Binance rejeitou o novo stop com o erro -1111, precisão acima do máximo. Um preço de stop com buffer é um deslocamento em pontos-base e cai em valores como 62.873,86105. Futuros de BTCUSDT aceitam duas casas decimais.

Avisamos o operador imediatamente e deixamos a decisão sobre a posição exposta com ele, em vez de decidir por ele. As correções são pequenas e precisas. Preços de disparo de stop agora são normalizados para a precisão de preço do símbolo, arredondando para longe da posição, de modo que a normalização nunca aperta um stop. O parser da resposta aceita as duas codificações do campo code. No rollout seguinte, o heal de inicialização recolocou o stop de seguro na exchange, e desta vez a Binance aceitou.

## O que a cadeia ensina

Quatro bugs de produção, nenhum deles na feature que estávamos publicando. Os quatro viviam no caminho de dimensionamento travado por margem e no caminho de substituição de stops, código que passava em toda validação sintética havia meses. Três lições sobreviveram à noite.

Falhas em camadas se escondem umas atrás das outras. Não existia execução de teste capaz de revelar o bug três enquanto o bug um ainda rejeitava toda ordem antes de ela chegar à exchange. A sondagem sequencial ao vivo, uma correção por falha, cada correção mergeada com um teste de regressão carregando os números exatos de produção, foi o caminho honesto mais rápido.

Limites físicos e livros-razão de política são objetos diferentes. Qualquer número que autoriza uma ação no mundo real precisa vir do mundo real no momento da decisão. O livro-razão é para a política. A carteira é para a física.

Uma resposta de exchange é um contrato que se interpreta com defesa. Um campo que chega como string onde um inteiro foi prometido deve degradar com elegância, principalmente quando o código que o interpreta roda entre cancelar uma proteção e recolocá-la. O erro de parse mais perigoso é o que dispara depois do efeito colateral.

O invalidation guard está vivo em produção, vigiando os extremos que a regra de gráfico não enxerga. Foi preciso uma noite e quatro ordens rejeitadas para merecer essa frase.
