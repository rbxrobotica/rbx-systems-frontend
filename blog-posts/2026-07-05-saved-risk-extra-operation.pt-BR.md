---
title: 'Risco economizado vira operação extra'
date: '2026-07-05'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, risco, produto, política, trading]
excerpt: 'O Robson garantia 4 operações por mês. Agora cada entrada é cobrada pelo risco real, e o orçamento que sobra vira nova chance de operar. A matemática está aqui.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-05-saved-risk-extra-operation.jpg'
---

Desde a primeira versão da política de risco, o Robson prometia 4 operações novas por mês. O número não era arbitrário: o orçamento mensal de perda é 4% do capital base, e cada operação carrega um teto de perda de 1%. Quatro é a divisão de um pelo outro.

Essa conta assumia que toda operação custava o teto cheio. Deixou de ser verdade. O ADR-0043, publicado neste fim de semana, muda a regra de admissão: cada entrada passa a ser cobrada pelo risco real que carrega, e o orçamento economizado vira capacidade para operar de novo. O piso de 4 chances por mês continua garantido. O que mudou é que ele virou piso, não teto.

## De onde vinham os 4 slots

O Robson dimensiona posições a partir de um stop técnico extraído do gráfico. A distância até o stop, somada aos custos de execução, determina o tamanho: se o stop executar, a perda fica no máximo em 1% do capital. Com 4% de orçamento mensal e 1% por operação, o mês comportava 4 piores casos.

O motor de risco já contabilizava o consumo real do orçamento. Uma operação que stopou com perda de 0,6% debita 0,6%, não 1%. Um trailing stop que avança até o breakeven zera o risco latente da posição e devolve orçamento. Mas a porta de entrada continuava pessimista: para admitir uma operação nova, o sistema exigia que sobrasse 1% inteiro de orçamento, porque no momento da contagem o stop da próxima operação ainda não existia.

## O que a regra antiga desperdiçava

Esse pessimismo tinha dois custos concretos.

O primeiro era a cauda do orçamento. Num capital base de 10.000 USDT, o orçamento mensal é 400 USDT. Se o mês consumiu 320, sobram 80: menos que uma unidade cheia de risco. A regra antiga negava qualquer entrada nova, mesmo uma cujo pior caso custasse 60.

O segundo era mais agressivo. O circuito de parada mensal disparava quando o orçamento restante ficava menor que uma unidade cheia. Com 99 USDT de orçamento vivo, o sistema encerrava o mês inteiro: fechava posições e bloqueava entradas até a virada do calendário. Orçamento real ficava na mesa, protegendo ninguém.

Enquanto isso, as regras de entrada evoluíram. Como documentamos no [artigo anterior](/blog/2026-07-03-stops-that-survive-failures), o dimensionamento passou a precificar o pior caso realizável: distância do stop, folga de gap e taxas de ida e volta, tudo dentro do 1%. Na prática, limites de margem e filtros da exchange fazem o risco planejado de muitas entradas ficar abaixo do teto. O sistema conhecia o risco real de cada operação antes de admiti-la e escolhia ignorar essa informação.

## A decisão: cobrar o risco real na entrada

O ADR-0043 troca a reserva pessimista pela cobrança exata:

```
orçamento_restante = orçamento_mensal - perdas_realizadas - risco_latente
admite a entrada se orçamento_restante >= risco_planejado
```

O risco planejado é o mesmo número que o dimensionamento calcula: a perda por unidade no pior caminho, multiplicada pela quantidade final da ordem. Nenhuma estimativa nova entra no sistema. O gate passa a usar o valor que sempre esteve disponível um passo antes dele.

Dois detalhes de engenharia merecem registro. Primeiro, uma operação que chegue ao gate sem risco precificado reserva o teto cheio de 1%, o comportamento antigo. O fallback é conservador por construção. Segundo, a primeira rodada de testes negou todas as entradas: no caminho dimensionado por risco, a quantidade é o orçamento dividido pela perda por unidade, e o arredondamento decimal do quociente fazia a multiplicação de volta passar um fio acima do teto. O risco planejado é truncado no teto na origem, porque o dimensionamento garante o limite por construção e o excesso era artefato de arredondamento, não risco.

## O que não muda

As invariantes da política ficam intactas:

- O teto de 1% por operação permanece. Risco planejado acima do teto nunca é admitido, com qualquer orçamento.
- O limite mensal de 4% permanece rígido. Como o risco latente é cobrado na admissão e já precificado com custos, uma sequência de stops não fura o orçamento.
- Nenhum limite novo entra. Sem teto de entradas por dia, sem teto de operações por mês. O orçamento é a única restrição, por decisão explícita de produto.

A parada mensal ganhou semântica mais honesta: ela dispara quando o orçamento zera de fato, não quando a sobra fica menor que um pior caso hipotético. Uma operação que não cabe no que restou é negada e o detector rearma com o backoff padrão. O mês continua vivo para oportunidades menores, ou para o orçamento que stops avançando ao breakeven liberam.

## O piso continua sendo 4

A promessa mínima é aritmética: 4% dividido por 1% garante 4 piores casos por mês, sempre. O contador de slots do painel passa a mostrar exatamente isso, o mínimo garantido de entradas cheias que ainda cabem. Ele é um piso para leitura rápida, não um teto de operação.

A promessa de produto ficou assim: no mínimo 4 chances por mês. Risco economizado vira operação extra. Tudo acima de 4 é conquistado por entradas que arriscaram menos que o teto, com o mesmo limite mensal de sempre.

## O que fica

A reserva pessimista era a decisão certa quando o sistema não conhecia o risco da próxima operação no momento da contagem. Quando o pipeline passou a precificar o pior caso real antes do gate, manter a reserva virou desperdício, não prudência. Cobrar o pior caso duas vezes não protege ninguém duas vezes.

Como no ciclo anterior, a decisão foi registrada em ADR antes do código, implementada com engenharia assistida por agentes e revisada linha a linha antes do merge. O limite de 4% ao mês segue sendo a invariante que nenhuma otimização pode tocar. Dentro dele, cada ponto-base economizado agora tem para onde ir.
