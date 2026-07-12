"use client";

import { useEffect, useState } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useOs } from "@/components/os/OsContext";
import { WalletConnectControl } from "@/components/wallet/WalletConnectControl";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useSolBalance } from "@/hooks/useSolBalance";
import { truncateAddress } from "@/lib/solana/address";
import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";
import {
  USERNAME_MAX,
  USERNAME_MIN,
} from "@/lib/profile/localProfile";
import { DEMO_GUEST_PUBKEY } from "@/components/wallet/DemoGuestContext";
import type { MidwayWalletLedgerEntry } from "@/lib/midway-wallet/types";
import type { WalletSlot } from "@/lib/profile/walletHub";
import { AvatarPicker } from "@/components/os/AvatarPicker";
import { ProfileAvatarView } from "@/components/os/ProfileAvatarView";

function fmtTime(ts?: number) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function ledgerLabel(e: MidwayWalletLedgerEntry): string {
  switch (e.kind) {
    case "bet_debit":
      return "BET SPENT";
    case "bet_credit":
      return "WIN RETURNED";
    case "bet_loss":
      return "LOSS";
    case "claim":
      return "SHARE CLAIMED";
    case "deposit":
      return "DEPOSIT";
    case "withdraw":
      return "WITHDRAW";
    case "reset":
      return "RESET";
    default:
      return e.kind;
  }
}

export function DashboardPanel() {
  const { openWin } = useOs();
  const { setVisible } = useWalletModal();
  const {
    connected,
    demoGuest,
    pubkey,
    adapterPubkey,
    walletConnected,
    midwayWalletAddress,
    midwayPlayBalance,
    play,
    username,
    profile,
    avatar,
    stats,
    hub,
    maxWallets,
    claimableShare,
    txLog,
    pnl,
    winRate,
    setUsername,
    setAvatar,
    unlinkWallet,
    makePrimary,
    switchActive,
    renameSlot,
  } = usePlayerProfile();

  const { balance: mainSol, loading: mainLoading } = useSolBalance();

  const [draft, setDraft] = useState(username ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(username ?? "");
  }, [username, pubkey]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const s of hub.slots) next[s.pubkey] = s.label;
    setLabelDrafts(next);
  }, [hub.slots]);

  const identityLabel = (() => {
    if (pubkey === DEMO_GUEST_PUBKEY) return "DEMO · GUEST";
    if (pubkey) return truncateAddress(pubkey, 6, 6);
    return "Not connected";
  })();

  const nftOwner =
    adapterPubkey && adapterPubkey !== DEMO_GUEST_PUBKEY
      ? adapterPubkey
      : pubkey && pubkey !== DEMO_GUEST_PUBKEY
        ? pubkey
        : null;

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

  const onSwitch = (slot: WalletSlot) => {
    setError(null);
    const res = switchActive(slot.pubkey);
    if (!res.ok) setError(res.error);
    else setStatus(`Active ledger → ${truncateAddress(slot.pubkey, 4, 4)}`);
  };

  const onPrimary = (slot: WalletSlot) => {
    setError(null);
    const res = makePrimary(slot.pubkey);
    if (!res.ok) setError(res.error);
    else setStatus(`Primary set → ${truncateAddress(slot.pubkey, 4, 4)}`);
  };

  const onRemove = (slot: WalletSlot) => {
    setError(null);
    unlinkWallet(slot.pubkey);
    setStatus(`Removed ${truncateAddress(slot.pubkey, 4, 4)}`);
  };

  const onSaveLabel = (slot: WalletSlot) => {
    const res = renameSlot(slot.pubkey, labelDrafts[slot.pubkey] ?? "");
    if (!res.ok) setError(res.error);
    else setStatus("Label saved.");
  };

  const netTone = pnl.net > 0 ? "text-acid" : pnl.net < 0 ? "text-burn" : "text-ink";

  return (
    <div className="font-heading text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2">
        <div className="flex min-w-0 items-center gap-2">
          {(connected || hub.slots.length > 0) && pubkey && (
            <ProfileAvatarView avatar={avatar} size={40} px={2} />
          )}
          <div className="min-w-0">
            <div className="chroma text-sm text-hot">PROFILE.EXE</div>
            <div className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
              Username · Midway wallet · main wallets
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="bevel-inset px-2 py-1 text-[10px] text-acid">DEMO</span>
          <WalletConnectControl size="panel" />
        </div>
      </div>

      <div className="bevel-inset border border-acid/40 bg-acid/10 px-3 py-2 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        <strong className="font-heading text-[10px] tracking-wide text-acid">
          MIDWAY WALLET · DEMO
        </strong>
        {" — "}
        Connect a main wallet → create username → Midway wallet is created for play
        funds. Play balance is local (not real custody). Deposit / withdraw in
        WALLET.EXE.
      </div>

      {!connected && hub.slots.length === 0 && (
        <div className="bevel-inset p-3 font-sans text-[13px] normal-case tracking-normal text-ink-dim">
          Connect Phantom / Solflare to set up your Midway profile (username + Midway
          wallet), or play demo for an ephemeral Midway wallet. Linked main wallets:
          max {maxWallets}.
          <button
            type="button"
            className="bevel-btn bevel-btn-hot mt-2 block w-full py-2 font-heading text-[11px] tracking-wide"
            onClick={() => setVisible(true)}
          >
            CONNECT / DEMO
          </button>
        </div>
      )}

      {(connected || hub.slots.length > 0) && (
        <>
          <section className="bevel-inset space-y-2 p-3">
            <div className="font-heading text-[10px] tracking-wide text-ink-dim">
              ACTIVE IDENTITY
            </div>
            <div className="flex items-start gap-2">
              <ProfileAvatarView avatar={avatar} size={48} px={3} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="break-all font-mono text-[12px] text-ink">
                  {username ? `@${username}` : "—"} · {identityLabel}
                </div>
                {midwayWalletAddress && (
                  <div className="break-all font-mono text-[10px] text-acid">
                    Midway · {truncateAddress(midwayWalletAddress, 6, 6)}
                  </div>
                )}
                {pubkey && pubkey !== DEMO_GUEST_PUBKEY && (
                  <div className="break-all font-mono text-[10px] text-ink-dim">
                    Main · {truncateAddress(pubkey, 6, 6)}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="MAIN SOL"
                value={
                  !walletConnected
                    ? "—"
                    : mainLoading
                      ? "…"
                      : mainSol == null
                        ? "—"
                        : mainSol.toFixed(2)
                }
              />
              <Stat
                label="MIDWAY PLAY"
                value={(midwayPlayBalance?.sol ?? play.sol).toFixed(2)}
                accent="text-acid"
              />
            </div>
            <button
              type="button"
              className="bevel-btn w-full py-1.5 text-[10px]"
              onClick={() => openWin("wallet")}
            >
              DEPOSIT / WITHDRAW IN WALLET
            </button>
            <div className="grid grid-cols-2 gap-2 font-sans text-[11px] normal-case tracking-normal text-ink-dim">
              <div>
                Last session:{" "}
                <span className="text-ink">{fmtTime(profile?.lastSessionAt)}</span>
              </div>
              <div>
                Last connected:{" "}
                <span className="text-ink">{fmtTime(profile?.lastConnectedAt)}</span>
              </div>
            </div>
            {adapterPubkey && pubkey && adapterPubkey !== pubkey && (
              <p className="font-sans text-[11px] normal-case text-cyber">
                Viewing linked ledger · extension still{" "}
                {truncateAddress(adapterPubkey, 4, 4)}
              </p>
            )}
            {demoGuest && (
              <p className="font-sans text-[11px] normal-case text-ink-dim">
                Guest Midway wallet is ephemeral and separate from linked main wallets.
              </p>
            )}
          </section>

          <section className="bevel-inset space-y-2 p-3">
            <div className="font-heading text-[10px] tracking-wide text-ink-dim">
              USERNAME
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={draft}
                maxLength={USERNAME_MAX}
                placeholder="e.g. TentFox"
                disabled={!pubkey}
                className="bevel-inset min-w-[140px] flex-1 bg-panel px-2 py-1.5 font-mono text-[13px] text-ink outline-none disabled:opacity-50"
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
                disabled={!pubkey}
                onClick={onSave}
              >
                SAVE
              </button>
            </div>
            <p className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
              {USERNAME_MIN}–{USERNAME_MAX} chars · letters, numbers, _ -
            </p>
          </section>

          <AvatarPicker
            pubkey={pubkey}
            avatar={avatar}
            nftOwner={nftOwner}
            onSave={setAvatar}
            onStatus={(m) => {
              setError(null);
              setStatus(m);
            }}
            onError={(m) => {
              setStatus(null);
              setError(m);
            }}
          />

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label="MIDWAY SOL"
              value={(midwayPlayBalance?.sol ?? play.sol).toFixed(2)}
            />
            <Stat label="ROUNDS" value={String(stats?.rounds ?? 0)} />
            <Stat label="WINS" value={String(stats?.wins ?? 0)} />
            <Stat label="WIN RATE" value={`${winRate}%`} />
          </section>

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="BET SPENT" value={pnl.betSpent.toFixed(2)} />
            <Stat label="WINS BACK" value={pnl.winsReturned.toFixed(2)} />
            <Stat
              label="SHARES"
              value={(stats?.sharesClaimed ?? pnl.claims).toFixed(4)}
            />
            <Stat label="NET P/L" value={pnl.net.toFixed(2)} accent={netTone} />
          </section>

          <section className="bevel-inset space-y-1 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-heading text-[10px] tracking-wide text-ink-dim">
                BELIEVERS SHARE
              </div>
              <span className="num text-acid">
                ◎ {claimableShare.toFixed(4)} claimable
              </span>
            </div>
            <p className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
              Accrues from Colors house cut · claim in TREASURY.MON
            </p>
          </section>

          <section className="bevel-inset space-y-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-heading text-[10px] tracking-wide text-ink-dim">
                MAIN WALLETS · {hub.slots.length}/{maxWallets}
              </div>
              <button
                type="button"
                className="bevel-btn px-2 py-1 text-[10px]"
                onClick={() => setVisible(true)}
                disabled={hub.slots.length >= maxWallets}
                title={
                  hub.slots.length >= maxWallets
                    ? "Remove a wallet first"
                    : "Connect Phantom / Solflare to attach"
                }
              >
                + ADD VIA CONNECT
              </button>
            </div>
            {hub.slots.length === 0 ? (
              <p className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
                No main wallets linked yet. Connect Phantom or Solflare — that becomes
                your cash-out target and creates a Midway wallet for play funds.
              </p>
            ) : (
              <ul className="space-y-2">
                {hub.slots.map((slot) => {
                  const isActive = hub.activePubkey === slot.pubkey;
                  const isPrimary = hub.primaryPubkey === slot.pubkey;
                  const isExtension = adapterPubkey === slot.pubkey;
                  return (
                    <li
                      key={slot.pubkey}
                      className={`border border-line bg-panel/40 p-2 ${
                        isActive ? "border-acid/60" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] text-ink">
                          {truncateAddress(slot.pubkey, 6, 6)}
                        </span>
                        {isPrimary && (
                          <span className="bevel-inset px-1.5 py-0.5 text-[9px] text-acid">
                            PRIMARY
                          </span>
                        )}
                        {isActive && (
                          <span className="bevel-inset px-1.5 py-0.5 text-[9px] text-hot">
                            ACTIVE
                          </span>
                        )}
                        {isExtension && (
                          <span className="bevel-inset px-1.5 py-0.5 text-[9px] text-cyber">
                            CONNECTED
                          </span>
                        )}
                      </div>
                      <div className="mt-1 break-all font-mono text-[10px] text-ink-dim">
                        {slot.pubkey}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-1 font-sans text-[10px] normal-case tracking-normal text-ink-dim">
                        <span>Linked {fmtTime(slot.linkedAt)}</span>
                        <span>Last connected {fmtTime(slot.lastConnectedAt)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <input
                          type="text"
                          value={labelDrafts[slot.pubkey] ?? ""}
                          maxLength={24}
                          placeholder="label"
                          className="bevel-inset min-w-[80px] flex-1 bg-panel px-1.5 py-1 font-mono text-[11px] text-ink outline-none"
                          onChange={(e) =>
                            setLabelDrafts((d) => ({
                              ...d,
                              [slot.pubkey]: e.target.value,
                            }))
                          }
                          aria-label={`Label for ${truncateAddress(slot.pubkey)}`}
                        />
                        <button
                          type="button"
                          className="bevel-btn px-2 py-1 text-[10px]"
                          onClick={() => onSaveLabel(slot)}
                        >
                          LABEL
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            className="bevel-btn bevel-btn-hot px-2 py-1 text-[10px]"
                            onClick={() => onSwitch(slot)}
                          >
                            SET ACTIVE
                          </button>
                        )}
                        {!isPrimary && (
                          <button
                            type="button"
                            className="bevel-btn px-2 py-1 text-[10px]"
                            onClick={() => onPrimary(slot)}
                          >
                            PRIMARY
                          </button>
                        )}
                        <button
                          type="button"
                          className="bevel-btn px-2 py-1 text-[10px] text-burn"
                          onClick={() => onRemove(slot)}
                        >
                          REMOVE
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="bevel-inset space-y-2 p-3">
            <div className="font-heading text-[10px] tracking-wide text-ink-dim">
              TRANSACTIONS · LOCAL LOG
            </div>
            {txLog.length === 0 ? (
              <p className="font-sans text-[12px] normal-case tracking-normal text-ink-dim">
                No bets, wins, losses, or claims yet for this wallet.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-auto font-mono text-[10px] text-ink-dim">
                {txLog.slice(0, 40).map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap justify-between gap-2 border-b border-line/40 py-0.5"
                  >
                    <span>
                      <span className="text-ink">{ledgerLabel(e)}</span>
                      {" · "}
                      {e.asset} {e.amount.toFixed(4)}
                      {e.note ? ` · ${e.note}` : ""}
                    </span>
                    <span>{fmtTime(e.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && (
            <p className="font-sans text-[12px] normal-case text-burn">{error}</p>
          )}
          {status && (
            <p className="font-sans text-[12px] normal-case text-acid">{status}</p>
          )}

          <p className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
            Midway play balance DEMO cap {DEMO_PLAY_SOL} SOL · wins = rounds with ≥1
            color hit · net P/L = wins returned − bets spent + shares claimed.
          </p>
        </>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="bevel-btn px-3 py-2"
          onClick={() => openWin("wallet")}
        >
          ▶ WALLET
        </button>
        <button
          type="button"
          className="bevel-btn px-3 py-2"
          onClick={() => openWin("leaderboard")}
        >
          ▶ BOARD
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
          onClick={() => openWin("treasury")}
        >
          ▶ TREASURY
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bevel-inset px-2 py-2 text-center">
      <div className="font-heading text-[9px] tracking-wide text-ink-dim">{label}</div>
      <div className={`num mt-0.5 text-sm ${accent ?? "text-ink"}`}>{value}</div>
    </div>
  );
}
