import { Files, Rocket, Users } from "lucide-react";

export const cardItems = [
    {
        id: 0,
        title: "Arquitetura e Disciplina",
        description:
            "Cada sistema e projetado com separacao clara de responsabilidades, contratos bem definidos e decisoes de arquitetura documentadas. Priorizamos estrutura sobre velocidade.",
        Icon: Users,
        gradient: "from-blue-500 to-blue-700",
    },
    {
        id: 1,
        title: "Operacao Continua",
        description:
            "Projetamos para producao. Observabilidade, deploys controlados, rollback seguro e pipelines automatizados sao parte da entrega, nao extras opcionais.",
        Icon: Rocket,
        gradient: "from-green-500 to-green-700",
    },
    {
        id: 2,
        title: "Evolucao com Controle",
        description:
            "Sistemas evoluem. Garantimos que cada mudanca seja rastreavel, testada e compativel com o que ja esta em operacao. Manutencao e parte do projeto desde o inicio.",
        Icon: Files,
        gradient: "from-[#FF2C9C] to-purple-700",
    },
]
