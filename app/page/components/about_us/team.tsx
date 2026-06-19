'use client'
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, Variants } from "framer-motion";
import MotionVariants from "@/app/utils/motionsVariants";
import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/types";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
};

const people: TeamMember[] = [
  {
    id: "person-1",
    name: "Rafael Scharf",
    role: "Software Engineer Manager | Tech Lead",
  },
  {
    id: "person-2",
    name: "Anthony Farias",
    role: "Full Stack Developer | Cybersecurity Engineer",
  },
  {
    id: "person-3",
    name: "Leandro Damasio",
    role: "CEO | CTO",
  },
  {
    id: "person-4",
    name: "Magno Ozzyr",
    role: "PM | Lean-Agile Software Delivery Manager",
  },
  {
    id: "person-5",
    name: "Flávia Ribeiro",
    role: "SDR | Client Support | Customer Care",
  },
  {
    id: "person-6",
    name: "Cauê Souza Azevedo Alencar",
    role: "CFO",
  },
  {
    id: "person-7",
    name: "Fabio Gama Nascimento",
    role: "Knowledge Operations & Information Governance Specialist",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TeamMemberAvatar({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false);
  const hasImage = src && src.trim().length > 0;

  return (
    <Avatar className="mb-4 h-20 w-20 border">
      {hasImage && !error && (
        <Image
          unoptimized
          priority
          src={src}
          alt={name}
          width={80}
          height={80}
          className="rounded-full object-cover w-full h-full"
          onError={() => setError(true)}
        />
      )}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

const Team = ({ dict }: { dict: Dictionary }) => {
  const fadeInUp: Variants = MotionVariants.fadeInUp();
  const staggerContainer: Variants = MotionVariants.staggerContainer();

  return (
    <section className="py-5">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
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
        className="mt-16 grid h-auto w-full grid-cols-1 gap-4 rounded-2xl bg-cover bg-center bg-no-repeat p-6 shadow-lg sm:grid-cols-2 sm:p-8 md:grid-cols-3 lg:grid-cols-4 lg:p-10 xl:grid-cols-5"
        style={{ backgroundImage: "url('/api/assets/ui/polka-dots.svg')" }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        {people.map((person) => (
          <motion.div
            key={person.id}
            className="flex flex-col items-center justify-center transition-colors duration-200 hover:text-primary p-2"
            variants={fadeInUp}
          >
            <TeamMemberAvatar src={person.avatar} name={person.name} />
            <p className="text-center font-medium text-sm md:text-base lg:text-lg">
              {person.name}
            </p>
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
