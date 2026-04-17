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
