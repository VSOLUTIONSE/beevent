"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { TextGradient } from "@/design/primitives";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const lineVariants = {
  hidden: {
    y: "150%",
    clipPath: "inset(100% 0 0 0)",
    filter: "blur(8px)",
  },
  visible: {
    y: 0,
    clipPath: "inset(0 0 0 0)",
    filter: "blur(0px)",
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export default function Hero() {
  return (
    <section className="relative w-full min-h-[100dvh] flex items-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-hall.jpg"
          alt="BeeVelt Halls interior"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030305]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-16 lg:pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Overline */}
          {/*  */}

          {/* Main Heading - Kinetic Typography */}
          <div className="overflow-hidden mb-4">
            <motion.h1
              variants={lineVariants}
              className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[1.05] tracking-tight"
            >
              Moments that
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-8">
            <motion.h1
              variants={lineVariants}
              className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight"
            >
              <TextGradient>transcend time.</TextGradient>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-base lg:text-lg text-[#B0A8A8] max-w-md mb-10 leading-relaxed"
          >
            Book BeeVelt Halls for your weddings, galas, conferences, corporate
            events, and private celebrations, Lagos&apos; premier event venue
            platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-[#E33539] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E33539]/25 group">
              View Availability
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() =>
                document
                  .querySelector("#venue")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-[1.02]"
            >
              Explore Venue
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
