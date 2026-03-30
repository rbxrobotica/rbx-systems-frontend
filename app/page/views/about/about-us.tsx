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
    <section className="-mt-10 py-16 md:py-32 px-6 md:px-16" id="about-us">
      <div className="container flex flex-col gap-28">
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
            className="max-w-xl text-lg"
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
            className="flex flex-col justify-between gap-10 rounded-2xl bg-repeat p-10"
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

        {/* Join Our Team */}
        <motion.div
          className="grid gap-10 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <p className="mb-10 text-sm font-medium text-muted-foreground">
              {dict.about.joinTeam.label}
            </p>
            <h2 className="mb-2.5 text-2xl font-semibold md:text-4xl">
              {dict.about.joinTeam.heading}
            </h2>
          </motion.div>
          <motion.div variants={slideInRight}>
            {/* <Image
              src=""
              alt="placeholder"
              width={0}
              height={0}
              className="mb-6 max-h-36 w-full rounded-xl object-cover"
            /> */}
            <div className="mb-6 h-3 rounded-full w-full bg-foreground"></div>
            <p className="text-muted-foreground">
              {dict.about.joinTeam.body}
            </p>
            <SubmitCV dict={dict} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutUs;
