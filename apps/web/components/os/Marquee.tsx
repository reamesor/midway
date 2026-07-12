"use client";

type MarqueeProps = {
  items: string[];
};

export function Marquee({ items }: MarqueeProps) {
  const line = items.join("   ·   ");
  const doubled = `${line}   ·   ${line}   ·   `;
  return (
    <div className="marquee-wrap flex-1 text-[13px] text-acid">
      <div className="marquee-track num">
        <span>{doubled}</span>
        <span>{doubled}</span>
      </div>
    </div>
  );
}
