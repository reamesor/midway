"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <motion.section
      className="px-1 pb-3 pt-8 text-center"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="mb-4 inline-block rounded-full border border-[rgba(56,214,232,0.3)] px-4 py-1.5 text-xs uppercase tracking-[4px] text-cyan">
        ◆ one ecosystem · every cut comes home ◆
      </span>
      <h1 className="font-heading mb-3 text-[clamp(2.2rem,6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-1px] text-white">
        play. mint. trade.
        <br />
        <span
          className="neon-text"
          style={{
            background: "linear-gradient(90deg, var(--magenta), var(--violet))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          the house cut comes back.
        </span>
      </h1>
      <p className="mx-auto max-w-[640px] text-[17px] text-dim">
        everywhere else, the house keeps the edge and you get nothing. on{" "}
        <b className="text-txt">The Midway</b>, every game you play, every token
        you trade, every NFT you mint feeds{" "}
        <b className="text-txt">one shared treasury</b> — that burns the supply,
        pays the believers, and funds the build.{" "}
        <b className="text-txt">believing pays. on-chain and honest.</b>
      </p>
    </motion.section>
  );
}
