"use client";

import { Rnd } from "react-rnd";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  const [narrow, setNarrow] = useState(false);
  const restoreRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** On phones, snap the window to the parent tile so COLORS isn't a desktop-sized float. */
  useEffect(() => {
    if (!open[id] || !narrow) return;
    const rnd = rndRef.current;
    if (!rnd) return;
    const parent = rnd.getParent();
    if (!parent) return;
    const pad = 4;
    const maxW = Math.max(0, parent.clientWidth - pad * 2);
    const maxH = Math.max(0, parent.clientHeight - pad * 2);
    rnd.updatePosition({
      x: Math.min(toNum(def.x, pad), Math.max(0, maxW - 40)),
      y: Math.min(toNum(def.y, pad), Math.max(0, maxH - 40)),
    });
    rnd.updateSize({
      width: Math.min(Math.max(toNum(def.width, minWidth), Math.min(minWidth, maxW)), maxW),
      height: Math.min(Math.max(toNum(def.height, minHeight), Math.min(minHeight, maxH)), maxH),
    });
  }, [def.height, def.width, def.x, def.y, id, minHeight, minWidth, narrow, open]);

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
      width: Math.max(0, parent.clientWidth - pad * 2),
      height: Math.max(0, parent.clientHeight - pad * 2),
    });
    setMaximized(true);
  }, [def, focusWin, id, maximized, minHeight, minWidth]);

  if (!open[id]) return null;

  const isFocused = focused === id;
  const lockChrome = maximized || calm || narrow;
  const effectiveMinWidth = narrow
    ? Math.min(minWidth, typeof window !== "undefined" ? Math.max(200, window.innerWidth - 16) : minWidth)
    : minWidth;

  return (
    <Rnd
      ref={rndRef}
      default={{
        x: def.x,
        y: def.y,
        width: def.width,
        height: def.height,
      }}
      minWidth={effectiveMinWidth}
      minHeight={minHeight}
      bounds="parent"
      dragHandleClassName="win-titlebar"
      disableDragging={lockChrome}
      style={{ zIndex: zMap[id] ?? 10 }}
      onDragStart={() => focusWin(id)}
      onMouseDown={() => focusWin(id)}
      enableResizing={!lockChrome}
      className="absolute pointer-events-auto"
    >
      <div
        className={`win flex h-full flex-col overflow-hidden bevel hard-shadow ${
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
        <div className="win-body min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-panel text-ink">
          <div className="win-body-inner p-1.5 sm:p-2">{children}</div>
        </div>
      </div>
    </Rnd>
  );
}
