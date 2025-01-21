// app/page/components/main/nav-bar-menu-mobile.tsx
"use client";

import * as React from "react";
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

export function DrawerMobile({
  services,
  aboutUs,
  blogEcontato,
}: {
  services: MenuItemMobile[];
  aboutUs: MenuItemMobile[];
  blogEcontato: MenuItemMobile[];
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="icon">
          <Menu />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription>Explore o que oferecemos:</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <div className="flex items-center justify-end space-x-1 mb-2">
              <p className="text-sm font-semibold">Modo</p>
              <ModeToggle />
            </div>
            <Accordion type="single" collapsible className="w-full">
              {/* Sobre nós */}
              <AccordionItem value="about-us">
                <AccordionTrigger>Sobre nós</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-72">
                    <ul className="space-y-4">
                      {aboutUs.map((item, index) => (
                        <li key={index}>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <a
                            href={item.href}
                            className="text-blue-500 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Saiba mais
                          </a>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
              {/* Serviços */}
              <AccordionItem value="services">
                <AccordionTrigger>Serviços</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-72">
                    <ul className="space-y-4">
                      {services.map((service, index) => (
                        <li key={index}>
                          <h3 className="font-semibold">{service.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                          <a
                            href={service.href}
                            className="text-blue-500 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Saiba mais
                          </a>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="flex flex-col mt-2 space-y-2">
            {blogEcontato.map((blogEcontato, index) => (
              <Button key={index} className="bg-muted text-foreground">
                {blogEcontato.title}
              </Button>
            ))}
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="border-red-600 text-red-600">
                Fechar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
