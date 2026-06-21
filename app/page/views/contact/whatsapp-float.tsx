"use client";

import { FaWhatsapp } from "react-icons/fa";
import { WhatsAppDrawer } from "@/app/page/components/whatsapp-drawer";
import type { Dictionary } from "@/lib/i18n/types";

export default function WhatsAppFloat({ dict }: { dict: Dictionary }) {
  return (
    <WhatsAppDrawer
      dict={dict}
      trigger={
        <button
          type="button"
          aria-label="WhatsApp"
          className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-colors hover:bg-[#20BD5A]"
        >
          <FaWhatsapp className="size-7" />
        </button>
      }
    />
  );
}
