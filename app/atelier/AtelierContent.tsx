"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Footer from "@/app/page/views/footer/footer";
import type { Dictionary } from "@/lib/i18n/types";

// CTA Links - Centralized for easy updates
const CTA_LINKS = {
  requestProposal: "#contact",
  scheduleCall: "#contact",
};

// Selected Works data
const SELECTED_WORKS = [
  {
    id: 1,
    title: "Institutional Narrative",
    description: "Strategic positioning through visual storytelling",
    youtubeUrl: "https://www.youtube.com/embed/b1waaKdSHKM",
  },
  {
    id: 2,
    title: "Executive Communication",
    description: "Leadership presence and corporate messaging",
    youtubeUrl: "https://www.youtube.com/embed/9Wy9B_BlvwA",
  },
  {
    id: 3,
    title: "Product Storytelling",
    description: "Complex systems translated into clear narratives",
    youtubeUrl: "https://www.youtube.com/embed/kIYyb-3iDMg",
  },
  {
    id: 4,
    title: "Strategic Briefing",
    description: "Decision-making support through visual clarity",
    youtubeUrl: "https://www.youtube.com/embed/B30GzSKNHVA",
  },
];

// How we work steps
const WORK_STEPS = [
  {
    step: 1,
    title: "Context and objective definition",
  },
  {
    step: 2,
    title: "Narrative and positioning design",
  },
  {
    step: 3,
    title: "Production and execution",
  },
  {
    step: 4,
    title: "Delivery and iteration",
  },
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function AtelierContent({ dict }: { dict: Dictionary }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.p
            className="text-sm tracking-[0.3em] uppercase text-neutral-500 mb-6"
            variants={fadeInUp}
          >
            RBX Atelier
          </motion.p>
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-8"
            variants={fadeInUp}
          >
            Strategic Visual Production
            <br />
            <span className="text-neutral-400">for Systems, Finance and Technology</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            We design and produce visual narratives for companies operating in complex environments, where clarity, precision and positioning matter.
          </motion.p>
        </motion.div>
      </section>

      {/* What We Do Section */}
      <section className="py-24 px-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p
              className="text-sm tracking-[0.2em] uppercase text-neutral-500 mb-4"
              variants={fadeInUp}
            >
              What we do
            </motion.p>
            <motion.p
              className="text-xl md:text-2xl text-neutral-300 max-w-3xl leading-relaxed"
              variants={fadeInUp}
            >
              We operate at the intersection of systems, strategy and communication.
              <br />
              <br />
              RBX Atelier translates systems, products and strategic decisions into high-impact visual communication.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 px-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p
              className="text-sm tracking-[0.2em] uppercase text-neutral-500 mb-12"
              variants={fadeInUp}
            >
              Capabilities
            </motion.p>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8"
              variants={staggerContainer}
            >
              {[
                "Institutional video production",
                "Executive communication assets",
                "Product and system storytelling",
                "Financial and strategic narratives",
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  variants={fadeInUp}
                >
                  <span className="text-neutral-600 text-sm mt-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg text-neutral-200">{item}</span>
                </motion.div>
              ))}
            </motion.div>
            <motion.p
              className="text-neutral-500 mt-12 max-w-2xl"
              variants={fadeInUp}
            >
              Each project is developed to align with the client&apos;s positioning, audience and operational context.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Selected Works Section */}
      <section className="py-24 px-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p
              className="text-sm tracking-[0.2em] uppercase text-neutral-500 mb-4"
              variants={fadeInUp}
            >
              Selected Works
            </motion.p>
            <motion.p
              className="text-xl md:text-2xl text-neutral-300 mb-16 max-w-2xl"
              variants={fadeInUp}
            >
              A curated selection of recent productions.
            </motion.p>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={staggerContainer}
            >
              {SELECTED_WORKS.map((work) => (
                <motion.div
                  key={work.id}
                  className="group"
                  variants={fadeInUp}
                >
                  <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden mb-4 border border-neutral-800 group-hover:border-neutral-700 transition-colors duration-300">
                    <iframe
                      src={work.youtubeUrl}
                      title={work.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-200 mb-1">
                    {work.title}
                  </h3>
                  <p className="text-sm text-neutral-500">{work.description}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              className="text-neutral-500 mt-12 max-w-2xl"
              variants={fadeInUp}
            >
              Each piece reflects a different layer of communication, from institutional presence to product positioning and strategic messaging.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-24 px-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p
              className="text-sm tracking-[0.2em] uppercase text-neutral-500 mb-4"
              variants={fadeInUp}
            >
              How we work
            </motion.p>
            <motion.p
              className="text-xl md:text-2xl text-neutral-300 mb-16 max-w-2xl"
              variants={fadeInUp}
            >
              RBX Atelier operates with a structured, system-oriented approach:
            </motion.p>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-8"
              variants={staggerContainer}
            >
              {WORK_STEPS.map((item) => (
                <motion.div
                  key={item.step}
                  className="border-l border-neutral-800 pl-6"
                  variants={fadeInUp}
                >
                  <span className="text-3xl font-light text-neutral-600 mb-3 block">
                    {String(item.step).padStart(2, "0")}
                  </span>
                  <p className="text-neutral-300">{item.title}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              className="text-neutral-500 mt-12 max-w-2xl"
              variants={fadeInUp}
            >
              Projects are scoped individually, based on complexity and requirements.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 border-t border-neutral-900" id="contact">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p
              className="text-sm tracking-[0.2em] uppercase text-neutral-500 mb-6"
              variants={fadeInUp}
            >
              Start a project with RBX Atelier
            </motion.p>
            <motion.p
              className="text-xl md:text-2xl text-neutral-300 mb-12"
              variants={fadeInUp}
            >
              We work with a limited number of projects per cycle.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 px-8 py-6 text-base"
                asChild
              >
                <a href={CTA_LINKS.requestProposal}>Request a proposal</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-900 hover:text-white px-8 py-6 text-base"
                asChild
              >
                <a href={CTA_LINKS.scheduleCall}>Schedule a call</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-12 px-6 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-neutral-600 text-sm">
            {dict.atelier.footerNote}{" "}
            <a
              href="/"
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              RBX Systems
            </a>
          </p>
        </div>
      </section>

      <Footer dict={dict} />
    </div>
  );
}
