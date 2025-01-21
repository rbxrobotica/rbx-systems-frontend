import Image from "next/image";
import { SiFacebook, SiInstagram, SiLinkedin } from "react-icons/si";

export default function Footer() {
  // Dados para os links das seções
  const sections = [
    {
      title: "Product",
      links: ["Overview", "Pricing", "Marketplace", "Features"],
    },
    {
      title: "Company",
      links: ["About", "Team", "Blog", "Careers"],
    },
    {
      title: "Resources",
      links: ["Help", "Sales", "Advertise", "Privacy"],
    },
  ];

  // Dados para os ícones de redes sociais
  const socialLinks = [
    { icon: SiInstagram, href: "#" },
    { icon: SiFacebook, href: "#" },
    { icon: SiLinkedin, href: "#" },
  ];

  return (
    <footer className="mt-32 bg-[#1D1D22] border-t border-[#1D1D22] py-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start">
          {/* Logo e descrição */}
          <div className="mb-6 lg:mb-0 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <Image
                src="/bitmap.svg" 
                alt="RBX Robótica"
                width={50}
                height={50}
                className="mb-4"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Shadcnblocks</h2>
            <p className="text-gray-500 mt-2">
              A collection of 100+ responsive HTML templates for your startup business or side project.
            </p>
          </div>

          {/* Links dinâmicos */}
          <div className="flex flex-wrap justify-center lg:justify-between w-full lg:w-auto">
            {sections.map((section, index) => (
              <div key={index} className="mr-12">
                <h3 className="font-medium text-gray-800">{section.title}</h3>
                <ul className="mt-4 space-y-2 text-gray-500">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="hover:text-gray-800">
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
        <div className="flex justify-center lg:justify-start mt-8 space-x-6 text-gray-500">
          {socialLinks.map(({ icon: Icon, href }, index) => (
            <a key={index} href={href} className="hover:text-gray-800">
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>

        {/* Rodapé inferior */}
        <div className="mt-10 border-t pt-6 text-center text-gray-500">
          <p>© 2024 Shadcnblocks. All rights reserved.</p>
          <div className="flex justify-center mt-4 space-x-4">
            <a href="#" className="hover:text-gray-800">
              Terms and Conditions
            </a>
            <a href="#" className="hover:text-gray-800">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
