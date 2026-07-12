"use client";

import { Rnd } from "react-rnd";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useOs, type WinId } from "./OsContext";

type WinProps = {
  id: WinId;
  title: string;
  children: ReactNode;
  default: { x: number; y: number; width: number | string; height: number | string };
  minWidth?: number;
  minHeight?: number;
};

function toNum(v: number | string, fallback: number) {
  return typeof v === "number" ? v : fallback;
}

export function Win({
  id,
  title,
  children,
  default: def,
  minWidth = 280,
  minHeight = 180,
}: WinProps) {
  const { open, focused, zMap, focusWin, closeWin, calm } = useOs();
  const rndRef = useRef<Rnd>(null);
  const [maximized, setMaximized] = useState(false);
  const restoreRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );

  const toggleMaximize = useCallback(() => {
    focusWin(id);
    const rnd = rndRef.current;
    if (!rnd) return;
    const parent = rnd.getParent();
    if (!parent) return;

    if (maximized) {
      const prev = restoreRef.current;
      if (prev) {
        rnd.updatePosition({ x: prev.x, y: prev.y });
        rnd.updateSize({ width: prev.width, height: prev.height });
      }
      setMaximized(false);
      return;
    }

    const self = rnd.getSelfElement();
    if (self) {
      restoreRef.current = {
        x: self.offsetLeft,
        y: self.offsetTop,
        width: self.offsetWidth,
        height: self.offsetHeight,
      };
    } else {
      restoreRef.current = {
        x: toNum(def.x, 0),
        y: toNum(def.y, 0),
        width: toNum(def.width, minWidth),
        height: toNum(def.height, minHeight),
      };
    }

    const pad = 4;
    rnd.updatePosition({ x: pad, y: pad });
    rnd.updateSize({
      width: Math.max(minWidth, parent.clientWidth - pad * 2),
      height: Math.max(minHeight, parent.clientHeight - pad * 2),
    });
    setMaximized(true);
  }, [def, focusWin, id, maximized, minHeight, minWidth]);

  if (!open[id]) return null;

  const isFocused = focused === id;

  return (
    <Rnd
      ref={rndRef}
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
      disableDragging={maximized || calm}
      style={{ zIndex: zMap[id] ?? 10 }}
      onDragStart={() => focusWin(id)}
      onMouseDown={() => focusWin(id)}
      enableResizing={!calm && !maximized}
      className="absolute pointer-events-auto"
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
            <button
              type="button"
              aria-label={maximized ? "Restore" : "Maximize"}
              onClick={toggleMaximize}
            >
              {maximized ? "❐" : "□"}
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
