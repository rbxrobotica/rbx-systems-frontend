import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../page/views/footer/footer";
import { Server, Workflow, Brain, Cloud, Database, RefreshCw } from "lucide-react";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocaleFromHeaders();
  const dict = (await getDictionary(locale)) as Dictionary;
  return {
    title: `${dict.services.pageTitle} | RBX Systems`,
    description: dict.meta.description as string,
  };
}

const serviceIcons = [Server, Workflow, Brain, Cloud, Database, RefreshCw];

export default async function ServicosPage() {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;

  const services = dict.services.items.map((item, idx) => ({
    ...item,
    icon: serviceIcons[idx] || Server,
  }));

  return (
    <>
      <div className="min-h-screen pt-32 pb-16 px-6 md:px-16">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-20">
            <h1 className="text-3xl font-semibold lg:text-5xl mb-6">
              {dict.services.pageTitle}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {dict.services.pageSubtitle}
            </p>
          </div>

          {/* Services */}
          <div className="space-y-24">
            {services.map((service) => (
              <section key={service.id} id={String(service.id)} className="scroll-mt-28">
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
                  {service.description}
                </p>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-24 pt-16 border-t border-border">
            <h3 className="text-2xl font-semibold mb-4">
              {dict.services.ctaHeading}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              {dict.services.ctaBody}
            </p>
            <Link
              href="#footer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {dict.services.ctaButton}
            </Link>
          </div>
        </div>
      </div>
      <Footer dict={dict} />
    </>
  );
}
