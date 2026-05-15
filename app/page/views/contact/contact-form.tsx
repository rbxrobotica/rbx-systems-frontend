"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Send, CheckCircle2, AlertCircle } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/types";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export default function ContactForm({ dict }: { dict: Dictionary }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, message, whatsappOptIn }),
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="text-sm text-gray-300">{dict.contact.form.success}</p>
        <Button variant="outline" size="sm" onClick={() => setStatus("idle")} className="mt-2">
          {dict.contact.form.submit}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm text-gray-300">
          {dict.contact.form.name} *
        </Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.contact.form.namePlaceholder}
          className="bg-white/5 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm text-gray-300">
          <Mail className="mr-1 inline h-3.5 w-3.5" />
          {dict.contact.form.email} *
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.contact.form.emailPlaceholder}
          className="bg-white/5 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm text-gray-300">
          <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
          {dict.contact.form.phone}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={dict.contact.form.phonePlaceholder}
          className="bg-white/5 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm text-gray-300">
          {dict.contact.form.message} *
        </Label>
        <Textarea
          id="message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={dict.contact.form.messagePlaceholder}
          className="bg-white/5 border-gray-700 text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="whatsappOptIn"
          checked={whatsappOptIn}
          onCheckedChange={(checked) => setWhatsappOptIn(checked === true)}
          className="mt-0.5 border-gray-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
        />
        <Label htmlFor="whatsappOptIn" className="text-sm text-gray-400 leading-snug cursor-pointer">
          {dict.contact.form.whatsappOptIn}
        </Label>
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
        className="w-full bg-white text-gray-900 hover:bg-gray-200 disabled:opacity-50"
      >
        {status === "submitting" ? (
          dict.contact.form.submitting
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {dict.contact.form.submit}
          </>
        )}
      </Button>
    </form>
  );
}
