"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { WalletConnectControl } from "./WalletConnectControl";
import { useSolBalance } from "@/hooks/useSolBalance";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import { truncateAddress } from "@/lib/solana/address";
import { getSolanaNetworkLabel } from "@/lib/solana/cluster";
import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";
import type { MidwayAsset } from "@/lib/midway-wallet/types";

const PRESETS = [0.05, 0.1, 0.25, 0.5, 1] as const;

export function MidwayWalletPanel() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { balance: mainSol, loading: mainLoading, refresh: refreshMain } =
    useSolBalance();
  const {
    mode,
    play,
    ledger,
    busy,
    midwayTokenReady,
    deposit,
    withdraw,
    resetDemo,
    refresh,
  } = useMidwayWallet();

  const [asset, setAsset] = useState<MidwayAsset>("SOL");
  const [amount, setAmount] = useState(0.1);
  const [status, setStatus] = useState<string | null>(null);

  const run = async (kind: "deposit" | "withdraw") => {
    setStatus(null);
    const res =
      kind === "deposit" ? await deposit(asset, amount) : await withdraw(asset, amount);
    if (!res.ok) {
      setStatus(res.error);
      return;
    }
    setStatus(
      kind === "deposit"
        ? `Demo ledger +${fmt(amount)} ${asset} (no real funds moved).`
        : `Demo ledger −${fmt(amount)} ${asset} (no real funds moved).`,
    );
  };

  const onReset = () => {
    setStatus(null);
    const res = resetDemo();
    if (!res.ok) {
      setStatus(res.error);
      return;
    }
    setStatus(`Demo pot reset to ${DEMO_PLAY_SOL} SOL. No real funds moved.`);
  };

  return (
    <div className="font-heading text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2">
        <div>
          <div className="chroma text-sm text-hot">EXCHANGE.EXE</div>
          <div className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
            MIDWAY.WALLET — demo play pot
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="bevel-inset px-2 py-1 text-[10px] text-acid">{mode}</span>
          <span className="bevel-inset px-2 py-1 text-[10px] text-ink-dim">
            {getSolanaNetworkLabel()}
          </span>
          <WalletConnectControl size="panel" />
        </div>
      </div>

      <div className="bevel-inset border-2 border-acid/40 bg-acid/10 p-3 font-sans text-[13px] normal-case tracking-normal text-ink">
        <strong className="font-heading text-[11px] tracking-wide text-acid">
          DEMO · NO REAL FUNDS MOVE
        </strong>
        <p className="mt-1 text-ink-dim">
          Play balance is a fixed <strong className="text-ink">{DEMO_PLAY_SOL} SOL</strong>{" "}
          demo pot. Deposits / withdraws only change local ledger numbers. Phantom /
          Solflare is for identity and address display only.
        </p>
      </div>

      {!connected && (
        <div className="bevel-inset p-3 font-sans text-[13px] normal-case tracking-normal text-ink-dim">
          Connect <strong className="text-ink">Phantom</strong> or{" "}
          <strong className="text-ink">Solflare</strong> to unlock your{" "}
          {DEMO_PLAY_SOL} SOL demo play pot for Colors.
          <button
            type="button"
            className="bevel-btn bevel-btn-hot mt-2 block w-full py-2 font-heading text-[11px] tracking-wide"
            onClick={() => setVisible(true)}
          >
            CONNECT WALLET
          </button>
        </div>
      )}

      {connected && publicKey && (
        <div className="bevel-inset p-2 font-mono text-[12px] text-ink-dim break-all">
          identity · {truncateAddress(publicKey.toBase58(), 6, 6)}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <BalanceCard
          label="MAIN SOL"
          value={mainLoading ? "…" : mainSol == null ? "—" : fmt(mainSol)}
          hint="on-chain · read-only"
        />
        <BalanceCard
          label="MIDWAY PLAY · DEMO"
          value={fmt(play.sol)}
          hint={`${DEMO_PLAY_SOL} SOL pot · local`}
          accent
        />
        <BalanceCard
          label="MIDWAY TOKEN"
          value={midwayTokenReady ? fmt(play.midway) : "—"}
          hint={midwayTokenReady ? "demo play token" : "mint not set"}
        />
      </div>

      <div className="bevel p-3 space-y-2">
        <div className="text-ink-dim">DEMO AMOUNT</div>
        <div className="flex gap-1">
          <button
            type="button"
            className={`bevel-btn flex-1 py-1 ${asset === "SOL" ? "bevel-btn-acid" : ""}`}
            onClick={() => setAsset("SOL")}
          >
            SOL
          </button>
          <button
            type="button"
            className={`bevel-btn flex-1 py-1 ${asset === "MIDWAY" ? "bevel-btn-acid" : ""}`}
            disabled={!midwayTokenReady}
            title={midwayTokenReady ? "MIDWAY token" : "Set NEXT_PUBLIC_MIDWAY_MINT"}
            onClick={() => setAsset("MIDWAY")}
          >
            MIDWAY{midwayTokenReady ? "" : " · SOON"}
          </button>
        </div>
        <input
          className="num bevel-inset h-10 w-full bg-[var(--void)] px-2 text-center text-lg text-ink outline-none"
          type="number"
          min={0.001}
          step={0.01}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
        />
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              className="bevel-btn px-2 py-1"
              onClick={() => setAmount(v)}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            className="bevel-btn px-2 py-1"
            onClick={() =>
              setAmount(asset === "SOL" ? roundAmt(play.sol) : roundAmt(play.midway))
            }
          >
            MAX PLAY
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            className="bevel-btn bevel-btn-hot py-3"
            disabled={!connected || busy || (asset === "MIDWAY" && !midwayTokenReady)}
            onClick={() => void run("deposit")}
          >
            DEMO + {asset}
          </button>
          <button
            type="button"
            className="bevel-btn py-3"
            disabled={!connected || busy || (asset === "MIDWAY" && !midwayTokenReady)}
            onClick={() => void run("withdraw")}
          >
            DEMO − {asset}
          </button>
        </div>
        <button
          type="button"
          className="bevel-btn bevel-btn-acid w-full py-2"
          disabled={!connected || busy}
          onClick={onReset}
        >
          RESET DEMO TO {DEMO_PLAY_SOL} SOL
        </button>
      </div>

      {status && (
        <p className="font-sans text-[13px] normal-case tracking-normal text-cyber">
          {status}
        </p>
      )}

      <p className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        DEMO escrow is local to this browser + wallet pubkey. No real SOL leaves your
        main wallet. LIVE vault transfers are disabled.
      </p>

      <div className="flex gap-1">
        <button type="button" className="bevel-btn px-2 py-1" onClick={() => refresh()}>
          REFRESH PLAY
        </button>
        <button
          type="button"
          className="bevel-btn px-2 py-1"
          onClick={() => void refreshMain()}
        >
          REFRESH MAIN
        </button>
      </div>

      {ledger.length > 0 && (
        <details className="bevel-inset p-2">
          <summary className="cursor-pointer text-cyber">recent demo ledger</summary>
          <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[11px] text-ink-dim">
            {ledger.slice(0, 12).map((e) => (
              <li key={e.id}>
                {e.kind} · {e.asset} · {fmt(e.amount)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function BalanceCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="bevel-inset p-3">
      <div className="text-[10px] text-ink-dim">{label}</div>
      <div className={`num text-xl ${accent ? "text-acid" : "text-ink"}`}>{value}</div>
      <div className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
        {hint}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function roundAmt(n: number) {
  return Math.round(Math.max(0, n) * 1e4) / 1e4;
}
