'use client'
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, Variants } from "framer-motion";
import MotionVariants from "@/app/utils/motionsVariants"; // Certifique-se de ter o MotionVariants com as animações
import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/types";

const people = [
  {
    id: "person-1",
    name: "Rafael Scharf",
    role: "Software Engineer Manager | Tech Lead",
    avatar: "/api/assets/team/rafael-scharf.jpg",
  },
  {
    id: "person-2",
    name: "Anthony Farias",
    role: "Full Stack Developer | Cybersecurity Engineer",
    avatar: "/api/assets/team/anthony-farias.jpg",
  },
  {
    id: "person-3",
    name: "Leandro Damasio",
    role: "CEO | Principal Software Engineer | SRE | DevOps",
    avatar: "/api/assets/team/leandro-damasio.jpg",
  },
  {
    id: "person-4",
    name: "Magno Ozzyr",
    role: "PM | Lean-Agile Software Delivery Manager",
    avatar: "/api/assets/team/magno-ozzyr.jpg",
  },
  {
    id: "person-5",
    name: "Flávia Ribeiro",
    role: "SDR | Client Support | Customer Care",
    avatar: "/api/assets/team/flavia-ribeiro.jpg",
  },
];

const Team = ({ dict }: { dict: Dictionary }) => {
  const fadeInUp: Variants = MotionVariants.fadeInUp();
  const staggerContainer: Variants = MotionVariants.staggerContainer();

  return (
    <section className="py-5">
      <div className="container flex flex-col items-center text-center">
        <motion.h2
          className="my-6 text-pretty text-2xl font-bold lg:text-4xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          {dict.about.teamSection.heading}
        </motion.h2>
        <motion.p
          className="mb-8 max-w-3xl text-muted-foreground lg:text-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          {dict.about.teamSection.body}
        </motion.p>
      </div>
    
      <motion.div
  className="h-auto w-full bg-fixed bg-cover mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 bg-center bg-no-repeat shadow-lg rounded-2xl p-10"
  style={{ backgroundImage: "url('/api/assets/ui/polka-dots.svg')" }}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
  variants={staggerContainer}
>
  {/* Mapeando pessoas com ajustes responsivos */}
  {people.map((person) => (
    <motion.div
      key={person.id}
      className="flex flex-col items-center justify-center transition-colors duration-200 hover:text-primary p-2"
      variants={fadeInUp}
    >
      <Avatar className="mb-4 h-20 w-20 md:h-18 md:w-18 lg:h-18 lg:w-18 border">
        <Image
          quality={100}
          priority
          src={person.avatar}
          alt={person.name}
          width={100}
          height={100}
          className="rounded-full"
        />
        <AvatarFallback>{person.name}</AvatarFallback>
      </Avatar>
      <p className="text-center font-medium text-sm md:text-base lg:text-lg">{person.name}</p>
      <p className="text-center text-xs text-muted-foreground md:text-sm lg:text-base">
        {person.role}
      </p>
    </motion.div>
  ))}
</motion.div>

    </section>
  );
};

export default Team;
