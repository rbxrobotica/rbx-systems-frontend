import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationMenuBar } from "./page/views/header/nav-bar-menu";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import WhatsAppFloat from "./page/views/contact/whatsapp-float";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocaleFromHeaders();
  const dict = (await getDictionary(locale)) as Dictionary;
  return {
    title: dict.meta.title as string,
    description: dict.meta.description as string,
  };
}

/**
 * Componente RootLayout
 *
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado dentro do layout
 * @returns {JSX.Element} - O elemento JSX que representa o layout principal
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;

  return (
    <html lang={locale === "pt-BR" ? "pt-br" : "en"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider locale={locale} dict={dict}>
            <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
              <div className="pointer-events-auto mx-auto w-full max-w-7xl">
                <NavigationMenuBar dict={dict} />
              </div>
            </div>
            {children}
            <WhatsAppFloat />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
