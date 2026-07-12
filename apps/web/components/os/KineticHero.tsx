"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function KineticHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 40]);
  const ghostX = useTransform(scrollY, [0, 400], [0, -30]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-x-0 top-6 z-[2] flex flex-col items-center px-4 text-center md:top-10"
    >
      <motion.div style={{ x: ghostX }} className="relative">
        <span
          aria-hidden
          className="font-display absolute inset-0 -z-10 translate-x-4 text-[clamp(4rem,18vw,9rem)] leading-none text-hot/15"
        >
          祭
        </span>
        <motion.h1
          style={{ y }}
          className="font-display chroma text-[clamp(2.5rem,12vw,6rem)] leading-[0.9] text-ink"
        >
          MIDWAY
        </motion.h1>
      </motion.div>
      <p className="font-heading mt-2 text-sm tracking-[0.25em] text-acid blink">
        EVERY CUT COMES HOME
      </p>
      <p className="mt-2 max-w-md text-sm text-ink-dim">
        haunted 8-bit boardwalk · bootleg OS · the house cut comes home
      </p>
    </div>
  );
}
