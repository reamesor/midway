"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { WalletConnectControl } from "./WalletConnectControl";
import { useSolBalance } from "@/hooks/useSolBalance";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import { useOs } from "@/components/os/OsContext";
import { truncateAddress } from "@/lib/solana/address";
import { getSolanaNetworkLabel } from "@/lib/solana/cluster";
import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";
import type { MidwayAsset } from "@/lib/midway-wallet/types";
import { DEMO_GUEST_PUBKEY } from "@/components/wallet/DemoGuestContext";

const PRESETS = [0.05, 0.1, 0.25, 0.5, 1] as const;

export function MidwayWalletPanel() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { openWin } = useOs();
  const { balance: mainSol, loading: mainLoading, refresh: refreshMain } =
    useSolBalance();
  const {
    connected,
    walletConnected,
    demoGuest,
    mode,
    play,
    midwayPlayBalance,
    midwayWalletAddress,
    mainWalletPubkey,
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
  const [copied, setCopied] = useState<"main" | "midway" | null>(null);

  const mainAddress =
    publicKey?.toBase58() ??
    (mainWalletPubkey && mainWalletPubkey !== DEMO_GUEST_PUBKEY
      ? mainWalletPubkey
      : null);

  const copyAddr = async (kind: "main" | "midway", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setStatus("Copy failed — select the address manually.");
    }
  };

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
        ? `DEMO deposit +${fmt(amount)} ${asset} → Midway wallet (no real funds moved).`
        : `DEMO withdraw −${fmt(amount)} ${asset} → main wallet (no real funds moved).`,
    );
  };

  const onReset = () => {
    setStatus(null);
    const res = resetDemo();
    if (!res.ok) {
      setStatus(res.error);
      return;
    }
    setStatus(
      `Midway wallet DEMO reset to ${DEMO_PLAY_SOL} SOL. No real funds moved.`,
    );
  };

  const playSol = midwayPlayBalance?.sol ?? play.sol;

  return (
    <div className="font-heading text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2">
        <div>
          <div className="chroma text-sm text-hot">WALLET.EXE</div>
          <div className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
            Midway wallet · play funds + main wallet
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
          DEMO · PLAY FUNDS ARE NOT REAL SOL YET
        </strong>
        <p className="mt-1 text-ink-dim">
          Your <strong className="text-ink">Midway wallet</strong> holds the play
          balance used for Colors bets. Deposit / Withdraw simulate Main ↔ Midway
          transfers in this browser. Main wallet SOL is read live from RPC when
          connected — nothing is signed or sent on-chain for play.
        </p>
      </div>

      {!connected && (
        <div className="bevel-inset p-3 font-sans text-[13px] normal-case tracking-normal text-ink-dim">
          Connect <strong className="text-ink">Phantom</strong> or{" "}
          <strong className="text-ink">Solflare</strong> to create your Midway
          wallet + username path — or choose{" "}
          <strong className="text-ink">Play demo without wallet</strong> for an
          ephemeral Midway wallet.
          <button
            type="button"
            className="bevel-btn bevel-btn-hot mt-2 block w-full py-2 font-heading text-[11px] tracking-wide"
            onClick={() => setVisible(true)}
          >
            CONNECT MAIN WALLET
          </button>
        </div>
      )}

      {connected && (
        <>
          <section className="grid gap-2 sm:grid-cols-2">
            <WalletCard
              title="MAIN WALLET"
              subtitle="connected · external"
              address={mainAddress}
              balanceLabel="SOL on-chain"
              balance={
                !walletConnected
                  ? "—"
                  : mainLoading
                    ? "…"
                    : mainSol == null
                      ? "—"
                      : fmt(mainSol)
              }
              hint={
                walletConnected
                  ? "read-only via RPC"
                  : demoGuest
                    ? "guest — connect to withdraw"
                    : "not connected"
              }
              onCopy={
                mainAddress
                  ? () => void copyAddr("main", mainAddress)
                  : undefined
              }
              copied={copied === "main"}
            />
            <WalletCard
              title="MIDWAY WALLET"
              subtitle="play purse · DEMO"
              address={midwayWalletAddress}
              balanceLabel="play balance"
              balance={fmt(playSol)}
              hint={`seeded ${DEMO_PLAY_SOL} SOL · local ledger`}
              accent
              onCopy={
                midwayWalletAddress
                  ? () => void copyAddr("midway", midwayWalletAddress)
                  : undefined
              }
              copied={copied === "midway"}
            />
          </section>

          {midwayTokenReady && (
            <div className="bevel-inset px-3 py-2 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
              MIDWAY token play:{" "}
              <span className="num text-ink">{fmt(play.midway)}</span>
            </div>
          )}

          <div className="bevel p-3 space-y-2">
            <div className="text-ink-dim">DEPOSIT / WITHDRAW · DEMO</div>
            <p className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
              Deposit moves play funds into Midway · Withdraw sends play funds back
              toward your main wallet (simulated).
            </p>
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
                title={
                  midwayTokenReady ? "MIDWAY token" : "Set NEXT_PUBLIC_MIDWAY_MINT"
                }
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
                  setAmount(
                    asset === "SOL" ? roundAmt(playSol) : roundAmt(play.midway),
                  )
                }
              >
                MAX MIDWAY
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                className="bevel-btn bevel-btn-hot py-3"
                disabled={
                  !connected || busy || (asset === "MIDWAY" && !midwayTokenReady)
                }
                onClick={() => void run("deposit")}
                title="Main → Midway (DEMO)"
              >
                DEPOSIT
              </button>
              <button
                type="button"
                className="bevel-btn py-3"
                disabled={
                  !connected ||
                  busy ||
                  !walletConnected ||
                  (asset === "MIDWAY" && !midwayTokenReady)
                }
                onClick={() => void run("withdraw")}
                title={
                  walletConnected
                    ? "Midway → Main (DEMO)"
                    : "Connect main wallet to withdraw"
                }
              >
                WITHDRAW
              </button>
            </div>
            <button
              type="button"
              className="bevel-btn bevel-btn-acid w-full py-2"
              disabled={!connected || busy}
              onClick={onReset}
            >
              RESET MIDWAY TO {DEMO_PLAY_SOL} SOL
            </button>
          </div>
        </>
      )}

      {status && (
        <p className="font-sans text-[13px] normal-case tracking-normal text-cyber">
          {status}
        </p>
      )}

      <p className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        Midway wallet address is a generated Solana pubkey (identity only). Play
        balance is local to this browser. LIVE custody / on-chain transfers are
        not enabled. Open PROFILE.EXE for username + linked main wallets.
      </p>

      <div className="flex gap-1">
        <button type="button" className="bevel-btn px-2 py-1" onClick={() => refresh()}>
          REFRESH MIDWAY
        </button>
        <button
          type="button"
          className="bevel-btn px-2 py-1"
          onClick={() => void refreshMain()}
        >
          REFRESH MAIN
        </button>
        <button
          type="button"
          className="bevel-btn px-2 py-1"
          onClick={() => openWin("dashboard")}
        >
          PROFILE
        </button>
      </div>

      {ledger.length > 0 && (
        <details className="bevel-inset p-2">
          <summary className="cursor-pointer text-cyber">
            recent Midway ledger
          </summary>
          <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-[11px] text-ink-dim">
            {ledger.slice(0, 12).map((e) => (
              <li key={e.id}>
                {e.kind} · {e.asset} · {fmt(e.amount)}
                {e.note ? ` · ${e.note}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function WalletCard({
  title,
  subtitle,
  address,
  balanceLabel,
  balance,
  hint,
  accent,
  onCopy,
  copied,
}: {
  title: string;
  subtitle: string;
  address: string | null;
  balanceLabel: string;
  balance: string;
  hint: string;
  accent?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div
      className={`bevel-inset space-y-2 p-3 ${accent ? "border border-acid/50" : ""}`}
    >
      <div>
        <div
          className={`font-heading text-[10px] tracking-wide ${accent ? "text-acid" : "text-ink-dim"}`}
        >
          {title}
        </div>
        <div className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
          {subtitle}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-ink-dim">{balanceLabel}</div>
        <div className={`num text-xl ${accent ? "text-acid" : "text-ink"}`}>
          {balance}
        </div>
        <div className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
          {hint}
        </div>
      </div>
      {address ? (
        <div className="space-y-1">
          <div className="break-all font-mono text-[10px] text-ink-dim">
            {truncateAddress(address, 8, 8)}
          </div>
          {onCopy && (
            <button
              type="button"
              className="bevel-btn px-2 py-1 text-[10px]"
              onClick={onCopy}
            >
              {copied ? "COPIED" : "COPY ADDRESS"}
            </button>
          )}
        </div>
      ) : (
        <div className="font-mono text-[10px] text-ink-dim">—</div>
      )}
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
