import { Mail, MessageCircle } from "lucide-react";
import ContactForm from "./contact-form";
import { WhatsAppDrawer } from "@/app/page/components/whatsapp-drawer";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/types";

const EMAIL_ADDRESS = "contact@rbxsystems.ch";

export default function ContactSection({ dict }: { dict: Dictionary }) {
  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">
            {dict.contact.heading}
          </h2>
          <p className="mt-3 text-gray-400">
            {dict.contact.body}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="space-y-8 lg:col-span-2">
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0B0D10]/80 p-6 backdrop-blur-md">
              {/* Voltage hairline */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00FFFF]/60 to-transparent" />
              {/* L-corner brackets */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-0 top-0 h-3 w-3 border-l border-t border-[#00FFFF]/30" />
                <div className="absolute right-0 top-0 h-3 w-3 border-r border-t border-[#00FFFF]/30" />
                <div className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-[#00FFFF]/30" />
                <div className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-[#00FFFF]/30" />
              </div>

              <div className="relative space-y-6">
                <div>
                  <h3 className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-[#06B6B6]">
                    {dict.contact.emailLabel}
                  </h3>
                  <a
                    href={`mailto:${EMAIL_ADDRESS}`}
                    className="mt-2 flex items-center gap-3 text-lg text-gray-100 transition-colors hover:text-[#00FFFF]"
                  >
                    <Mail className="size-5 text-[#00FFFF]/70" />
                    {EMAIL_ADDRESS}
                  </a>
                </div>

                <div>
                  <h3 className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-[#06B6B6]">
                    {dict.contact.whatsappLabel}
                  </h3>
                  <WhatsAppDrawer
                    dict={dict}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 inline-flex items-center gap-2 border-[#06B6B6]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10 hover:text-[#22E5E5]"
                      >
                        <MessageCircle className="size-4" />
                        {dict.contact.whatsappCta}
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <ContactForm dict={dict} />
          </div>
        </div>
      </div>
    </section>
  );
}
