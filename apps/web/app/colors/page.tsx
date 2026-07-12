"use client";

import { ColorsGame } from "@/components/colors/ColorsGame";
import { useState } from "react";

export default function ColorsPage() {
  const [, setCut] = useState(0);
  return (
    <main className="desktop-wallpaper relative min-h-screen p-4 pb-16">
      <div className="bevel hard-shadow mx-auto max-w-[1000px] bg-panel p-4">
        <div className="win-titlebar focused mb-3">
          <span>COLORS.EXE — FULLSCREEN</span>
        </div>
        <ColorsGame onHouseCut={(c) => setCut((x) => x + c)} />
      </div>
    </main>
  );
}
