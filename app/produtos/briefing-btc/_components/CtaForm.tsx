"use client";

import { useState, useRef, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AltchaWidget from "@/app/components/altcha-widget";

type Status = "idle" | "submitting" | "success" | "error";

function getCommsBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.host.includes("rbxsystems.ch")
    ? "https://comms.rbxsystems.ch"
    : "https://comms.rbx.ia.br";
}

export default function CtaForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const altchaRef = useRef<{ value: string | null }>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    const altchaPayload = altchaRef.current?.value;
    if (!altchaPayload) {
      setStatus("error");
      return;
    }

    const base = getCommsBaseUrl();
    try {
      const res = await fetch(`${base}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message: "Interesse no Briefing Diário BTC.",
          whatsappOptIn,
          source: "briefing-btc",
          altcha: altchaPayload,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-foreground font-medium mb-1">Amostra a caminho.</p>
        <p className="text-muted-foreground text-sm">
          Verifique seu e-mail em até 24h.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bf-name" className="text-sm text-muted-foreground">
            Nome
          </Label>
          <Input
            id="bf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Seu nome"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bf-email" className="text-sm text-muted-foreground">
            E-mail
          </Label>
          <Input
            id="bf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="voce@email.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bf-phone" className="text-sm text-muted-foreground">
          WhatsApp <span className="text-muted-foreground/50">(opcional)</span>
        </Label>
        <Input
          id="bf-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="+55 11 99999-9999"
        />
      </div>

      <div className="flex items-start gap-3 pt-1">
        <Checkbox
          id="bf-wa"
          checked={whatsappOptIn}
          onCheckedChange={(v) => setWhatsappOptIn(v === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="bf-wa"
          className="text-sm text-muted-foreground leading-snug cursor-pointer"
        >
          Posso enviar a amostra também via WhatsApp.
        </Label>
      </div>

      <div className="pt-1">
        <AltchaWidget ref={altchaRef} challengeUrl={`${getCommsBaseUrl()}/api/altcha-challenge`} />
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">
          Algo deu errado. Tente novamente ou escreva para{" "}
          <a href="mailto:contact@rbxsystems.ch" className="underline">
            contact@rbxsystems.ch
          </a>
          .
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full sm:w-auto"
      >
        {status === "submitting" ? "Enviando…" : "Receber amostra grátis →"}
      </Button>
    </form>
  );
}
