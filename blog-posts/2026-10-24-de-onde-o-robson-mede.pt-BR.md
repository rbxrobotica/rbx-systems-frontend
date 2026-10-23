---
title: 'De onde o Robson mede: um palmo não é o que parece'
date: '2026-10-24'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, trading, stop, execução, produto, engenharia]
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-24-de-onde-o-robson-mede-v1.png'
excerpt: 'O primeiro degrau do trailing stop subiu e a operação continuava 111 pontos no prejuízo. Não era um erro: eram três preços diferentes fazendo papéis diferentes, e o painel mostrava só dois deles.'
---

# De onde o Robson mede

Na quinta-feira o operador do Robson abriu uma compra de bitcoin, viu o primeiro degrau do trailing stop subir dois minutos depois e perguntou: "pensei que um palmo já deixava a operação de graça; por que o stop ainda está abaixo da minha entrada?" A pergunta é boa porque a resposta não estava na tela. Estava no código e numa ADR, e envolve três preços que parecem um só.

## Os três preços

**A mínima.** É um preço do gráfico, não do operador. Quando a posição é armada, o analisador de stop busca cem candles de quinze minutos, encontra os fundos locais e escolhe o enésimo abaixo da entrada, caminhando para mais fundo se o escolhido estiver fora da faixa permitida de distância. O stop técnico é colocado exatamente sobre esse nível, sem desconto. Naquela quinta a mínima era 80.888,90, a menor dos últimos trinta horas. É o lugar onde a tese morre: se o mercado perder esse fundo, a compra estava errada.

**A referência.** É o preço que o Robson usa para fazer a análise: o fechamento do último candle de quinze minutos já fechado no momento do arm, 81.070,20. Dele até a mínima vão 181,30 pontos, e essa é a distância técnica. A mínima não pode ser referência de si mesma: a distância daria zero e não haveria como calcular tamanho nem risco. Alguma outra ponta precisa existir, e o Robson usa a que já conhece antes de mandar qualquer ordem.

**A execução.** É o que o operador pagou: 81.135,50, sessenta e cinco pontos acima da referência, porque entre o fechamento do candle e a ordem a mercado o preço já tinha andado.

## A régua é desenhada sobre a referência

A partir da distância técnica o Robson monta o palmo, o span: 181,30 mais a folga da exchange, que seria dez pontos-base do preço mas é limitada a um quarto da distância técnica, 45,40. Palmo de 226,70. Os gatilhos ficam em referência mais um, dois, três palmos: 81.296,90, 81.523,60, 81.750,30. E o stop de cada degrau é o gatilho menos um palmo, ou seja, referência mais zero, um, dois palmos.

Daí a surpresa. Ao cruzar o primeiro gatilho, o stop foi para 81.070,20, a referência. Para quem executou na referência, isso é o empate exato, e a ADR que define a escada diz com todas as letras que o primeiro palmo "move o stop técnico para a referência de entrada". Mas o operador executou sessenta e cinco pontos acima, e a exchange ainda aplica a folga de 45 por baixo. Resultado: stop real em 81.024,80, 111 pontos abaixo do dinheiro dele. O empate em relação ao bolso só veio no segundo degrau, com o stop em 81.296,90, 161 pontos acima da entrada. A mesma ADR já avisava: é um empate técnico, "não uma garantia de empate executável ou econômico depois de folga, gap e taxas". O que faltava era isso aparecer para quem opera.

## Por que não ancorar na execução

A objeção óbvia é: ancore a régua no preço pago, e o primeiro palmo vira empate de verdade. Há três razões para não fazer isso hoje, e elas são as mesmas que sustentam o resto do sistema.

Tamanho e risco são decididos antes de a ordem existir. O Robson dimensiona a posição a partir da distância técnica, confere se o risco planejado cabe no orçamento do mês e só então manda a ordem. Se a distância dependesse do fill, o tamanho dependeria de algo que ainda não aconteceu.

O stop de seguro é colocado na exchange no instante do fill, com o palmo já fixo. É a primeira camada de proteção, a que dispara mesmo se o daemon cair. Ela precisa de um número pronto, não de um número que será recalculado depois de a posição já existir.

A prévia e o arm dão o mesmo resultado. O operador pode ver, antes de clicar, o stop, o palmo, o tamanho e o risco exatamente como serão. Isso só é possível porque nada na conta depende do preço de execução.

O custo dessa escolha é o slippage ficar fora da régua. Em palmos largos ele some: sessenta e cinco pontos num palmo de seiscentos são um décimo. Em palmos curtos pesa: naquela quinta eram quase um terço do primeiro degrau. É um custo aceitável desde que esteja visível, e não estava.

## O que a operação mostrou

A escada fez o resto do trabalho. O segundo degrau pôs a operação de graça; o terceiro, vinte minutos depois da entrada, travou 343 pontos de lucro com o stop em 81.478,20. Veio um mergulho até 81.500, vinte e dois pontos acima do stop, e a régua não reagiu, porque ela só reage a degraus, não a sustos. Uma hora depois o preço voltou a cair, o stop de seguro saiu em 81.475,00, e a operação fechou com 6,79 dólares de lucro. Foi a segunda do dia com o mesmo desenho, entrada perto de um nível real e stop debaixo dele, e a segunda a terminar no lucro depois de uma semana em que quatro vendas antecipadas tinham terminado no stop.

## O que muda

Nada na régua. O que muda é a leitura: o painel passa a mostrar a referência ao lado da entrada, com o slippage em pontos, e o lucro que o stop atual já garante em dólares, para que "stop em menos dois" seja lido e não deduzido. A documentação de operação ganha a seção dos três preços, que até agora vivia só na ADR. E a pergunta de desenho, ancorar na execução ou na referência, fica registrada para a próxima versão, com os custos dos dois lados escritos. Até lá vale a regra que o operador aprendeu na quinta: o primeiro palmo empata com o sinal; o segundo empata com você.
