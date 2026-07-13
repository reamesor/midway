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
    <div className="min-w-0">
      <div className="mb-1 mt-2 text-center font-heading text-[10px] tracking-[0.2em] text-ink-dim md:mt-1.5">
        SELECT COLORS (UP TO 3)
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-1.5">
        {COLOR_KEYS.map((c) => {
          const active = picked.has(c);
          return (
            <button
              key={c}
              type="button"
              disabled={locked}
              onClick={() => onToggle(c)}
              aria-pressed={active}
              className={`bevel hard-shadow-sm flex min-h-11 flex-col items-center justify-center px-1 py-1.5 text-center font-heading text-[10px] uppercase transition-none disabled:opacity-50 md:min-h-0 md:py-1 ${
                active ? "bg-acid text-black outline outline-2 outline-offset-1" : ""
              }`}
              style={active ? { outlineColor: "var(--acid)" } : undefined}
            >
              <span
                className="colors-swatch-cube mx-auto mb-1 block"
                style={{ ["--swatch" as string]: COLOR_HEX[c] }}
                aria-hidden
              />
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
