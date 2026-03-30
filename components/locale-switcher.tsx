"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { Locale } from "@/lib/i18n/getDictionary";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALES: { value: Locale; flag: string; code: string; label: string }[] =
  [
    { value: "pt-BR", flag: "🇧🇷", code: "PT", label: "Português" },
    { value: "en", flag: "🇨🇭", code: "EN", label: "English" },
  ];

export function LocaleSwitcher() {
  const { locale } = useI18n();
  const router = useRouter();

  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  function switchLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `rbx-locale-override=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Switch language">
          <span className="text-lg leading-none">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => switchLocale(l.value)}
            className={`gap-3 ${l.value === locale ? "text-primary font-medium" : ""}`}
          >
            <span className="text-base leading-none">{l.flag}</span>
            <span className="font-mono text-xs tracking-widest">{l.code}</span>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {l.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
