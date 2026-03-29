import type { Metadata } from "next";
import AtelierContent from "./AtelierContent";

export const metadata: Metadata = {
  title: "RBX Atelier | Strategic Visual Production",
  description:
    "Strategic Visual Production for Systems, Finance and Technology. We design and produce visual narratives for companies operating in complex environments.",
  openGraph: {
    title: "RBX Atelier | Strategic Visual Production",
    description:
      "Strategic Visual Production for Systems, Finance and Technology.",
    url: "https://rbx.ia.br/atelier",
    siteName: "RBX Systems",
    type: "website",
  },
};

export default function AtelierPage() {
  return <AtelierContent />;
}
