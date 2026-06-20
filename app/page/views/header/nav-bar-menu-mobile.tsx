// app/page/components/main/nav-bar-menu-mobile.tsx
"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ScrollArea } from "@/components/ui/scroll-area";

import { MenuItemMobile } from "@/app/interfaces/types/nav-bar-menu/navBarMenuTypes";
import { ModeToggle } from "../../middleware/toggle-mode";
import { LocaleSwitcher } from "@/components/locale-switcher";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/types";

export function DrawerMobile({
  aboutUs,
  blogEcontato,
  atelier,
  dict,
}: {
  aboutUs: MenuItemMobile[];
  blogEcontato: MenuItemMobile[];
  atelier: { href: string; title: string };
  dict: Dictionary;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="icon" variant="outline" className="border-border/70 bg-background/70 backdrop-blur">
          <Menu />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90svh] overflow-hidden">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{dict.nav.menu}</DrawerTitle>
            <DrawerDescription>{dict.nav.navigation}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 sm:px-6">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold">{dict.nav.mode}</p>
                <ModeToggle dict={dict} />
              </div>
              <LocaleSwitcher />
            </div>
            <Accordion type="single" collapsible className="w-full">
              {/* Sobre nós */}
              <AccordionItem value="about-us">
                <AccordionTrigger>{dict.nav.aboutUs}</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[min(18rem,50vh)] pr-4">
                    <ul className="space-y-4">
                      {aboutUs.map((item, index) => (
                        <li key={index}>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <DrawerClose asChild>
                            <Link
                              href={item.href}
                              className="inline-flex text-sm text-primary underline underline-offset-4"
                            >
                              {dict.nav.learnMore}
                            </Link>
                          </DrawerClose>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-4 flex flex-col space-y-2">
              {blogEcontato.map((item, index) => (
                <DrawerClose asChild key={index}>
                  <Link
                    href={item.href}
                    className="inline-flex w-full items-center justify-start rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {item.title}
                  </Link>
                </DrawerClose>
              ))}
              <DrawerClose asChild>
                <Link
                  href="/careers"
                  className="inline-flex w-full items-center justify-start rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {dict.nav.careers}
                </Link>
              </DrawerClose>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <DrawerClose asChild>
                <Link
                  href={atelier.href}
                  className="inline-flex w-full items-center justify-start rounded-md border border-cyan-500/30 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
                >
                  {atelier.title}
                </Link>
              </DrawerClose>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="border-red-600 text-red-600">
                {dict.nav.close}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
