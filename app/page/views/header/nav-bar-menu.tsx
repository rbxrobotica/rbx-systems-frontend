// app/page/components/main/nav-bar-menu.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { DrawerMobile } from "./nav-bar-menu-mobile";
import {
  aboutUsItems,
  blogEcontatoItems,
  servicesItems,
} from "../../../data/main/menuItens";
import { MenuItem } from "@/app/interfaces/types/nav-bar-menu/navBarMenuTypes";
import { ModeToggle } from "../../middleware/toggle-mode";

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Tamanho do breakpoint para mobile
    };

    updateIsMobile(); // Checar na inicialização
    window.addEventListener("resize", updateIsMobile);

    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  return isMobile;
};

export function NavigationMenuBar(): JSX.Element {
  const isMobile = useIsMobile();

  return (
    <motion.div
      className="flex items-center py-2 px-6 justify-between bg-foreground/10 rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-15"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Logo e título */}
      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Image
          src="/bitmap.svg"
          alt="logo"
          quality={100}
          width={55}
          height={55}
        />
        <div className="flex flex-col -space-y-2">
          <p className="text-lg font-bold">RBX</p>
          <p className="text-xs">Robótica</p>
        </div>
      </motion.div>

      {isMobile ? (
        <DrawerMobile
          services={servicesItems}
          aboutUs={aboutUsItems}
          blogEcontato={blogEcontatoItems}
        />
      ) : (
        <>
          {/* Navigation menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Sobre nós
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
                    {aboutUsItems.map((item: MenuItem) =>
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
              {/* Serviços */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Serviços
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[600px] gap-3 p-4 md:w-[750px] md:grid-cols-3 lg:w-[800px]">
                    {servicesItems.map((item: MenuItem) => (
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
              {/* Blog e Contato */}
              <NavigationMenuItem>
                {blogEcontatoItems.map((item: MenuItem) => (
                  <Link href={item.href} key={item.id} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {item.title}
                    </NavigationMenuLink>
                  </Link>
                ))}
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* toggle mode */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ModeToggle />
            <Button>Solicitar consulta</Button>
          </motion.div>
        </>
      )}
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
