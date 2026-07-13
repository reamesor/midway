"use client";

import { useEffect, useRef } from "react";

type CursorKind = "default" | "pointer" | "text" | "grab" | "grabbing";

/** Hotspot offsets (px) for the 16px glyph — tip / center aligned to pointer. */
const HOTSPOT: Record<CursorKind, [number, number]> = {
  default: [1, 1],
  pointer: [1, 1],
  text: [5, 7],
  grab: [8, 5],
  grabbing: [8, 5],
};

const POINTER_SEL =
  'a,button,summary,label[for],select,[role="button"],[role="tab"],[role="menuitem"],[role="option"],[role="link"],.cursor-pointer,.desk-icon,.idle-cube,.bevel-btn,.task-tab,.win-controls button';

const TEXT_SEL =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"]),textarea,[contenteditable="true"],[contenteditable=""]';

const GRAB_SEL = ".win-titlebar,.cursor-grab";
const GRABBING_SEL = ".cursor-grabbing";
const SKIP_SEL =
  ':disabled,[aria-disabled="true"],.cursor-not-allowed,.cursor-wait';

function resolveKind(target: Element | null, pressing: boolean): CursorKind | null {
  if (!target) return "default";
  const el = target instanceof Element ? target : null;
  if (!el) return "default";
  if (el.closest(SKIP_SEL)) return null;
  if (pressing && el.closest(`${GRAB_SEL},${GRABBING_SEL}`)) return "grabbing";
  if (el.closest(GRABBING_SEL)) return "grabbing";
  if (el.closest(GRAB_SEL)) return "grab";
  if (el.closest(TEXT_SEL)) return "text";
  if (el.closest(POINTER_SEL)) return "pointer";
  return "default";
}

/**
 * Compact glowing Midway cursor for fine pointers.
 * Skips touch / coarse pointers and prefers-reduced-motion (CSS PNGs stay).
 */
export function MidwayCursor() {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const shell = document.querySelector(".arcade-shell");
    if (!(shell instanceof HTMLElement)) return;

    const node = document.createElement("div");
    node.className = "mw-cursor";
    node.setAttribute("aria-hidden", "true");
    node.dataset.kind = "default";
    node.innerHTML =
      '<span class="mw-cursor-glow"></span><span class="mw-cursor-glyph"></span>';
    document.body.appendChild(node);
    nodeRef.current = node;
    shell.classList.add("mw-cursor-on");

    let x = 0;
    let y = 0;
    let hx = HOTSPOT.default[0];
    let hy = HOTSPOT.default[1];
    let visible = false;
    let pressing = false;
    let kind: CursorKind = "default";
    let raf = 0;
    let dirty = false;

    const paint = () => {
      raf = 0;
      dirty = false;
      node.style.transform = `translate3d(${x - hx}px,${y - hy}px,0)`;
    };

    const schedule = () => {
      if (dirty) return;
      dirty = true;
      raf = requestAnimationFrame(paint);
    };

    const setKind = (next: CursorKind | null) => {
      if (next === null) {
        node.hidden = true;
        return;
      }
      node.hidden = !visible;
      if (next === kind) return;
      kind = next;
      node.dataset.kind = next;
      hx = HOTSPOT[next][0];
      hy = HOTSPOT[next][1];
      schedule();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        node.hidden = false;
      }
      const under = document.elementFromPoint(e.clientX, e.clientY);
      setKind(resolveKind(under, pressing));
      schedule();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      pressing = true;
      const under = document.elementFromPoint(e.clientX, e.clientY);
      setKind(resolveKind(under, pressing));
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      pressing = false;
      const under = document.elementFromPoint(e.clientX, e.clientY);
      setKind(resolveKind(under, pressing));
    };

    const onLeave = () => {
      visible = false;
      node.hidden = true;
    };

    const onEnter = () => {
      visible = true;
      node.hidden = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    node.hidden = true;

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      if (raf) cancelAnimationFrame(raf);
      shell.classList.remove("mw-cursor-on");
      node.remove();
      nodeRef.current = null;
    };
  }, []);

  return null;
}
