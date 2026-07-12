"use client";

import type { ColorKey } from "@/lib/colors/engine";
import { COLOR_HEX, COLOR_KEYS } from "@/lib/colors/engine";

type ColorPickerProps = {
  picked: Set<ColorKey>;
  locked: boolean;
  onToggle: (c: ColorKey) => void;
};

export function ColorPicker({ picked, locked, onToggle }: ColorPickerProps) {
  return (
    <div>
      <div className="mb-2 mt-3 text-center font-heading text-[10px] tracking-[0.2em] text-ink-dim">
        SELECT COLORS (UP TO 3)
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {COLOR_KEYS.map((c) => {
          const active = picked.has(c);
          return (
            <button
              key={c}
              type="button"
              disabled={locked}
              onClick={() => onToggle(c)}
              className={`bevel hard-shadow-sm px-1 py-3 text-center font-heading text-[10px] uppercase transition-none disabled:opacity-50 ${
                active ? "bg-acid text-black outline outline-2 outline-offset-1" : ""
              }`}
              style={active ? { outlineColor: "var(--acid)" } : undefined}
            >
              <span
                className="mx-auto mb-2 block size-7 border-2 border-black"
                style={{
                  background: COLOR_HEX[c],
                  boxShadow: "2px 2px 0 #000",
                  imageRendering: "pixelated",
                }}
              />
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
