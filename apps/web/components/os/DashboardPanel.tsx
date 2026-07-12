"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useOs } from "@/components/os/OsContext";
import { WalletConnectControl } from "@/components/wallet/WalletConnectControl";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { truncateAddress } from "@/lib/solana/address";
import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";
import {
  USERNAME_MAX,
  USERNAME_MIN,
} from "@/lib/profile/localProfile";

export function DashboardPanel() {
  const { openWin } = useOs();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    connected,
    demoGuest,
    pubkey,
    play,
    username,
    stats,
    setUsername,
  } = usePlayerProfile();

  const [draft, setDraft] = useState(username ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(username ?? "");
  }, [username, pubkey]);

  const identityLabel = (() => {
    if (publicKey) return truncateAddress(publicKey.toBase58(), 6, 6);
    if (demoGuest) return "DEMO · GUEST";
    return "Not connected";
  })();

  const onSave = () => {
    setError(null);
    setStatus(null);
    const res = setUsername(draft);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setStatus("Username saved.");
  };

  return (
    <div className="font-heading text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2">
        <div>
          <div className="chroma text-sm text-hot">DASHBOARD.EXE</div>
          <div className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
            Profile · local demo stats
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="bevel-inset px-2 py-1 text-[10px] text-acid">DEMO</span>
          <WalletConnectControl size="panel" />
        </div>
      </div>

      <div className="bevel-inset border border-acid/40 bg-acid/10 px-3 py-2 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        <strong className="font-heading text-[10px] tracking-wide text-acid">
          LOCAL ONLY
        </strong>
        {" — "}
        Username and scores stay in this browser until a live board ships.
      </div>

      {!connected && (
        <div className="bevel-inset p-3 font-sans text-[13px] normal-case tracking-normal text-ink-dim">
          Connect a wallet or play as demo guest to edit your username and track
          Colors stats.
          <button
            type="button"
            className="bevel-btn bevel-btn-hot mt-2 block w-full py-2 font-heading text-[11px] tracking-wide"
            onClick={() => setVisible(true)}
          >
            CONNECT / DEMO
          </button>
        </div>
      )}

      {connected && (
        <>
          <section className="bevel-inset p-3 space-y-2">
            <div className="font-heading text-[10px] tracking-wide text-ink-dim">
              IDENTITY
            </div>
            <div className="font-mono text-[12px] text-ink break-all">
              {identityLabel}
            </div>
            {pubkey && pubkey !== "DEMO_GUEST" && publicKey && (
              <div className="font-mono text-[10px] text-ink-dim break-all">
                {publicKey.toBase58()}
              </div>
            )}
          </section>

          <section className="bevel-inset p-3 space-y-2">
            <div className="font-heading text-[10px] tracking-wide text-ink-dim">
              USERNAME
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={draft}
                maxLength={USERNAME_MAX}
                placeholder="e.g. TentFox"
                className="bevel-inset min-w-[140px] flex-1 bg-panel px-2 py-1.5 font-mono text-[13px] text-ink outline-none"
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                  setStatus(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSave();
                }}
                aria-label="Username"
              />
              <button
                type="button"
                className="bevel-btn bevel-btn-hot px-3 py-1.5"
                onClick={onSave}
              >
                SAVE
              </button>
            </div>
            <p className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
              {USERNAME_MIN}–{USERNAME_MAX} chars · letters, numbers, _ -
            </p>
            {error && (
              <p className="font-sans text-[12px] normal-case text-burn">{error}</p>
            )}
            {status && (
              <p className="font-sans text-[12px] normal-case text-acid">{status}</p>
            )}
          </section>

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="PLAY SOL" value={play.sol.toFixed(2)} />
            <Stat label="ROUNDS" value={String(stats?.rounds ?? 0)} />
            <Stat label="WINS" value={String(stats?.wins ?? 0)} />
            <Stat
              label="SOL WON"
              value={(stats?.solWon ?? 0).toFixed(2)}
            />
          </section>

          <p className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
            Demo pot cap {DEMO_PLAY_SOL} SOL · wins = rounds with ≥1 color hit.
          </p>
        </>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="bevel-btn px-3 py-2"
          onClick={() => openWin("leaderboard")}
        >
          ▶ LEADERBOARD
        </button>
        <button
          type="button"
          className="bevel-btn px-3 py-2"
          onClick={() => openWin("colors")}
        >
          ▶ COLORS.EXE
        </button>
        <button
          type="button"
          className="bevel-btn px-3 py-2"
          onClick={() => openWin("wallet")}
        >
          ▶ WALLET
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bevel-inset px-2 py-2 text-center">
      <div className="font-heading text-[9px] tracking-wide text-ink-dim">{label}</div>
      <div className="num mt-0.5 text-sm text-ink">{value}</div>
    </div>
  );
}
