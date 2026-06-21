"use client";

import { useState, useRef, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/types";
import AltchaWidget from "@/app/components/altcha-widget";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

function getCommsBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  if (host.includes("rbxsystems.ch")) {
    return "https://comms.rbxsystems.ch";
  }
  return "https://comms.rbx.ia.br";
}

export default function ContactForm({ dict }: { dict: Dictionary }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const altchaRef = useRef<{ value: string | null }>(null);

  const commsBase = getCommsBaseUrl();
  const challengeUrl = "/api/altcha-challenge";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    const altchaPayload = altchaRef.current?.value;
    if (!altchaPayload) {
      setStatus("error");
      return;
    }

    try {
      const res = await fetch(`${commsBase}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message,
          whatsappOptIn,
          altcha: altchaPayload,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setWhatsappOptIn(false);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-[#06B6B6]/20 bg-[#07080A]/80 backdrop-blur-md">
        {/* Voltage hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent" />
        {/* L-corner brackets */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-4 w-4 border-l border-t border-[#00FFFF]/30" />
          <div className="absolute right-0 top-0 h-4 w-4 border-r border-t border-[#00FFFF]/30" />
          <div className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-[#00FFFF]/30" />
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-[#00FFFF]/30" />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#00FFFF]/10">
            <CheckCircle2 className="size-6 text-[#00FFFF]" />
          </div>
          <p className="text-sm text-gray-300">{dict.contact.form.success}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatus("idle")}
            className="mt-1 border-[#06B6B6]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10 hover:text-[#22E5E5]"
          >
            {dict.contact.form.submit}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0B0D10]/90 backdrop-blur-md">
      {/* Voltage hairline sweep */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00FFFF]/80 to-transparent" />

      {/* L-corner brackets */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-4 w-4 border-l border-t border-[#00FFFF]/30" />
        <div className="absolute right-0 top-0 h-4 w-4 border-r border-t border-[#00FFFF]/30" />
        <div className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-[#00FFFF]/30" />
        <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-[#00FFFF]/30" />
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-5 p-6 sm:p-8">
        {/* Honeypot field — hidden from humans, visible to bots */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#06B6B6] font-mono"
            >
              {dict.contact.form.name} *
            </Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict.contact.form.namePlaceholder}
              className="border-white/10 bg-white/[0.03] text-gray-100 placeholder:text-gray-600 focus-visible:ring-[#00FFFF]/40 focus-visible:border-[#00FFFF]/50"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#06B6B6] font-mono"
            >
              {dict.contact.form.email} *
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.contact.form.emailPlaceholder}
              className="border-white/10 bg-white/[0.03] text-gray-100 placeholder:text-gray-600 focus-visible:ring-[#00FFFF]/40 focus-visible:border-[#00FFFF]/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#06B6B6] font-mono"
          >
            {dict.contact.form.phone}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={dict.contact.form.phonePlaceholder}
            className="border-white/10 bg-white/[0.03] text-gray-100 placeholder:text-gray-600 focus-visible:ring-[#00FFFF]/40 focus-visible:border-[#00FFFF]/50"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="message"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#06B6B6] font-mono"
          >
            {dict.contact.form.message} *
          </Label>
          <Textarea
            id="message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={dict.contact.form.messagePlaceholder}
            className="border-white/10 bg-white/[0.03] text-gray-100 placeholder:text-gray-600 focus-visible:ring-[#00FFFF]/40 focus-visible:border-[#00FFFF]/50"
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="whatsappOptIn"
            checked={whatsappOptIn}
            onCheckedChange={(checked) => setWhatsappOptIn(checked === true)}
            className="mt-0.5 border-[#06B6B6]/50 data-[state=checked]:bg-[#00FFFF] data-[state=checked]:border-[#00FFFF] data-[state=checked]:text-[#07080A]"
          />
          <Label
            htmlFor="whatsappOptIn"
            className="cursor-pointer text-sm leading-snug text-gray-400"
          >
            {dict.contact.form.whatsappOptIn}
          </Label>
        </div>

        <div className="space-y-2">
          <AltchaWidget ref={altchaRef} challengeUrl={challengeUrl} />
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {dict.contact.form.error}
          </div>
        )}

        <Button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-gradient-to-r from-[#00FFFF] to-[#22E5E5] text-[#07080A] hover:from-[#22E5E5] hover:to-[#00FFFF] font-semibold tracking-wide disabled:opacity-50"
        >
          {status === "submitting" ? (
            <span className="flex items-center gap-2">
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#07080A]/30 border-t-[#07080A]" />
              {dict.contact.form.submitting}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="size-4" />
              {dict.contact.form.submit}
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
