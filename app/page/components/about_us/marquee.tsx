'use client'

import MotionVariants from '@/app/utils/motionsVariants';
import { motion, Variants } from 'framer-motion';
import { BiLogoPostgresql } from 'react-icons/bi';
import { FaNode, FaReact } from 'react-icons/fa';
import { SiArgo, SiGo, SiKubernetes, SiRust } from 'react-icons/si';

const icons = [
  { id: 0, icon: <SiRust /> },
  { id: 1, icon: <SiGo /> },
  { id: 2, icon: <FaReact /> },
  { id: 3, icon: <FaNode /> },
  { id: 4, icon: <BiLogoPostgresql /> },
  { id: 5, icon: <SiKubernetes /> },
  { id: 6, icon: <SiArgo /> },
];

const IconsList = () => {
  const fadeInUp: Variants = MotionVariants.fadeInUp();
  const staggerContainer: Variants = MotionVariants.staggerContainer();

  const allIcons = [...icons, ...icons];

  return (
    <section className="w-full overflow-hidden -mt-16 bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-15">
      <motion.div
        className="h-24 flex"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <motion.div
          className="flex shrink-0"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 20,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {allIcons.map(({ id, icon }, i) => (
            <motion.div
              key={`${id}-${i}`}
              className="flex justify-center items-center text-4xl w-24"
              variants={fadeInUp}
            >
              {icon}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default IconsList;
