"use client";

import { motion, AnimatePresence } from "framer-motion";
import { splitCut } from "@/lib/colors/engine";

type ResultBannerProps = {
  show: boolean;
  matches: number;
  winnings: number;
  stake: number;
  houseCut: number;
  unit: string;
};

export function ResultBanner({
  show,
  matches,
  winnings,
  stake,
  houseCut,
  unit = "SOL",
}: ResultBannerProps) {
  const parts = splitCut(houseCut);
  const kind =
    matches === 3 ? "jackpot" : matches > 0 ? "win" : "lose";

  const styles = {
    win: "border-green bg-[rgba(60,232,74,0.1)]",
    jackpot: "border-gold bg-[rgba(245,197,66,0.12)]",
    lose: "border-[rgba(232,59,80,0.4)] bg-[rgba(232,59,80,0.08)]",
  }[kind];

  const titleColor = {
    win: "text-green",
    jackpot: "text-gold neon-text",
    lose: "text-red",
  }[kind];

  const title =
    matches === 3
      ? "★ JACKPOT · 3 MATCHES!"
      : matches > 0
        ? `★ WIN · ${matches} MATCH${matches > 1 ? "ES" : ""}`
        : "✕ NO MATCH";

  const detail =
    matches > 0
      ? `+${fmt(winnings)} ${unit}${matches === 3 ? " · all three dice came home" : " returned"}`
      : `−${fmt(stake)} ${unit} this round`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`mt-4 rounded-xl border p-4 text-center ${styles}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className={`mb-1 text-[22px] font-extrabold ${titleColor}`}>
            {title}
          </div>
          <div className="text-[13px] text-dim">{detail}</div>
          <div className="mt-2 text-xs text-gold">
            ◎ +{fmt(houseCut)} {unit} → treasury · burn {fmt(parts.burn)} · believers{" "}
            {fmt(parts.believers)} · build {fmt(parts.build)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
