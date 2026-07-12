"use client";

import { useState } from "react";
import { useOs } from "./OsContext";

export function FairnessPanel() {
  const { lastFairness, openWin } = useOs();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (!lastFairness) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/colors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastFairness),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Verify request failed.");
        return;
      }
      setStatus(
        data.valid
          ? "✓ VALID — hash + derived dice match the reveal."
          : "✕ INVALID — seeds do not reproduce these dice.",
      );
    } catch {
      setStatus("Verify failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!lastFairness) {
    return (
      <div className="space-y-3 font-sans text-[13px] normal-case tracking-normal text-ink-dim">
        <p>
          No roll to verify yet. Play a round in{" "}
          <strong className="text-ink">COLORS.EXE</strong>, then reopen this log.
        </p>
        <button
          type="button"
          className="bevel-btn bevel-btn-hot px-3 py-2 font-heading text-[11px] tracking-wide"
          onClick={() => openWin("colors")}
        >
          OPEN COLORS.EXE
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-heading text-xs">
      <div className="text-ink-dim">LAST ROLL · COMMIT / REVEAL</div>
      <div className="bevel-inset space-y-1 break-all p-3 font-mono text-[12px] text-ink-dim">
        <div>
          <span className="text-cyber">hash</span> {lastFairness.serverSeedHash}
        </div>
        <div>
          <span className="text-cyber">server</span> {lastFairness.serverSeed}
        </div>
        <div>
          <span className="text-cyber">client</span> {lastFairness.clientSeed}
        </div>
        <div>
          <span className="text-cyber">nonce</span> {lastFairness.nonce}
        </div>
        <div>
          <span className="text-cyber">dice</span> {lastFairness.dice.join(", ")}
        </div>
      </div>
      <button
        type="button"
        className="bevel-btn bevel-btn-acid w-full py-3 text-sm"
        disabled={busy}
        onClick={() => void verify()}
      >
        {busy ? "VERIFYING…" : "▶ VERIFY THIS ROLL"}
      </button>
      {status && (
        <p
          className={`font-sans text-[13px] normal-case tracking-normal ${
            status.startsWith("✓") ? "text-win" : status.startsWith("✕") ? "text-burn" : "text-cyber"
          }`}
          role="status"
        >
          {status}
        </p>
      )}
      <p className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        Verification re-hashes the server seed and re-derives dice from
        server:client:nonce. If they match, the roll was fair.
      </p>
    </div>
  );
}
