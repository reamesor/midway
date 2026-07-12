"use client";

import { motion } from "framer-motion";

const attractions = [
  {
    status: "live" as const,
    icon: "🎨",
    title: "Colors",
    body: "pick 3, roll the dice, feed the treasury. the arcade classic, made honest — the edge comes back to you.",
    feeds: "→ feeds treasury: 5% of every roll",
    href: "#colors",
  },
  {
    status: "soon" as const,
    icon: "🥊",
    title: "Glitch Pits",
    body: "8-bit rumble royale. enter fighters, win the pot. the house rake routes straight into the same loop.",
    feeds: "→ feeds treasury: rake on every rumble",
  },
  {
    status: "soon" as const,
    icon: "🖼️",
    title: "NFT Launchpad",
    body: "mint drops where royalties + mint fees don't vanish — and holders get planned ride multipliers plus an extra cut of claimable believers fees.",
    feeds: "→ feeds treasury: mint fee + resale royalty",
  },
  {
    status: "soon" as const,
    icon: "🪙",
    title: "Token Tools",
    body: "launch or trade tokens through Midway rails. every swap's fee flows back to holders and the build.",
    feeds: "→ feeds treasury: swap + launch fees",
  },
];

export function AttractionsGrid() {
  return (
    <section className="mt-2">
      <SectionHeader
        kick="◆ one treasury · many attractions ◆"
        title="The Midway"
        sub="every game and tool plugs into the same loop — the tech works for all"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {attractions.map((a, i) => (
          <motion.a
            key={a.title}
            href={a.href ?? undefined}
            target={a.href?.startsWith("http") ? "_blank" : undefined}
            rel={a.href?.startsWith("http") ? "noreferrer" : undefined}
            className="glass relative block rounded-2xl p-[22px] transition-colors hover:border-magenta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, duration: 0.45 }}
            whileHover={{ y: -3 }}
          >
            <span
              className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[1px] ${
                a.status === "live"
                  ? "border border-[rgba(60,232,74,0.4)] bg-[rgba(60,232,74,0.15)] text-green"
                  : "border border-line bg-[rgba(157,134,196,0.12)] text-dim"
              }`}
            >
              {a.status === "live" ? "● LIVE" : "SOON"}
            </span>
            <span className="mb-2.5 block text-[34px]">{a.icon}</span>
            <h3 className="font-heading mb-1.5 text-lg text-white">{a.title}</h3>
            <p className="mb-3 text-[13px] text-dim">{a.body}</p>
            <div className="border-t border-line pt-2.5 text-[11px] tracking-wide text-gold">
              {a.feeds}
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({
  kick,
  title,
  sub,
}: {
  kick: string;
  title: string;
  sub: string;
}) {
  return (
    <motion.div
      className="mb-5 mt-14 text-center"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className="text-[11px] uppercase tracking-[3px] text-magenta">
        {kick}
      </div>
      <h2 className="font-heading my-2 text-[30px] font-extrabold text-white">
        {title}
      </h2>
      <p className="text-sm text-dim">{sub}</p>
    </motion.div>
  );
}
