import { Mail, MessageCircle } from "lucide-react";
import ContactForm from "./contact-form";
import type { Dictionary } from "@/lib/i18n/types";

const WHATSAPP_NUMBER = "5511913734954";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
const EMAIL_ADDRESS = "contact@rbxsystems.ch";

export default function ContactSection({ dict }: { dict: Dictionary }) {
  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-100 sm:text-4xl">
            {dict.contact.heading}
          </h2>
          <p className="mt-3 text-gray-400">
            {dict.contact.body}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="space-y-8 lg:col-span-2">
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500">
                {dict.contact.emailLabel}
              </h3>
              <a
                href={`mailto:${EMAIL_ADDRESS}`}
                className="mt-2 flex items-center gap-3 text-lg text-gray-100 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5 text-gray-400" />
                {EMAIL_ADDRESS}
              </a>
            </div>

            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500">
                {dict.contact.whatsappLabel}
              </h3>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-3 text-lg text-gray-100 hover:text-white transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                +55 11 9137-34954
              </a>
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
