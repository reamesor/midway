"use client";

import { Rnd } from "react-rnd";
import {
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type OsDialogProps = {
  open: boolean;
  variant: "win" | "jackpot" | "lose";
  title: string;
  body: ReactNode;
  detail?: ReactNode;
  shareHref?: string;
  /** Brief JACKPOT.EXE entrance flourish (non-blocking). */
  celebrate?: boolean;
  onRetry?: () => void;
  onClose: () => void;
};

const MAX_WIDTH = 448; // max-w-md
/** Leave room for the Colors ResultBanner above the cubes. */
const TOP_RESERVE = 120;
/**
 * Distinct from Win's `.win-titlebar`. Portal events still bubble through the
 * React tree into COLORS' react-rnd; that library matches handles by class on
 * the event target without requiring the node to live inside the window DOM.
 */
const DRAG_HANDLE = "os-dialog-titlebar";

function dialogWidth() {
  return Math.min(MAX_WIDTH, Math.max(260, window.innerWidth - 24));
}

function clampPos(x: number, y: number, width: number, height: number) {
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxX = Math.max(pad, vw - width - pad);
  const maxY = Math.max(pad, vh - Math.min(height, vh - pad * 2));
  return {
    x: Math.min(Math.max(pad, x), maxX),
    y: Math.min(Math.max(pad, y), maxY),
  };
}

function defaultPosition(width: number, height: number) {
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 640;

  const x = narrow
    ? Math.max(pad, (vw - width) / 2)
    : Math.max(pad, vw - width - pad);

  // Prefer lower placement so the stage banner stays visible; clamp into viewport.
  const yPreferred = narrow
    ? vh - height - pad
    : Math.max(TOP_RESERVE, vh - height - pad);

  return clampPos(x, yPreferred, width, height);
}

export function OsDialog({
  open,
  variant,
  title,
  body,
  detail,
  shareHref,
  celebrate = false,
  onRetry,
  onClose,
}: OsDialogProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [width, setWidth] = useState(MAX_WIDTH);
  const [placed, setPlaced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open) {
      setPlaced(false);
      return;
    }

    const w = dialogWidth();
    setWidth(w);
    // First paint estimate; refined after the dialog measures itself.
    setPos(defaultPosition(w, Math.min(480, window.innerHeight * 0.7)));
    setPlaced(true);

    let didPlace = false;
    const measure = (reanchor: boolean) => {
      const node = document.getElementById("os-dialog-window");
      if (!node) return;
      const nextW = dialogWidth();
      setWidth(nextW);
      const h = node.offsetHeight;
      if (reanchor || !didPlace) {
        setPos(defaultPosition(nextW, h));
        didPlace = true;
        return;
      }
      setPos((prev) => clampPos(prev.x, prev.y, nextW, h));
    };

    const raf = requestAnimationFrame(() => measure(true));
    const onResize = () => measure(false);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  if (!open || !mounted) return null;

  const chrome =
    variant === "lose"
      ? "border-burn text-burn"
      : variant === "jackpot"
        ? "border-acid text-acid"
        : "border-win text-win";

  const retryLabel = variant === "lose" ? "RETRY" : "PLAY AGAIN";

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="presentation">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden
        onClick={onClose}
      />
      {placed && (
        <Rnd
          position={pos}
          size={{ width, height: "auto" }}
          onDrag={(_e, d) => setPos({ x: d.x, y: d.y })}
          onDragStop={(_e, d) => setPos({ x: d.x, y: d.y })}
          bounds="window"
          dragHandleClassName={DRAG_HANDLE}
          cancel=".win-controls, .win-controls *, a, button"
          enableResizing={false}
          className="pointer-events-auto"
          style={{ zIndex: 1 }}
          /* After this Rnd accepts the start, stop React portal bubbling into COLORS. */
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            id="os-dialog-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="os-dialog-title"
            className={`bevel hard-shadow-lg flex max-h-[min(90dvh,720px)] w-full flex-col overflow-hidden bg-panel ${chrome}${
              variant === "jackpot" && celebrate ? " os-dialog--jackpot-fx" : ""
            }${variant === "jackpot" ? " os-dialog--jackpot" : ""}`}
          >
            <div
              className={`${DRAG_HANDLE} ${variant === "lose" ? "" : "focused"}${
                variant === "jackpot" && celebrate
                  ? " os-dialog-titlebar--jackpot-fx"
                  : ""
              }`}
              style={
                variant === "lose"
                  ? { background: "linear-gradient(90deg, var(--burn), #4a0000)" }
                  : variant === "jackpot"
                    ? {
                        background: "linear-gradient(90deg, var(--gold), #8a6420 55%, #5a6a00)",
                        color: "#121a14",
                      }
                    : {
                        background: "linear-gradient(90deg, var(--win), #0a4a00)",
                        color: "#000",
                      }
              }
            >
              <span>
                {variant === "lose"
                  ? "ERROR.EXE"
                  : variant === "jackpot"
                    ? "JACKPOT.EXE"
                    : "WIN.EXE"}
              </span>
              <div className="win-controls">
                <button type="button" aria-label="Close" onClick={onClose}>
                  ×
                </button>
              </div>
            </div>
            <div className="win-body min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 text-ink sm:p-4">
              <div
                id="os-dialog-title"
                className="chroma font-heading text-base leading-snug sm:text-lg"
              >
                {title}
              </div>
              <div className="text-sm sm:text-base">{body}</div>
              {detail && <div className="num text-sm text-acid">{detail}</div>}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                {onRetry && (
                  <button
                    type="button"
                    className={`bevel-btn min-h-11 flex-1 py-3 ${
                      variant === "lose" ? "bevel-btn-hot" : "bevel-btn-acid"
                    }`}
                    onClick={onRetry}
                  >
                    {retryLabel}
                  </button>
                )}
                {shareHref && variant !== "lose" && (
                  <a
                    href={shareHref}
                    target="_blank"
                    rel="noreferrer"
                    className="bevel-btn min-h-11 flex-1 py-3 text-center text-cyber"
                  >
                    SHARE → X
                  </a>
                )}
                <button
                  type="button"
                  className="bevel-btn min-h-11 flex-1 py-3"
                  onClick={onClose}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </Rnd>
      )}
    </div>,
    document.body,
  );
}
