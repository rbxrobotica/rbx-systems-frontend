"use client";

import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "5511913734954";

export default function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-colors hover:bg-[#20BD5A]"
    >
      <FaWhatsapp className="size-7" />
    </a>
  );
}
