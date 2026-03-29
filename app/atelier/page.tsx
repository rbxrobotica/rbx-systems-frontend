import type { Metadata } from "next";
import AtelierContent from "./AtelierContent";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocaleFromHeaders() as Locale;
  const domain = locale === "pt-BR" ? "rbx.ia.br" : "rbxsystems.ch";

  return {
    title: "RBX Atelier | Strategic Visual Production",
    description:
      "Strategic Visual Production for Systems, Finance and Technology. We design and produce visual narratives for companies operating in complex environments.",
    openGraph: {
      title: "RBX Atelier | Strategic Visual Production",
      description:
        "Strategic Visual Production for Systems, Finance and Technology.",
      url: `https://${domain}/atelier`,
      siteName: "RBX Systems",
      type: "website",
    },
  };
}

export default async function AtelierPage() {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;
  return <AtelierContent dict={dict} />;
}
