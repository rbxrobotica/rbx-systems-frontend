import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../page/views/footer/footer";
import { Server, Workflow, Brain, Cloud, Database, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Servicos | RBX Systems",
  description:
    "Engenharia de sistemas, automacao, IA aplicada e infraestrutura cloud. Servicos tecnicos para operacoes de alta exigencia.",
};

const services = [
  {
    id: "sistemas-web",
    icon: Server,
    title: "Sistemas Web e Plataformas Internas",
    summary:
      "Aplicacoes web e plataformas operacionais projetadas para uso interno, portais de gestao e interfaces de controle.",
    details: [
      "Plataformas internas para operacao, monitoramento e gestao de processos",
      "Aplicacoes web com arquitetura modular e deploy automatizado",
      "Paineis de controle e dashboards operacionais",
      "Integracao com sistemas existentes via APIs e filas de mensagens",
      "Autenticacao, controle de acesso e auditoria de operacoes",
    ],
  },
  {
    id: "automacao",
    icon: Workflow,
    title: "Automacao e Integracoes Operacionais",
    summary:
      "Workflows automatizados, integracoes entre sistemas e eliminacao de processos manuais em fluxos criticos de negocio.",
    details: [
      "Automacao de processos operacionais com orquestracao de tarefas",
      "Integracoes entre ERPs, CRMs, gateways de pagamento e sistemas legados",
      "Pipelines de dados com transformacao, validacao e roteamento",
      "Webhooks, filas e event-driven architecture para comunicacao entre servicos",
      "Reducao de intervencao manual em fluxos de alta frequencia",
    ],
  },
  {
    id: "ia-aplicada",
    icon: Brain,
    title: "IA Aplicada e Agentes Inteligentes",
    summary:
      "Modelos de linguagem, agentes autonomos e IA integrada a fluxos de negocio com governanca, observabilidade e controle.",
    details: [
      "Agentes inteligentes com tool governance e control loops",
      "Integracao de LLMs em workflows operacionais com rastreabilidade",
      "RAG (retrieval-augmented generation) sobre bases de conhecimento internas",
      "Runtime e harness para execucao governada de agentes",
      "Observabilidade de custos, latencia e qualidade de respostas de IA",
    ],
  },
  {
    id: "infraestrutura",
    icon: Cloud,
    title: "Infraestrutura Cloud e Operacoes",
    summary:
      "Ambientes cloud com provisionamento declarativo, CI/CD, monitoramento e operacao confiavel.",
    details: [
      "Provisionamento de infraestrutura com IaC (Pulumi, Terraform)",
      "Pipelines CI/CD com testes automatizados e deploy controlado",
      "Ambientes em AWS, GCP ou provedores europeus com isolamento adequado",
      "Monitoramento, alertas e logging centralizado",
      "Gestao de custos e dimensionamento de recursos",
    ],
  },
  {
    id: "backend",
    icon: Database,
    title: "Arquitetura de Backend e APIs",
    summary:
      "Servicos de backend, APIs REST e GraphQL, camadas de dados e logica de negocio projetados para consistencia e manutencao.",
    details: [
      "APIs com contratos bem definidos, versionamento e documentacao",
      "Modelagem de dados com integridade referencial e migracao controlada",
      "Servicos com separacao clara de responsabilidades e testabilidade",
      "Autenticacao, rate limiting e controle de acesso em camada de API",
      "Otimizacao de consultas, caching e gestao de conexoes",
    ],
  },
  {
    id: "manutencao",
    icon: RefreshCw,
    title: "Manutencao Evolutiva de Sistemas",
    summary:
      "Evolucao continua de sistemas em producao com estabilidade, rastreabilidade e controle de regressao.",
    details: [
      "Manutencao corretiva e evolutiva de plataformas em operacao",
      "Atualizacao de dependencias com testes de regressao automatizados",
      "Refatoracao incremental sem interrupcao de servico",
      "Documentacao tecnica e transferencia de conhecimento",
      "SLAs de resposta e operacao para sistemas criticos",
    ],
  },
];

export default function ServicosPage() {
  return (
    <>
      <div className="min-h-screen pt-32 pb-16 px-6 md:px-16">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-20">
            <h1 className="text-3xl font-semibold lg:text-5xl mb-6">
              Servicos
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Projetamos, construimos e operamos sistemas para empresas que
              tratam tecnologia como infraestrutura critica. Cada servico
              reflete nossa abordagem: arquitetura deliberada, operacao
              confiavel e evolucao controlada.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-24">
            {services.map((service) => (
              <section key={service.id} id={service.id} className="scroll-mt-28">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 flex size-12 items-center justify-center rounded-2xl bg-accent">
                    <service.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold md:text-3xl">
                      {service.title}
                    </h2>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
                  {service.summary}
                </p>
                <ul className="space-y-3 max-w-3xl">
                  {service.details.map((detail, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <span className="mt-2 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-24 pt-16 border-t border-border">
            <h3 className="text-2xl font-semibold mb-4">
              Precisa de engenharia de sistemas?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Se a sua operacao depende de software confiavel, fale conosco.
              Avaliamos o cenario tecnico e propomos uma arquitetura
              compativel com os seus requisitos.
            </p>
            <Link
              href="#footer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Entrar em contato
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
