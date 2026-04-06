import Image from "next/image";
import Link from "next/link";
import { SiLinkedin, SiGithub } from "react-icons/si";
import type { Dictionary } from "@/lib/i18n/types";

export default function Footer({ dict }: { dict: Dictionary }) {
  const sections = [
    {
      title: dict.footer.sections.services,
      links: [
        { label: dict.footer.links.systems_web, href: "/servicos#sistemas-web" },
        { label: dict.footer.links.automacao, href: "/servicos#automacao" },
        { label: dict.footer.links.ia_aplicada, href: "/servicos#ia-aplicada" },
        { label: dict.footer.links.infraestrutura, href: "/servicos#infraestrutura" },
        { label: dict.footer.links.backend, href: "/servicos#backend" },
        { label: dict.footer.links.manutencao, href: "/servicos#manutencao" },
      ],
    },
    {
      title: dict.footer.sections.company,
      links: [
        { label: dict.footer.links.aboutUs, href: "/#about-us" },
        { label: dict.footer.links.team, href: "/#team" },
        { label: "Blog", href: "/blog" },
        { label: dict.footer.links.products, href: "/produtos" },
        { label: "Atelier", href: "/atelier" },
      ],
    },
    {
      title: dict.footer.sections.contact,
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
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="mx-auto w-full max-w-sm text-center lg:mx-0 lg:w-1/3 lg:max-w-none lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <Image
                src="/api/assets/ui/bitmap.svg"
                alt="RBX Robotica"
                width={50}
                height={50}
                className="mb-4"
                unoptimized
              />
            </div>
            <h2 className="text-xl font-bold text-gray-100">RBX Systems</h2>
            <p className="mt-2 text-gray-400">
              {dict.footer.description}
            </p>
          </div>

          <div className="grid w-full gap-8 text-center sm:grid-cols-2 sm:text-left lg:w-2/3 lg:grid-cols-3">
            {sections.map((section, index) => (
              <div key={index}>
                <h3 className="font-medium text-gray-100">{section.title}</h3>
                <ul className="mt-4 space-y-2 text-gray-400">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <Link href={link.href} className="break-words hover:text-gray-100">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6 text-gray-400 lg:justify-start">
          {socialLinks.map(({ icon: Icon, href }, index) => (
            <a key={index} href={href} className="hover:text-gray-100" target="_blank" rel="noopener noreferrer">
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-600 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} RBX Systems. {dict.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
