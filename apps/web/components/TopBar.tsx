"use client";

import { motion } from "framer-motion";
import { CountUp } from "./CountUp";

type TopBarProps = {
  treasuryTotal?: number;
};

export function TopBar({ treasuryTotal = 0 }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[rgba(10,6,18,0.82)] px-5 py-3.5 backdrop-blur-xl md:px-7">
      <div className="flex items-center gap-3">
        <span className="text-[26px] drop-shadow-[0_0_8px_var(--magenta)]" aria-hidden>
          🎡
        </span>
        <span
          className="font-heading text-xl font-extrabold tracking-[3px]"
          style={{
            background:
              "linear-gradient(90deg, var(--magenta), var(--violet), var(--cyan))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          THE MIDWAY
        </span>
      </div>

      <motion.div
        className="gold-glow flex items-center gap-2.5 rounded-full border border-[rgba(245,197,66,0.3)] bg-[rgba(245,197,66,0.08)] px-4 py-1.5 text-[13px]"
        whileHover={{ scale: 1.02 }}
      >
        <span
          className="text-gold"
          style={{ animation: "pulse-dot 1.6s infinite" }}
          aria-hidden
        >
          ◉
        </span>
        <span className="text-[10px] uppercase tracking-[1px] text-dim">
          treasury
        </span>
        <CountUp
          value={treasuryTotal}
          prefix="◎ "
          decimals={2}
          className="num font-bold text-gold"
        />
      </motion.div>
    </header>
  );
}
