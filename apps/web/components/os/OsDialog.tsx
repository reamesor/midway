"use client";

type OsDialogProps = {
  open: boolean;
  variant: "win" | "jackpot" | "lose";
  title: string;
  body: string;
  detail?: string;
  onRetry?: () => void;
  onClose: () => void;
};

export function OsDialog({
  open,
  variant,
  title,
  body,
  detail,
  onRetry,
  onClose,
}: OsDialogProps) {
  if (!open) return null;

  const chrome =
    variant === "lose"
      ? "border-burn text-burn"
      : variant === "jackpot"
        ? "border-acid text-acid"
        : "border-win text-win";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4">
      <div className={`bevel hard-shadow-lg w-full max-w-sm bg-panel ${chrome}`}>
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
            <button type="button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        <div className="space-y-3 p-4 text-ink">
          <div className="font-heading text-lg chroma">{title}</div>
          <p className="text-base">{body}</p>
          {detail && <p className="num text-sm text-acid">{detail}</p>}
          <div className="flex gap-2 pt-2">
            {variant === "lose" && onRetry && (
              <button type="button" className="bevel-btn bevel-btn-hot flex-1 py-2" onClick={onRetry}>
                RETRY
              </button>
            )}
            <button type="button" className="bevel-btn flex-1 py-2" onClick={onClose}>
              {variant === "lose" ? "CANCEL" : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
