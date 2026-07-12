"use client";

import { Rnd } from "react-rnd";
import type { ReactNode } from "react";
import { useOs, type WinId } from "./OsContext";

type WinProps = {
  id: WinId;
  title: string;
  children: ReactNode;
  default: { x: number; y: number; width: number | string; height: number | string };
  minWidth?: number;
  minHeight?: number;
};

export function Win({
  id,
  title,
  children,
  default: def,
  minWidth = 280,
  minHeight = 180,
}: WinProps) {
  const { open, focused, zMap, focusWin, closeWin, calm } = useOs();
  if (!open[id]) return null;

  const isFocused = focused === id;

  return (
    <Rnd
      default={{
        x: def.x,
        y: def.y,
        width: def.width,
        height: def.height,
      }}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds="parent"
      dragHandleClassName="win-titlebar"
      style={{ zIndex: zMap[id] ?? 10 }}
      onDragStart={() => focusWin(id)}
      onMouseDown={() => focusWin(id)}
      enableResizing={!calm}
      className="absolute"
    >
      <div
        className={`flex h-full flex-col bevel hard-shadow ${
          isFocused ? "outline outline-1 outline-ink" : ""
        }`}
        onMouseDown={() => focusWin(id)}
      >
        <div className={`win-titlebar ${isFocused ? "focused" : ""}`}>
          <span className="truncate">{title}</span>
          <div className="win-controls">
            <button type="button" aria-label="Minimize" onClick={() => closeWin(id)}>
              _
            </button>
            <button type="button" aria-label="Maximize" tabIndex={-1}>
              □
            </button>
            <button type="button" aria-label="Close" onClick={() => closeWin(id)}>
              ×
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-panel p-3 text-ink">
          {children}
        </div>
      </div>
    </Rnd>
  );
}
