'use client'

import MotionVariants from '@/app/utils/motionsVariants';
import { motion, Variants } from 'framer-motion';
import { BiLogoPostgresql } from 'react-icons/bi';
import { DiDjango } from 'react-icons/di';
import { FaGithub, FaReact, FaVuejs, FaAngular, FaNode, FaWordpress, FaAws, FaDocker, FaUbuntu, FaPython, FaHtml5, FaCss3, FaTrello } from 'react-icons/fa';
import { SiFastapi, SiGraphql, SiInkscape, SiInsomnia, SiJavascript, SiJirasoftware, SiJquery, SiMiro, SiMongodb, SiMysql, SiNextdotjs, SiPandas, SiPrisma, SiPulumi, SiTailwindcss, SiTypescript } from 'react-icons/si';

const icons = [
  { id: 0, icon: <FaGithub /> },
  { id: 1, icon: <FaHtml5 /> },
  { id: 2, icon: <FaCss3 /> },
  { id: 3, icon: <SiTailwindcss /> },
  { id: 4, icon: <SiJavascript /> },
  { id: 5, icon: <SiTypescript /> },
  { id: 6, icon: <FaReact /> },
  { id: 7, icon: <SiNextdotjs /> },
  { id: 8, icon: <FaVuejs /> },
  { id: 9, icon: <FaAngular /> },
  { id: 10, icon: <SiJquery /> },
  { id: 11, icon: <FaPython /> },
  { id: 12, icon: <SiFastapi /> },
  { id: 13, icon: <DiDjango /> },
  { id: 14, icon: <SiPandas /> },
  { id: 15, icon: <FaNode /> },
  { id: 16, icon: <BiLogoPostgresql /> },
  { id: 17, icon: <SiMysql /> },
  { id: 18, icon: <SiMongodb /> },
  { id: 19, icon: <SiGraphql /> },
  { id: 20, icon: <SiPrisma /> },
  { id: 21, icon: <FaAws /> },
  { id: 22, icon: <FaDocker /> },
  { id: 23, icon: <FaUbuntu /> },
  { id: 24, icon: <FaWordpress /> },
  { id: 25, icon: <SiInkscape /> },
  { id: 26, icon: <FaTrello /> },
  { id: 27, icon: <SiInsomnia /> },
  { id: 28, icon: <SiJirasoftware /> },
  { id: 29, icon: <SiPulumi /> },
  { id: 30, icon: <SiMiro /> },
];

const IconsList = () => {
  const fadeInUp: Variants = MotionVariants.fadeInUp();
  const staggerContainer: Variants = MotionVariants.staggerContainer();

  return (
    <section className="-mt-16 bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-15">
      <div className="flex flex-col items-center text-center">
        <motion.div
          className="h-24 w-full bg-fixed bg-cover flex overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          {/* Animando o container dos ícones com o movimento contínuo */}
          <motion.div
            className="flex"
            animate={{ x: ['10%', '-100%'] }}
            transition={{
              duration: 30,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            {icons.map(({ id, icon }) => (
              <motion.div
                key={id}
                className="flex justify-center items-center text-4xl mx-6"
                variants={fadeInUp}
              >
                {icon}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default IconsList;
