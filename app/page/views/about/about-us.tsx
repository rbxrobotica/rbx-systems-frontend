// app/views/aboutus/about-us.tsx
"use client";

import { cardItems } from "@/app/data/about_us/aboutUs";
import MotionVariants from "@/app/utils/motionsVariants";
import { motion, Variants } from "framer-motion";

import { SubmitCV } from "../../components/about_us/submitCVForm";
import Team from "../../components/about_us/team";

const AboutUs: React.FC = () => {
  const fadeInUp: Variants = MotionVariants.fadeInUp();
  const staggerContainer: Variants = MotionVariants.staggerContainer();
  const slideInLeft: Variants = MotionVariants.slideInLeft();
  const slideInRight: Variants = MotionVariants.slideInRight();

  const handleContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault(); // Impede o menu de contexto
  };

  return (
    <section className="-mt-10 py-16 md:py-32 px-6 md:px-16">
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
            Levando a inovação tecnológica para todos
          </motion.h1>
          <motion.p className="max-w-xl text-lg" variants={fadeInUp}>
            A RBX Robótica facilita a criação de sistemas personalizados,
            plataformas de automação e soluções de software inovadoras para
            empresas de diversos setores.
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
            src="/rbx_robotica_image4.jpeg"
            alt="placeholder"
            className="size-full max-h-96 select-none rounded-2xl object-cover"
            variants={slideInLeft}
            draggable="false"
            onContextMenu={handleContextMenu}
          />
          <motion.div
            className="flex flex-col justify-between gap-10 rounded-2xl bg-[url('/diamond-sunset.svg')] bg-repeat p-10"
            variants={slideInRight}
            draggable="false"
          >
            <p className="text-sm text-muted-foreground">NOSSA MISSÃO</p>
            <p className="text-lg font-medium">
              Acreditamos que a construção de soluções tecnológicas deve ser
              simples e acessível. Todos devem ter a liberdade de criar sistemas
              inovadores para resolver problemas reais, sem a necessidade de
              equipes grandes ou processos complexos.
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
              Tornamos a criação de software extremamente simples
            </h2>
            <p className="text-muted-foreground">
              Nosso objetivo é capacitar 1.000.000 de empresas a desenvolverem
              soluções personalizadas que atendam às suas necessidades. Veja
              como planejamos alcançar esse objetivo.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-10 md:grid-cols-3"
            variants={staggerContainer}
          >
            {/* Cards */}
            {cardItems.map((item) => (
              <motion.div
                className={`flex flex-col p-4 h-full w-full bg-gradient-to-r ${item.gradient} rounded-2xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-30 `}
                key={item.id}
                variants={fadeInUp}
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent">
                  <item.Icon className="size-5" />
                </div>
                <h3 className="mb-3 mt-2 text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="text-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        {/* Team */}
        <Team />

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
              Junte-se à nossa equipe
            </p>
            <h2 className="mb-2.5 text-2xl font-semibold md:text-4xl">
              Estamos transformando a forma como a tecnologia é desenvolvida
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
              E estamos em busca de pessoas apaixonadas por inovação e
              transformação digital. Se você quer fazer a diferença, venha fazer
              parte da nossa equipe.
            </p>
            <SubmitCV />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutUs;
