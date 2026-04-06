// app/page/components/main/nav-bar-menu.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";
import { DrawerMobile } from "./nav-bar-menu-mobile";
import { ModeToggle } from "../../middleware/toggle-mode";
import { MenuItem } from "@/app/interfaces/types/nav-bar-menu/navBarMenuTypes";
import type { Dictionary } from "@/lib/i18n/types";

export function NavigationMenuBar({ dict }: { dict: Dictionary }): JSX.Element {
  return (
    <motion.div
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sm:px-4 lg:px-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Link href="/" className="min-w-0 flex items-center">
        <motion.div
          className="flex min-w-0 items-center gap-2 sm:gap-3"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Image
            src="/api/assets/ui/bitmap.svg"
            alt="logo"
            quality={100}
            width={55}
            height={55}
            className="h-10 w-10 shrink-0 sm:h-[55px] sm:w-[55px]"
            unoptimized
          />
          <div className="min-w-0">
            <p className="text-base font-bold sm:text-lg">RBX</p>
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
              {dict.nav.subtitle}
            </p>
          </div>
        </motion.div>
      </Link>

      <div className="lg:hidden">
        <DrawerMobile
          services={dict.servicesMenu as MenuItem[]}
          aboutUs={dict.aboutUsMenu as MenuItem[]}
          blogEcontato={dict.blogEcontatoMenu as MenuItem[]}
          atelier={dict.atelierMenu as MenuItem}
          dict={dict}
        />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-end gap-4 lg:flex">
        <NavigationMenu className="justify-end">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">
                {dict.nav.aboutUs}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <motion.ul
                  className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { staggerChildren: 0.1 },
                    },
                  }}
                >
                  {(dict.aboutUsMenu as MenuItem[]).map((item: MenuItem) =>
                    item.isHighlight ? (
                      <motion.li
                        key={item.id}
                        className="row-span-3"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                      >
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-[#01FFFF]/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href={item.href}
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">
                              {item.title}
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              {item.description}
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </motion.li>
                    ) : (
                      <ListItem
                        key={item.id}
                        href={item.href}
                        title={item.title}
                      >
                        {item.description}
                      </ListItem>
                    )
                  )}
                </motion.ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">
                {dict.nav.services}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[600px] gap-3 p-4 md:w-[750px] md:grid-cols-3 lg:w-[800px]">
                  {(dict.servicesMenu as MenuItem[]).map((item: MenuItem) => (
                    <ListItem
                      key={item.id}
                      title={item.title}
                      href={item.href}
                    >
                      {item.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              {(dict.blogEcontatoMenu as MenuItem[]).map((item: MenuItem) => (
                <Link href={item.href} key={item.id} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              ))}
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href={dict.atelierMenu.href} legacyBehavior passHref>
                <NavigationMenuLink className="bg-transparent px-4 py-2 font-medium text-foreground/90 transition-colors duration-200 hover:text-primary">
                  {dict.atelierMenu.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <motion.div
          className="flex shrink-0 items-center gap-2 xl:gap-4"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ModeToggle dict={dict} />
          <LocaleSwitcher />
          <Button asChild className="hidden xl:inline-flex">
            <Link href="/#footer">{dict.nav.contact}</Link>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    title: string;
    children?: React.ReactNode;
  }
>(({ className, title, children, ...props }, ref) => {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </motion.li>
  );
});
ListItem.displayName = "ListItem";
