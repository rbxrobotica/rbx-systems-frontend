import Image from "next/image";
import Link from "next/link";
import { SiLinkedin, SiGithub } from "react-icons/si";

export default function Footer() {
  const sections = [
    {
      title: "Servicos",
      links: [
        { label: "Sistemas Web e Plataformas", href: "/servicos#sistemas-web" },
        { label: "Automacao e Integracoes", href: "/servicos#automacao" },
        { label: "IA Aplicada e Agentes", href: "/servicos#ia-aplicada" },
        { label: "Infraestrutura Cloud", href: "/servicos#infraestrutura" },
        { label: "Backend e APIs", href: "/servicos#backend" },
        { label: "Manutencao Evolutiva", href: "/servicos#manutencao" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { label: "Sobre nos", href: "#about-us" },
        { label: "Equipe", href: "#team" },
        { label: "Blog", href: "/blog" },
        { label: "Produtos", href: "/produtos" },
        { label: "Atelier", href: "/atelier" },
      ],
    },
    {
      title: "Contato",
      links: [
        { label: "contato@rbx.ia.br", href: "mailto:contato@rbx.ia.br" },
      ],
    },
  ];

  const socialLinks = [
    { icon: SiGithub, href: "https://github.com/rbxrobotica" },
    { icon: SiLinkedin, href: "https://linkedin.com/company/rbxrobotica" },
  ];

  return (
    <footer className="mt-32 bg-[#1D1D22] border-t border-[#1D1D22] py-10" id="footer">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start space-y-8 lg:space-y-0">
          {/* Logo e descricao */}
          <div className="text-center lg:text-left lg:w-1/3">
            <div className="flex justify-center lg:justify-start">
              <Image
                src="/bitmap.svg"
                alt="RBX Robotica"
                width={50}
                height={50}
                className="mb-4"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-100">RBX Systems</h2>
            <p className="text-gray-400 mt-2">
              Engenharia de sistemas, automacao e infraestrutura para operacoes de alta exigencia.
            </p>
          </div>

          {/* Links dinamicos */}
          <div className="flex flex-wrap justify-center lg:justify-between w-full lg:w-2/3 space-y-8 lg:space-y-0">
            {sections.map((section, index) => (
              <div key={index} className="w-1/2 sm:w-1/3 lg:w-auto px-4">
                <h3 className="font-medium text-gray-100">{section.title}</h3>
                <ul className="mt-4 space-y-2 text-gray-400">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <Link href={link.href} className="hover:text-gray-100">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Redes sociais */}
        <div className="flex justify-center lg:justify-start mt-8 space-x-6 text-gray-400">
          {socialLinks.map(({ icon: Icon, href }, index) => (
            <a key={index} href={href} className="hover:text-gray-100" target="_blank" rel="noopener noreferrer">
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>

        {/* Rodape inferior */}
        <div className="mt-10 border-t border-gray-600 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} RBX Systems. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
