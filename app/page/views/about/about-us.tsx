// app/views/aboutus/about-us.tsx
"use client";

import { cardMeta } from "@/app/data/about_us/aboutUs";
import MotionVariants from "@/app/utils/motionsVariants";
import { motion, Variants } from "framer-motion";

import { SubmitCV } from "../../components/about_us/submitCVForm";
import Team from "../../components/about_us/team";
import type { Dictionary } from "@/lib/i18n/types";

const AboutUs: React.FC<{ dict: Dictionary }> = ({ dict }) => {
  const fadeInUp: Variants = MotionVariants.fadeInUp();
  const staggerContainer: Variants = MotionVariants.staggerContainer();
  const slideInLeft: Variants = MotionVariants.slideInLeft();
  const slideInRight: Variants = MotionVariants.slideInRight();

  const handleContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault(); // Impede o menu de contexto
  };

  return (
    <section className="-mt-10 px-4 py-16 sm:px-6 md:py-24 lg:px-8" id="about-us">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 md:gap-28">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-7"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h1
            className="text-3xl font-semibold lg:text-5xl"
            variants={fadeInUp}
          >
            {dict.about.heading}
          </motion.h1>
          <motion.p
            id="mission"
            className="max-w-xl text-base sm:text-lg"
            variants={fadeInUp}
          >
            {dict.about.mission}
          </motion.p>
        </motion.div>

        {/* Image and Mission */}
        <motion.div
          className="grid gap-6 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.img
            src="/api/assets/about/rbx-about.jpeg"
            alt="RBX Systems"
            className="size-full max-h-96 select-none rounded-2xl object-cover"
            variants={slideInLeft}
            draggable="false"
            onContextMenu={handleContextMenu}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/rbx_robotica_image4.jpeg";
            }}
          />
          <motion.div
            className="flex flex-col justify-between gap-10 rounded-2xl bg-repeat p-6 sm:p-10"
            style={{ backgroundImage: "url('/api/assets/ui/diamond-sunset.svg')" }}
            variants={slideInRight}
            draggable="false"
          >
            <p className="text-sm text-muted-foreground">{dict.about.positioning}</p>
            <p className="text-lg font-medium" id="approach">
              {dict.about.positioningBody}
            </p>
          </motion.div>
        </motion.div>

        {/* Our Approach */}
        <motion.div
          className="flex flex-col gap-6 md:gap-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div className="max-w-xl" variants={fadeInUp}>
            <h2 className="mb-2.5 text-2xl font-semibold md:text-4xl">
              {dict.about.howWeOperate}
            </h2>
            <p className="text-muted-foreground">
              {dict.about.howWeOperateBody}
            </p>
          </motion.div>

          <motion.div
            className="grid gap-10 md:grid-cols-3"
            variants={staggerContainer}
          >
            {/* Cards */}
            {cardMeta.map((meta, idx) => (
              <motion.div
                className={`flex flex-col p-4 h-full w-full bg-gradient-to-r ${meta.gradient} rounded-2xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-30 `}
                key={meta.id}
                variants={fadeInUp}
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent">
                  <meta.Icon className="size-5" />
                </div>
                <h3 className="mb-3 mt-2 text-lg font-semibold">
                  {dict.about.cards[idx]?.title}
                </h3>
                <p className="text-foreground" id="team">
                  {dict.about.cards[idx]?.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        {/* Team */}
        <Team dict={dict} />

        {/* Join Our Team — Zug-Coded Panel */}
        <motion.div
          id="careers"
          className="relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {/* Tick ruler */}
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#00FFFF]/40 to-transparent" />
            <span className="text-[10px] font-mono font-medium uppercase tracking-[0.2em] text-[#06B6B6]">
              {dict.about.joinTeam.label}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#00FFFF]/40 to-transparent" />
          </div>

          <div className="grid gap-10 lg:grid-cols-5">
            <motion.div className="lg:col-span-2 flex flex-col justify-center" variants={fadeInUp}>
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
                {dict.about.joinTeam.heading}
              </h2>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                {dict.about.joinTeam.body}
              </p>

              {/* Institutional metadata */}
              <div className="mt-8 space-y-3 border-l border-[#00FFFF]/20 pl-4">
                <div className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-[#00FFFF]" />
                  <span className="text-xs font-mono text-gray-400">
                    {dict.about.joinTeam.metaLocation}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-[#22E5E5]" />
                  <span className="text-xs font-mono text-gray-400">
                    {dict.about.joinTeam.metaMode}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-[#06B6B6]" />
                  <span className="text-xs font-mono text-gray-400">
                    {dict.about.joinTeam.metaStack}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div className="lg:col-span-3" variants={slideInRight}>
              <SubmitCV dict={dict} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutUs;
