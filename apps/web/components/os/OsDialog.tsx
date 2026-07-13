"use client";

import { useEffect, type ReactNode } from "react";

type OsDialogProps = {
  open: boolean;
  variant: "win" | "jackpot" | "lose";
  title: string;
  body: ReactNode;
  detail?: ReactNode;
  shareHref?: string;
  onRetry?: () => void;
  onClose: () => void;
};

export function OsDialog({
  open,
  variant,
  title,
  body,
  detail,
  shareHref,
  onRetry,
  onClose,
}: OsDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const chrome =
    variant === "lose"
      ? "border-burn text-burn"
      : variant === "jackpot"
        ? "border-acid text-acid"
        : "border-win text-win";

  const retryLabel = variant === "lose" ? "RETRY" : "PLAY AGAIN";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="os-dialog-title"
        className={`bevel hard-shadow-lg max-h-[min(90dvh,720px)] w-full max-w-md overflow-y-auto bg-panel ${chrome}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`win-titlebar ${
            variant === "lose" ? "" : "focused"
          }`}
          style={
            variant === "lose"
              ? { background: "linear-gradient(90deg, var(--burn), #4a0000)" }
              : variant === "jackpot"
                ? { background: "linear-gradient(90deg, var(--acid), #5a6a00)", color: "#000" }
                : { background: "linear-gradient(90deg, var(--win), #0a4a00)", color: "#000" }
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
        <div className="space-y-3 p-3 text-ink sm:p-4">
          <div id="os-dialog-title" className="chroma font-heading text-base leading-snug sm:text-lg">
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
    </div>
  );
}
