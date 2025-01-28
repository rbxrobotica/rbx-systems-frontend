import Image from "next/image";
import { SiFacebook, SiInstagram, SiLinkedin } from "react-icons/si";

export default function Footer() {
  const sections = [
    {
      title: "Soluções",
      links: ["Automação", "IA Integrada", "Serviços Personalizados", "Consultoria"],
    },
    {
      title: "Sobre Nós",
      links: ["Nossa História", "Equipe", "Blog", "Carreiras"],
    },
    {
      title: "Suporte",
      links: ["FAQ", "Contato", "Documentação", "Política de Privacidade"],
    },
  ];

  const socialLinks = [
    { icon: SiInstagram, href: "#" },
    { icon: SiFacebook, href: "#" },
    { icon: SiLinkedin, href: "#" },
  ];

  return (
    <footer className="mt-32 bg-[#1D1D22] border-t border-[#1D1D22] py-10" id="footer">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start space-y-8 lg:space-y-0">
          {/* Logo e descrição */}
          <div className="text-center lg:text-left lg:w-1/3">
            <div className="flex justify-center lg:justify-start">
              <Image
                src="/bitmap.svg"
                alt="RBX Robótica"
                width={50}
                height={50}
                className="mb-4"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-100">RBX Robótica</h2>
            <p className="text-gray-400 mt-2">
              Criando soluções inteligentes em robótica e automação para transformar o futuro.
            </p>
          </div>

          {/* Links dinâmicos */}
          <div className="flex flex-wrap justify-center lg:justify-between w-full lg:w-2/3 space-y-8 lg:space-y-0">
            {sections.map((section, index) => (
              <div key={index} className="w-1/2 sm:w-1/3 lg:w-auto px-4">
                <h3 className="font-medium text-gray-100">{section.title}</h3>
                <ul className="mt-4 space-y-2 text-gray-400">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="hover:text-gray-100">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Ícones de redes sociais dinâmicos */}
        <div className="flex justify-center lg:justify-start mt-8 space-x-6 text-gray-400">
          {socialLinks.map(({ icon: Icon, href }, index) => (
            <a key={index} href={href} className="hover:text-gray-100">
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>

        {/* Rodapé inferior */}
        <div className="mt-10 border-t border-gray-600 pt-6 text-center text-gray-400">
          <p>© {new Date().getFullYear()} RBX Robótica. Todos os direitos reservados.</p>
          <div className="flex justify-center mt-4 space-x-4">
            <a href="#" className="hover:text-gray-100">
              Termos e Condições
            </a>
            <a href="#" className="hover:text-gray-100">
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
