import type { Metadata } from "next";
import Footer from "@/app/page/views/footer/footer";
import CtaForm from "./_components/CtaForm";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";

// ─── LP-S1: Metadata ─────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Briefing Diário BTC — RBX",
  description:
    "Leitura operacional diária do mercado BTC Futuros, entregue às 07h todo dia útil. Contexto, cenários e plano de voo.",
  openGraph: {
    type: "website",
    title: "Briefing Diário BTC — RBX",
    description:
      "Leitura operacional diária do mercado BTC Futuros. Contexto, cenários e plano de voo, entregues por e-mail antes das 07h.",
    images: [{ url: "/og/briefing-btc", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "/produtos/briefing-btc",
  },
};

// ─── Artefatos (LP-S3) ────────────────────────────────────────────────────────

const ARTIFACTS = [
  {
    label: "Plano de Voo",
    description:
      "Leitura narrativa do contexto operacional do dia — tendência, volatilidade, hipóteses e regras de não-operação.",
  },
  {
    label: "Snapshot de Mercado",
    description:
      "Preço, volume, open interest, funding rate e spread normalizados em snapshot auditável.",
  },
  {
    label: "Cenários Operacionais",
    description:
      "2–3 hipóteses de comportamento com condições de invalidação explícitas.",
  },
  {
    label: "Fontes Consultadas",
    description:
      "APIs, janelas de tempo e endpoints utilizados na coleta — rastreável e verificável.",
  },
  {
    label: "Evidência do Modelo",
    description:
      "Output bruto da geração, preservado para auditoria. Você vê o que o modelo viu.",
  },
  {
    label: "Log de Execução",
    description:
      "Etapas, duração, status e erros do pipeline — cada briefing é rastreável do início ao fim.",
  },
] as const;

// ─── FAQ (LP-S6) ─────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "O briefing dá sinais de compra ou venda?",
    a: "Não. O briefing entrega leitura de contexto, cenários e plano de voo — não sinais, não recomendações de entrada ou saída, não targets de preço.",
  },
  {
    q: "Com que frequência é publicado?",
    a: "Todo dia útil, entregue por e-mail até as 07h BRT.",
  },
  {
    q: "Quais dados são usados?",
    a: "Dados públicos da Binance Futuros USD-M: OHLCV, open interest, funding rate, book ticker e spread. Nenhuma chave de API privada ou dado de conta é utilizado.",
  },
  {
    q: "Como cancelo?",
    a: "Basta responder ao e-mail de entrega solicitando o cancelamento. Sem burocracia.",
  },
] as const;

// ─── Sample flight-plan excerpt (LP-S5) ──────────────────────────────────────

const SAMPLE_EXCERPT = `# Plano de Voo — BTCUSDT Futures — Exemplo

## 1. Resumo Executivo

O mercado de BTCUSDT apresenta contexto técnico derivado do snapshot coletado.
O RSI(14) sugere condição neutra a ser interpretada pelo operador no contexto
atual. O funding rate não indica squeeze iminente. A qualidade dos dados
coletados está em 100% de completude.

## 2. Contexto de Mercado

- Tendência: SMA 9 e SMA 21 próximas — estrutura neutra de curto prazo.
- Volatilidade: ATR-14 em patamar moderado. Considerar no dimensionamento de risco.
- Funding Rate: baixo, sem pressão direcional significativa.
- Open Interest: estável. Variação deve ser monitorada em janelas maiores.

## 3. Cenários

| Cenário   | Condições                                        | Observações                        |
|-----------|--------------------------------------------------|------------------------------------|
| Base      | Preço entre SMA 21 e SMA 9                       | Contexto técnico neutro            |
| Otimista  | Rompimento acima da banda superior com volume    | Requer confirmação de follow-through |
| Pessimista| Perda da SMA 21 com volume acima da média        | Invalidaria estrutura de curto prazo |

## 7. Regras de Não-Operação

- NÃO OPERAR se ATR-14 expandir acima de 2× o valor atual antes da abertura europeia.
- NÃO OPERAR se houver notícia macro de alto impacto em menos de 2 horas.
- NÃO OPERAR se o spread do orderbook estiver elevado por mais de 5 minutos.

## 10. Disclaimer

Este documento é material de preparação operacional e governança. Não constitui
recomendação de investimento, sinal de trading ou orientação financeira.
A decisão de operar é exclusiva do operador humano.`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BriefingBtcPage() {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;

  return (
    <>
      <main
        aria-label="Briefing Diário BTC — produto de assinatura"
        className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36 lg:px-8"
      >

        {/* LP-S2 — Hero */}
        <section aria-labelledby="hero-heading" className="pb-20 border-b border-border">
          <p className="font-mono text-xs tracking-widest text-muted-foreground mb-6 uppercase">
            RBX · Inteligência de Mercado
          </p>
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight mb-6"
          >
            O mercado BTC não espera.
            <br />
            <span className="text-primary">Às 07h, você já leu.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-10">
            Leitura operacional diária do mercado de Futuros BTC/USDT —
            contexto, cenários e plano de voo. Entregue por e-mail todo dia
            útil.
          </p>
          <a
            href="#receber"
            className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Receber amostra grátis
            <span aria-hidden>→</span>
          </a>
        </section>

        {/* LP-S3 — O que você recebe */}
        <section aria-labelledby="artifacts-heading" className="py-20 border-b border-border">
          <p className="font-mono text-xs tracking-widest text-muted-foreground mb-3 uppercase">
            01 · O que você recebe
          </p>
          <h2
            id="artifacts-heading"
            className="text-2xl font-semibold tracking-tight mb-10"
          >
            Seis artefatos, todo dia útil.
          </h2>
          <div className="grid sm:grid-cols-2 gap-0">
            {ARTIFACTS.map((a) => (
              <div
                key={a.label}
                className="border-t border-border pt-5 pb-6 pr-6"
              >
                <p className="font-mono text-xs text-primary tracking-wide mb-2 uppercase">
                  {a.label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {a.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* LP-S4 — Para quem é */}
        <section aria-labelledby="forwhom-heading" className="py-20 border-b border-border">
          <p className="font-mono text-xs tracking-widest text-muted-foreground mb-3 uppercase">
            02 · Para quem é
          </p>
          <h2
            id="forwhom-heading"
            className="text-2xl font-semibold tracking-tight mb-6"
          >
            Para traders que já operam BTC Futuros.
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mb-8">
            Para traders que já operam contratos perpétuos de BTC/USDT na
            Binance Futuros e querem começar o dia com contexto operacional
            consolidado, sem precisar montar o próprio painel de dados.
          </p>
          <div className="rounded border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Não é para você se:
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>— Você busca sinais de compra/venda automatizados</li>
              <li>— Você espera recomendações de alocação ou gestão de carteira</li>
              <li>— Você nunca operou futuros de criptomoedas</li>
            </ul>
          </div>
        </section>

        {/* LP-S5 — Amostra real */}
        <section aria-labelledby="sample-heading" className="py-20 border-b border-border">
          <p className="font-mono text-xs tracking-widest text-muted-foreground mb-3 uppercase">
            03 · Amostra
          </p>
          <h2
            id="sample-heading"
            className="text-2xl font-semibold tracking-tight mb-2"
          >
            Exemplo de Plano de Voo
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Trecho representativo. Dados e níveis técnicos omitidos nesta
            visualização pública.
          </p>
          <pre className="overflow-x-auto rounded border border-border bg-card p-5 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {SAMPLE_EXCERPT}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            Este é um exemplo ilustrativo. Não constitui recomendação de
            investimento.
          </p>
        </section>

        {/* LP-S6 — Preço */}
        <section aria-labelledby="pricing-heading" className="py-20 border-b border-border">
          <p className="font-mono text-xs tracking-widest text-muted-foreground mb-3 uppercase">
            04 · Preço
          </p>
          <h2 id="pricing-heading" className="sr-only">
            Preço da assinatura
          </h2>
          <div className="mb-8">
            <p className="text-4xl font-semibold tracking-tight">
              R$&nbsp;39
              <span className="text-lg font-normal text-muted-foreground">
                {" "}/ mês
              </span>
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Entregue por e-mail todo dia útil às 07h BRT. Cancele a qualquer
              momento.
            </p>
          </div>

          {/* FAQ */}
          <div className="space-y-0">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group border-t border-border py-4"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-sm font-medium list-none">
                  {item.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-muted-foreground group-open:rotate-180 transition-transform"
                  >
                    ↓
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
            <div className="border-t border-border" />
          </div>
        </section>

        {/* LP-S7 — Formulário CTA */}
        <section
          id="receber"
          aria-labelledby="cta-heading"
          className="py-20"
        >
          <p className="font-mono text-xs tracking-widest text-muted-foreground mb-3 uppercase">
            05 · Receber amostra
          </p>
          <h2
            id="cta-heading"
            className="text-2xl font-semibold tracking-tight mb-2"
          >
            Receba uma amostra grátis.
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Você receberá um Plano de Voo real por e-mail em até 24h.
          </p>
          <CtaForm />
        </section>
      </main>

      <Footer dict={dict} />
    </>
  );
}
