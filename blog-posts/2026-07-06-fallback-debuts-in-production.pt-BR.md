---
title: 'Atualização de engenharia: o fallback estreia em produção'
date: '2026-07-06'
author: 'RBX Systems'
authorRole: 'Engineering Team'
tags: [robson, engenharia, confiabilidade, risco, trading]
excerpt: 'Menos de 24 horas depois do merge, o fallback de dados de mercado protegeu uma entrada real. E a caça à causa raiz terminou num lugar inesperado. O update completo.'
cover: 'https://eu2.contabostorage.com/rbx-content/blog/covers/2026-07-06-fallback-debuts-in-production.jpg'
---

No sábado publicamos [a história do stop gain que auditou o sistema](/blog/2026-07-05-stop-gain-that-audited-the-system). Este é o update de domingo, e ele começa com uma estreia que nenhum de nós planejou para tão cedo.

## Uma entrada inteira sobre o caminho degradado

Às 03h44 UTC, o operador armou uma posição comprada em BTCUSDT. O ciclo completo levou 3,4 segundos: sinal, gate de risco, ordem executada a 63.171,60, stop de seguro descansando na exchange a 62.533,85, posição ativa. Nada de especial, exceto um detalhe: o WebSocket de preços da exchange estava mudo havia doze horas, e quem alimentou o preço da entrada, o cálculo de risco e o trailing stop foi o fallback REST publicado no dia anterior.

O fallback tem uma regra de orçamento: ele não gasta requisições enquanto não existe posição para proteger. Ficou doze horas observando o silêncio sem agir e armou no instante em que a posição passou a existir. A matemática do limite mensal novo também estreou na mesma entrada: o orçamento restante caiu exatamente o risco reservado até o stop, centavo por centavo.

## A caça à causa raiz terminou fora de casa

Três episódios de feed mudo em três dias mereciam mais que reconexões. Com a posição protegida pelo fallback, dava para depurar o espécime vivo sem pressa. O funil: DNS, TCP e TLS até o host de dados da exchange, todos saudáveis. O handshake do WebSocket respondia 101 Switching Protocols. E depois do 101, zero frames de dados, no endpoint raw e no combined, testado de duas redes diferentes. O controle que fechou o caso: o WebSocket do mercado spot, com o mesmo leitor, entregou onze kilobytes em oito segundos.

Conclusão: o feed de futures da exchange aceita conexões e, por janelas, não envia nada. O problema mora do lado de lá. Isso reescreve a história dos incidentes anteriores, em que reinícios do daemon pareciam curar o feed: a cura era coincidência de horário com a volta do serviço. A lição de arquitetura já estava paga desde sábado, e agora tem prova de produção: consumidor crítico não pode ter caminho único de dados.

Duas armadilhas de depuração ficam registradas para quem um dia cace algo parecido: curl não repassa frames depois do 101, o que fabrica falsos negativos, e cabeçalhos de Upgrade sobre HTTP/2 são silenciosamente ignorados. Sockets crus e um mercado spot como grupo de controle resolveram o que quatro testes enganosos não resolviam.

## O painel agora mostra o trailing do mês

O limite mensal novo, decidido no sábado, está no ar: o medidor principal deixou de somar perdas brutas e passou a mostrar o give-back desde o topo da equity do mês. Ganhos realizados rearmam capacidade de operar e elevam o piso ao mesmo tempo. A promessa segue a mesma em qualquer cenário: nunca devolver mais de 4 por cento do topo do mês, com o limite de 1 por cento por operação intacto como proteção unitária.

## A badge que pegou o próprio bug

Na sexta nasceu um indicador de frescor no painel: LIVE quando o stream de eventos respira, STALE quando emudece. No domingo ele acusou STALE com o stream perfeitamente saudável. A verificação percorreu o caminho inteiro, de dentro do servidor e através do proxy público, e os batimentos estavam todos lá. O bug era do medidor: ele contava eventos interpretados, e os batimentos de 15 segundos são comentários do protocolo que nunca viram evento. Qualquer período quieto marcava STALE.

A correção saiu no mesmo dia: frescor agora é atividade de bytes, batimentos incluídos, e STALE só aparece quando o watchdog de 45 segundos dispara de verdade. Há algo de satisfatório em ver a ferramenta que existe para tornar silêncio visível denunciar, como primeiro caso, o silêncio do próprio instrumento de medição.

## A decisão de não mudar

Com tudo isso na mesa, veio a pergunta de produto: dá para simplificar a comunicação, trocar por RPC, usar a rede interna do cluster? O estudo comparou cinco opções com tabela de modos de falha e custo em um e em cem usuários. A resposta registrada em ADR: manter a topologia atual, que acabara de ser verificada ponta a ponta. O proxy consolidado introduziria uma classe nova de falha silenciosa e daria a cada deploy do frontend um raio de dano sobre os streams vivos. RPC para navegador exige proxy adicional, o oposto de simplificar. As condições que mudariam a resposta ficaram escritas: multiusuário, mais de vinte operadores simultâneos, ou uma necessidade real de streaming do cliente para o servidor.

O estudo também deixou uma lição de processo: ele recomendou um endurecimento de segurança que já estava implementado no código, porque partiu da documentação, e documentação deriva. A regra que entrou para as guardrails vale para qualquer decisão: recomendações se verificam contra o código-fonte atual, e ADR pego desatualizado é corrigido no mesmo ciclo.

## O que fica

Quatro dias, quatro invariantes novos em produção, e um padrão que se repete: cada incidente virou decisão registrada antes de virar código, cada código passou por revisão linha a linha, e as proteções construídas num dia foram testadas pelo mundo real no dia seguinte. O próximo capítulo já tem nome: o ledger de income tipado, que vai completar a promessa de que dinheiro sem explicação nunca mais entra nos livros sozinho.
