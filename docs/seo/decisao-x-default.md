# Decisão: hreflang x-default

Data: 2026-09-21
Status: substituída em 2026-11-13 por `docs/adr/ADR-0003-one-host-language-by-path.md`. O
`x-default` segue em inglês, agora em `merovelis.com/en`. O texto abaixo é o registro da
decisão anterior.

## Decisão

O `x-default` dos hreflang alternates permanece apontando para a versão em
inglês (`rbxsystems.ch`), que funciona como o default internacional do site.
O domínio `rbx.ia.br` cobre pt-BR explicitamente via `hreflang="pt-BR"`.

A implementação vive em `src/lib/seo/alternates.ts` (`getAlternates`), que
emite `pt-BR`, `en` e `x-default` para cada path mapeado em
`LOCALE_PATH_MAP`. Nenhuma alteração de código foi feita neste lote.

## Motivação

- A audiência internacional é atendida por default em inglês; manter o
  `x-default` em `rbxsystems.ch` evita que usuários fora do Brasil caiam na
  versão pt-BR por ausência de match de idioma.
- Os dois domínios já separam claramente os públicos: pt-BR no `.ia.br`,
  inglês no `.ch`.

## Reavaliação

Reavaliar esta decisão se o tráfego pt-BR superar o internacional nos
relatórios do Search Console. Nesse cenário, considerar apontar o
`x-default` para `rbx.ia.br`.
