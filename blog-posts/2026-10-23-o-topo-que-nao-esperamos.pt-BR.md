---
title: 'O topo que não esperamos: uma semana de stops, uma lição e o roadmap da v2.5'
date: '2026-10-23'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, trading, risco, entrada, produto, roadmap, engenharia]
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-10-23-o-topo-que-nao-esperamos-v1.png'
excerpt: 'Acertamos a direção, erramos o momento quatro vezes e o Robson fechou a porta antes da quinta. A reversão veio sem ninguém dentro. O que isso ensina sobre entrada, sobre o orçamento mensal e sobre o que muda, e o que não muda, na v2.5.'
---

# O topo que não esperamos

Na semana passada escrevemos sobre revisar o Robson com uma posição aberta. Esta semana a história é outra: o operador acertou a tese e perdeu quatro vezes seguidas, o sistema fechou a porta antes da quinta tentativa, e a reversão que ele tinha previsto aconteceu com o livro vazio. Outubro continua positivo. Mesmo assim, foi uma pena, e vale contar por quê.

## A tese estava certa

Entre os dias 18 e 21 o bitcoin subiu de 81 para 84,9 mil. O operador leu, corretamente, que aquela alta era local e ia reverter. Vendeu quatro vezes: dentro da lateral que antecedeu a subida, no meio da perna de alta, e a um por cento do topo, ainda com o preço subindo. Os quatro stops saíram, três deles de fallback por ATR, com distâncias entre 0,3 e 0,6 por cento. Perda bruta: 26 dólares. Nada dramático; cada perda ficou abaixo de meio por cento do capital.

Na quarta à tarde o topo se formou, a média de 25 horas foi perdida com volume, e o preço caiu 3,4 por cento até quinta. Os dois arms que o operador tentou na véspera, já perto do topo, não entraram: o orçamento do mês não cabia mais uma operação inteira.

A reação natural é chamar isso de azar. Não foi. Quando a direção está certa e o resultado são quatro stops, o erro é de momento e de estrutura, e isso é corrigível. Olhando o gráfico de uma hora depois, nenhuma das quatro vendas tinha um topo formado atrás de si: havia um extremo, mas não um extremo mais baixo nem o rompimento do último fundo. O stop ficou, nas quatro, acima de uma máxima de meia hora, não de uma estrutura. O mercado precisou de mais quatrocentos pontos e algumas horas para confirmar o topo, e nesse intervalo levou as quatro posições.

## O que o orçamento fez, e o que ele promete

O Robson promete uma coisa: a perda governada do mês nunca passa de quatro por cento do capital base. Em outubro o mês estava em mais 146 dólares no pico. Por essa promessa, havia orçamento inteiro disponível.

O que travou o operador foi outra regra, a devolução desde o pico de equity do mês, o modelo de high-water mark que desenhamos em julho. Ela converte o limite de perda num trailing stop do mês: depois de um pico de 146, devolver 56 em quatro operações consumiu 82 por cento do colchão, e o quinto arm não coube. A regra fez o que foi desenhada para fazer, interrompeu uma sequência de erros iguais. Mas fez isso em nome de uma garantia que ninguém prometeu, e o próprio dono do sistema estranhou o número duas vezes na mesma semana. Uma gauge central que surpreende quem a escreveu tem um problema de legibilidade.

A decisão, tomada em agosto e agendada agora, é separar as duas coisas. O orçamento mensal passa a ser contado a partir de zero, net-from-start: a promessa, e só ela. A disciplina de sequência, que o high-water mark fazia por efeito colateral, vira um mecanismo com nome próprio, visível, que pede confirmação depois de alguns stops seguidos em vez de tirar orçamento. A troca de modelo acontece na virada para novembro, não no meio de outubro: mudar a régua depois de quatro perdas para destravar orçamento seria mudar a medição no meio da medida.

## O que a semana expôs no software

Dois achados pequenos, de produto, saíram dessa semana. O primeiro: um arm imediato negado por orçamento não dizia nada ao operador. Ficava armado, e o daemon tentava de novo em intervalos crescentes, até quinze minutos, indefinidamente. A ordem sairia no primeiro instante em que o stop ficasse curto o bastante para o risco caber, ou seja, no pior momento, sem ninguém olhando, com o último orçamento do mês. A correção é fazer a negação acontecer no clique, com a mensagem na tela: "risco 14,8 não cabe nos 12,5 restantes". Nada fica armado, nada tenta depois.

O segundo achado é a contrapartida do primeiro. Na madrugada de quinta o operador abriu uma compra que coube: stop técnico sobre a mínima de uma hora do dia anterior, a menor mínima de trinta horas, distância de 0,3 por cento, risco de nove dólares. Mesmo tamanho de stop das vendas da semana, mas com uma diferença que é a lição inteira: este stop tem onde ficar. Se o mercado perder a mínima do dia, a tese de fundo local está errada e o stop sair é o correto. Nas quatro vendas, o stop sair não dizia nada sobre a tese.

## Paciência é um algoritmo

A pergunta que o operador fez foi a certa: isso se resolve em software ou é habilidade humana? A resposta é que a divisão é mais nítida do que parece. A tese direcional é humana, e vai continuar sendo. A paciência, "esperar o extremo mais baixo e o rompimento do último fundo", é uma regra sobre candles, objetiva, que não precisa virar traço de personalidade: basta descrevê-la uma vez e deixar a máquina esperar. O que sobra de psicológico é pequeno e real: aceitar pagar um preço pior pela confirmação. Entrar em 83,7 depois de ver 84,9 dói, porque parece que se perdeu um por cento. É esse um por cento que compra um stop de verdade.

## O roadmap, e por que ele é pontual

O Robson v2.5 está consolidado em produção com capital real. O objetivo declarado é não estragar o que está bom: admissão, risco, stop em duas camadas e execução não mudam. O que entra são mudanças de leitura e de borda, nesta ordem:

1. **Virada para net-from-start em 1º de novembro.** O gauge e o card já são cientes do modelo; a ativação é uma linha no banco, sem restart, com runbook, pré-condições e rollback escritos.
2. **Negação no clique.** Arm imediato que não cabe no orçamento recebe erro com motivo, sem posição residual. Abaixo de meia operação de saldo, a faixa do mês passa a dizer "orçamento encerrado, volta em 1º".
3. **Uma tela de Analytics**, ao lado da Tesouraria: o gráfico com os extremos marcados e o estado da estrutura em palavras, onde o Robson colocaria o stop agora para cada lado, com método, confiança e distância, a faixa do ATR, e os arms do mês sobrepostos, incluindo os negados. Esta semana apareceria como quatro bolinhas vermelhas na subida, duas cinzas no topo e o movimento inteiro depois delas, sem ninguém dentro.
4. **Checklist de confirmação no modal de arm**, a versão de três linhas da tela, no momento do clique: extremo, extremo mais baixo, rompimento, com um sinal para cada. O humano decide igual, vendo o que falta.
5. **Histórico das tentativas do mês**: arms, negações com motivo, stops, método, distância, resultado. Ver "fallback, 0,4 por cento, menos oito" quatro vezes em sequência numa lista ensina mais rápido que qualquer regra.

Tudo isso é leitura. Um endpoint de análise, nenhum estado novo, nenhuma migração, nada no caminho de execução.

## O que fica para a v3: a entrada

As decisões de verdade sobre entrada ficam para a v3, e estão em aberto de propósito. O Robson já teve quatro políticas de entrada no histórico: imediata, tendência confirmada, reversão confirmada e nível-chave confirmado. Sobrou a imediata, e a de tendência é um cruzamento de médias. A política que esta semana pediu, formação de topo ou de fundo, é a reversão confirmada com uma definição precisa: extremo, extremo mais baixo, rompimento do fundo entre os dois, entrada no rompimento ou no reteste, stop acima do segundo topo, expiração se a formação não vier.

O caminho até ela passa por um "modo observar": o operador registra a tese, o detector observa e avisa quando a formação confirma, e o arm continua sendo um clique humano com a prévia preenchida. Só depois de a observação dizer "topo formado" nas horas certas por algumas semanas é que a regra vira política que executa. Ficam na mesma lista a escada de fallback, procurar o nível no gráfico de uma hora antes de cair para o ATR, e o freio de sequência. A autonomia total existe como horizonte, não como intenção; o produto é um operador humano com guardrails que ele entende.

Outubro fecha no lucro. A reversão prevista ficou de fora. As duas coisas são verdade ao mesmo tempo, e a segunda é o trabalho de novembro.
