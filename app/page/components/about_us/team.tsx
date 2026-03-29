'use client'
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, Variants } from "framer-motion";
import MotionVariants from "@/app/utils/motionsVariants"; // Certifique-se de ter o MotionVariants com as animações
import Image from "next/image";

const people = [
  {
    id: "person-1",
    name: "Rafael Scharf",
    role: "Software Engineer Manager | Tech Lead",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQFvqMPm5iq4vA/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1721338506559?e=1743033600&v=beta&t=29BP6v1lCqUXwdCv-OCjzJ97ElRF3aH7DL3yB7QJOOE",
  },
  {
    id: "person-2",
    name: "Anthony Farias",
    role: "Full Stack Developer | Cybersecurity Engineer",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQFpQF6LaAgiBw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1727209167224?e=1743033600&v=beta&t=ma0W26-Zm2g8sUn-d4mlaj3bsZx0WQ8crj0EEOe7GRM",
  },
  {
    id: "person-3",
    name: "Leandro Damasio",
    role: "CEO | Principal Software Engineer | SRE | DevOps",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQH1A7fWu0QDKw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1714692052061?e=1743033600&v=beta&t=heeTdd4MSVKuiSl98bre_Qox6R2cRjTRDFOEDQTUg90",
  },
  
  {
    id: "person-4",
    name: "Magno Ozzyr",
    role: "PM | Lean-Agile Software Delivery Manager",
    avatar: "https://media.licdn.com/dms/image/v2/D4E03AQHE0DVhQ0EGNQ/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1729826161143?e=1743033600&v=beta&t=Omdu7cfTe4pBsaEFGe8EM-QsKdasB9bxNv1lE0bLMVg",
  },
  {
    id: "person-5",
    name: "Flávia Ribeiro",
    role: "SDR | Client Support | Customer Care",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQGJ6F3E25EeXA/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1714833615433?e=1743033600&v=beta&t=OwsKIi484nQtaPvNwzT3O66NPibnEAC-3QNOfWB9zhw",
  }
];

const Team = () => {
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
          Nossa equipe
        </motion.h2>
        <motion.p
          className="mb-8 max-w-3xl text-muted-foreground lg:text-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          Engenheiros, arquitetos de sistemas e especialistas em infraestrutura.
          Operamos com foco em backend, cloud, automacao e IA aplicada em
          ambientes de producao.
        </motion.p>
      </div>
    
      <motion.div
  className="h-auto w-full bg-fixed bg-[url('/polka-dots.svg')] bg-cover mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 bg-center bg-no-repeat shadow-lg rounded-2xl p-10"
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
