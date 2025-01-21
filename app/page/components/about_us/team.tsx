'use client'
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, Variants } from "framer-motion";
import MotionVariants from "@/app/utils/motionsVariants"; // Certifique-se de ter o MotionVariants com as animações
import Image from "next/image";

const people = [
  {
    id: "person-1",
    name: "Rafael Scharf",
    role: "Engenheiro de Software",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQFvqMPm5iq4vA/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1721338506559?e=1743033600&v=beta&t=29BP6v1lCqUXwdCv-OCjzJ97ElRF3aH7DL3yB7QJOOE",
  },
  {
    id: "person-2",
    name: "Anthony Farias",
    role: "Desenvolvedor Full Stack",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQFpQF6LaAgiBw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1727209167224?e=1743033600&v=beta&t=ma0W26-Zm2g8sUn-d4mlaj3bsZx0WQ8crj0EEOe7GRM",
  },
  {
    id: "person-3",
    name: "Leandro Damásio",
    role: "CEO - CTO",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQH1A7fWu0QDKw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1714692052061?e=1743033600&v=beta&t=heeTdd4MSVKuiSl98bre_Qox6R2cRjTRDFOEDQTUg90",
  },
  
  {
    id: "person-4",
    name: "Magno Ozzyr",
    role: "Tech Lead",
    avatar: "https://media.licdn.com/dms/image/v2/D4E03AQHE0DVhQ0EGNQ/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1729826161143?e=1743033600&v=beta&t=Omdu7cfTe4pBsaEFGe8EM-QsKdasB9bxNv1lE0bLMVg",
  },
  {
    id: "person-5",
    name: "Flávia Ribeiro",
    role: "Atendimento ao cliente",
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
          Conheça o nosso time
        </motion.h2>
        <motion.p
          className="mb-8 max-w-3xl text-muted-foreground lg:text-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          Na RBX Robótica, contamos com uma equipe apaixonada por inovação e
          tecnologia, trabalhando constantemente para trazer soluções
          revolucionárias. Estamos em busca de pessoas talentosas para fazer
          parte do nosso time!
        </motion.p>
      </div>
    
      <motion.div
        className="h-96 w-full bg-fixed bg-[url('/polka-dots.svg')] bg-cover mt-16 grid md:grid-cols-2 lg:grid-cols-5 bg-center bg-no-repeat shadow-lg rounded-2xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        {/* Ajuste aqui para centralizar os itens */}
        {people.map((person) => (
          <motion.div
            key={person.id}
            className="flex flex-col items-center justify-center transition-colors duration-200 hover:text-primary" 
            variants={fadeInUp}
          >
            <Avatar className="mb-4 size-15 border md:mb-5 lg:size-20">
              <Image quality={100} priority src={person.avatar} alt={person.name} width={100} height={100} />
              <AvatarFallback>{person.name}</AvatarFallback>
            </Avatar>
            <p className="text-center font-medium">{person.name}</p>
            <p className="text-center text-muted-foreground">{person.role}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Team;
