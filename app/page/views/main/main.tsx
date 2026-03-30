// app/views/main/main.tsx

"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { motion, Variants } from "framer-motion";
import MotionVariants from "@/app/utils/motionsVariants";
import type { Dictionary } from "@/lib/i18n/types";

const Main: React.FC<{ dict: Dictionary }> = ({ dict }) => {
  const interBubbleRef = useRef<HTMLDivElement | null>(null);

  const handleContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault(); // Impede o menu de contexto
  };

  useEffect(() => {
    let curX = 0;
    let curY = 0;
    let tgX = 0;
    let tgY = 0;

    const move = () => {
      if (interBubbleRef.current) {
        curX += (tgX - curX) / 20;
        curY += (tgY - curY) / 20;
        interBubbleRef.current.style.transform = `translate(${Math.round(
          curX
        )}px, ${Math.round(curY)}px)`;
      }
      requestAnimationFrame(move);
    };

    const handleMouseMove = (event: MouseEvent) => {
      tgX = event.clientX;
      tgY = event.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    move();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const container: Variants = MotionVariants.containerVariants();
  const button: Variants = MotionVariants.buttonVariants();
  const image: Variants = MotionVariants.imageVariants();

  return (
    <>
      <motion.div
        className="h-screen w-full flex flex-col-reverse md:flex-row lg:flex-row items-center justify-around main-container md:-mt-16 lg:-mt-16"
        initial="hidden"
        animate="visible"
        variants={container}
      >
       <motion.div
          className="-mt-[25rem] px-5 text-center md:px-0 md:text-start md:ml-24 md:mt-36 md:w-[50%] lg:px-0 lg:text-start lg:ml-24 lg:mt-36 lg:w-[50%]"
          variants={container}
        >
          <div className="space-y-4">
            <p className="text-2xl font-semibold md:text-3xl lg:text-3xl">
              {dict.hero.headline}
            </p>
            <p className="text-sm opacity-80">
              {dict.hero.body}
            </p>
          </div>
          <motion.div variants={button} className="flex flex-wrap gap-4 mt-10">
            <Button asChild>
              <Link href="/servicos">{dict.hero.ctaServices}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/produtos">{dict.hero.ctaProducts}</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="-mt-[17rem] relative w-[100%] h-[100%] md:w-[90%] md:h-[90%] md:-mt-0 lg:w-[90%] lg:h-[90%] lg:-mt-0"
          variants={image}
        >
          <Image
            src="/api/assets/ui/bitmap_bg.svg"
            alt="Background"
            quality={100}
            fill
            style={{ objectFit: "contain" }}
            priority
            draggable="false"
            unoptimized
            onContextMenu={handleContextMenu}
          />
        </motion.div>
      </motion.div>
      <div className="gradient-bg fixed top- left-0 right-0 bottom-0">
        <svg xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="goo">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="10"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
        <div className="gradients-container">
          <div className="g1"></div>
          <div className="g2"></div>
          <div className="g3"></div>
          <div className="g4"></div>
          <div className="g5"></div>
          <div className="interactive" ref={interBubbleRef}></div>
        </div>
      </div>
    </>
  );
};

export default Main;

