"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ColorPicker } from "./ColorPicker";
import { BetPanel } from "./BetPanel";
import { ColorsRules } from "./ColorsRules";
import { OsDialog } from "@/components/os/OsDialog";
import { useOs } from "@/components/os/OsContext";
import type { ColorKey } from "@/lib/colors/engine";
import { PAYOUT_MODE, settleRoll, splitCut } from "@/lib/colors/engine";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import { useColorsBetTx } from "@/hooks/useColorsBetTx";
import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";

const DiceStage = dynamic(
  () => import("./DiceStage").then((m) => m.DiceStage),
  {
    ssr: false,
    loading: () => <div className="bevel-inset min-h-[300px] bg-black" />,
  },
);

type Phase = "select" | "placed" | "rolling" | "done";

type Fairness = {
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  dice: ColorKey[];
};

const AUTOBET_OPTIONS = [0, 5, 10, 20, 50, 100, -1] as const;
/** Preview buffer only when disconnected — bets stay gated. */
const PREVIEW_SOL_BALANCE = DEMO_PLAY_SOL;

type ColorsGameProps = {
  onHouseCut: (houseCut: number) => void;
};

export function ColorsGame({ onHouseCut }: ColorsGameProps) {
  const { openWin } = useOs();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { play, debitPlaySol, creditPlaySol, refresh: refreshPlay } =
    useMidwayWallet();
  const { placeBetOnChain } = useColorsBetTx();

  const balance = connected ? play.sol : PREVIEW_SOL_BALANCE;
  const needsDeposit = connected && play.sol <= 0;

  const [bet, setBet] = useState(0.05);
  const [picked, setPicked] = useState<Set<ColorKey>>(new Set());
  const [phase, setPhase] = useState<Phase>("select");
  const [dice, setDice] = useState<ColorKey[] | null>(null);
  const [hits, setHits] = useState<boolean[]>([false, false, false]);
  const [prompt, setPrompt] = useState("SELECT UP TO 3 COLORS");
  const [result, setResult] = useState<{
    matches: number;
    winnings: number;
    stake: number;
    houseCut: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fairness, setFairness] = useState<Fairness | null>(null);
  const [nonce, setNonce] = useState(0);
  const [autobet, setAutobet] = useState(0);
  const [autoLeft, setAutoLeft] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);

  const pickedRef = useRef(picked);
  const betRef = useRef(bet);
  const balanceRef = useRef(balance);
  const nonceRef = useRef(nonce);
  const phaseRef = useRef(phase);
  const connectedRef = useRef(connected);

  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(() => {
    betRef.current = bet;
  }, [bet]);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  useEffect(() => {
    nonceRef.current = nonce;
  }, [nonce]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  const locked = phase === "placed" || phase === "rolling";

  const openWalletFlow = () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    openWin("wallet");
  };

  const toggleColor = (c: ColorKey) => {
    if (locked) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else if (next.size < 3) next.add(c);
      return next;
    });
    setResult(null);
    setDialogOpen(false);
    setDice(null);
    setHits([false, false, false]);
  };

  useEffect(() => {
    if (phase !== "select") return;
    setPrompt(picked.size ? "PLACE YOUR BET" : "SELECT UP TO 3 COLORS");
  }, [picked.size, phase]);

  const ensureWalletAndBalance = (cost: number) => {
    if (!connectedRef.current) {
      setPrompt("WALLET REQUIRED — CONNECT TO PLAY");
      openWalletFlow();
      return false;
    }
    if (cost > balanceRef.current || cost <= 0) {
      setPrompt("NOT ENOUGH DEMO SOL — RESET POT IN MIDWAY.WALLET");
      openWin("wallet");
      return false;
    }
    return true;
  };

  const runRound = useCallback(async () => {
    const currentPicked = pickedRef.current;
    const currentBet = betRef.current;
    if (currentPicked.size === 0) {
      setPrompt("PICK AT LEAST ONE COLOR");
      return false;
    }
    const cost = currentBet * currentPicked.size;
    if (!ensureWalletAndBalance(cost)) return false;

    // Stub only — never signs/sends; settlement stays on demo ledger.
    void placeBetOnChain({ bet: currentBet, picked: Array.from(currentPicked) });

    const debit = debitPlaySol(cost, "colors stake");
    if (!debit.ok) {
      setPrompt(debit.error.toUpperCase());
      openWin("wallet");
      return false;
    }
    refreshPlay();

    setPhase("rolling");
    setPrompt("");
    setDice(null);
    setHits([false, false, false]);
    setResult(null);
    setDialogOpen(false);

    try {
      const res = await fetch("/api/colors/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bet: currentBet,
          picked: Array.from(currentPicked),
          nonce: nonceRef.current,
          mode: PAYOUT_MODE,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Roll failed");

      await wait(1100);

      const rolled = data.dice as ColorKey[];
      const settlement =
        data.settlement ??
        settleRoll(currentBet, currentPicked, rolled, PAYOUT_MODE);
      const hitFlags = rolled.map((c) => currentPicked.has(c));

      setDice(rolled);
      setHits(hitFlags);
      setFairness(data.fairness);
      if (settlement.winnings > 0) {
        creditPlaySol(settlement.winnings, "colors payout");
        refreshPlay();
      }
      setResult({
        matches: settlement.matches,
        winnings: settlement.winnings,
        stake: settlement.stake,
        houseCut: settlement.houseCut,
      });
      setDialogOpen(true);
      onHouseCut(settlement.houseCut);
      setNonce((n) => n + 1);
      setPhase("done");
      await wait(150);
      setPhase("select");
      return true;
    } catch (err) {
      console.error(err);
      setPrompt("ROLL FAILED — TRY AGAIN");
      creditPlaySol(cost, "colors refund");
      refreshPlay();
      setPhase("select");
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ensureWallet uses stable openWin/setVisible
  }, [
    creditPlaySol,
    debitPlaySol,
    onHouseCut,
    openWin,
    placeBetOnChain,
    refreshPlay,
  ]);

  const placeOnly = () => {
    if (phaseRef.current !== "select") return;
    const currentPicked = pickedRef.current;
    const currentBet = betRef.current;
    if (currentPicked.size === 0) {
      setPrompt("PICK AT LEAST ONE COLOR");
      return;
    }
    const cost = currentBet * currentPicked.size;
    if (!ensureWalletAndBalance(cost)) return;

    void placeBetOnChain({ bet: currentBet, picked: Array.from(currentPicked) });

    const debit = debitPlaySol(cost, "colors stake");
    if (!debit.ok) {
      setPrompt(debit.error.toUpperCase());
      openWin("wallet");
      return;
    }
    refreshPlay();

    setPhase("placed");
    setPrompt("READY — PULL THE LEVER");
    setDice(null);
    setHits([false, false, false]);
    setResult(null);
    setDialogOpen(false);
  };

  const rollOnly = async () => {
    if (phaseRef.current !== "placed") return;
    const currentPicked = pickedRef.current;
    const currentBet = betRef.current;
    const cost = currentBet * currentPicked.size;
    setPhase("rolling");
    setPrompt("");
    try {
      const res = await fetch("/api/colors/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bet: currentBet,
          picked: Array.from(currentPicked),
          nonce: nonceRef.current,
          mode: PAYOUT_MODE,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Roll failed");
      await wait(1100);
      const rolled = data.dice as ColorKey[];
      const settlement =
        data.settlement ??
        settleRoll(currentBet, currentPicked, rolled, PAYOUT_MODE);
      setDice(rolled);
      setHits(rolled.map((c) => currentPicked.has(c)));
      setFairness(data.fairness);
      if (settlement.winnings > 0) {
        creditPlaySol(settlement.winnings, "colors payout");
        refreshPlay();
      }
      setResult({
        matches: settlement.matches,
        winnings: settlement.winnings,
        stake: settlement.stake,
        houseCut: settlement.houseCut,
      });
      setDialogOpen(true);
      onHouseCut(settlement.houseCut);
      setNonce((n) => n + 1);
      setPhase("done");
      await wait(120);
      setPhase("select");
    } catch (err) {
      console.error(err);
      setPrompt("ROLL FAILED — TRY AGAIN");
      creditPlaySol(cost, "colors refund");
      refreshPlay();
      setPhase("placed");
    }
  };

  useEffect(() => {
    if (autoLeft === 0) return;
    if (phase !== "select") return;
    if (picked.size === 0) return;
    let cancelled = false;
    (async () => {
      await wait(200);
      if (cancelled) return;
      const ok = await runRound();
      if (cancelled) return;
      if (ok) setAutoLeft((n) => (n < 0 ? n : n - 1));
      else {
        setAutoLeft(0);
        setAutobet(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoLeft, phase, picked.size, runRound]);

  const dialogVariant =
    result?.matches === 3 ? "jackpot" : (result?.matches ?? 0) > 0 ? "win" : "lose";
  const parts = result ? splitCut(result.houseCut) : null;

  return (
    <div className="font-heading text-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2">
        <div className="chroma text-sm text-hot">COLORS.EXE</div>
        <div className="flex items-center gap-1">
          <span className="bevel-inset px-2 py-1 text-[10px] text-acid">DEMO</span>
          <span className="bevel-inset px-2 py-1 text-[10px] text-ink-dim">
            {DEMO_PLAY_SOL} SOL POT
          </span>
          <button
            type="button"
            className="bevel-btn px-2 py-1"
            onClick={() => openWin("wallet")}
            title="Open Midway wallet"
          >
            WALLET
          </button>
          <button
            type="button"
            className="bevel-btn px-2 py-1"
            onClick={() => setRulesOpen(true)}
          >
            ?
          </button>
        </div>
      </div>

      <div className="mb-3 bevel-inset border border-acid/40 bg-acid/10 px-3 py-2 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
        <strong className="font-heading text-[10px] tracking-wide text-acid">
          DEMO · NO REAL FUNDS MOVE
        </strong>
        {" — "}
        Bets use a local {DEMO_PLAY_SOL} SOL play pot. Wallet connect is identity only.
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <DiceStage
            dice={dice}
            rolling={phase === "rolling"}
            hits={hits}
            prompt={phase === "rolling" ? "" : prompt}
          />
          <ColorPicker picked={picked} locked={locked} onToggle={toggleColor} />

          {fairness && (
            <button
              type="button"
              className="bevel-btn mt-3 w-full py-2 text-cyber"
              onClick={() => openWin("fairness")}
            >
              ▶ VERIFY FAIRNESS.LOG
            </button>
          )}
          {fairness && (
            <details className="mt-2 bevel-inset p-2 font-mono text-[12px] text-ink-dim">
              <summary className="cursor-pointer text-cyber">seeds (inline)</summary>
              <div className="mt-2 space-y-1 break-all">
                <div>hash: {fairness.serverSeedHash}</div>
                <div>server: {fairness.serverSeed}</div>
                <div>client: {fairness.clientSeed}</div>
                <div>nonce: {fairness.nonce}</div>
                <div>dice: {fairness.dice.join(", ")}</div>
                <div>payout: {PAYOUT_MODE}</div>
              </div>
            </details>
          )}
        </div>

        <div>
          <BetPanel
            balance={balance}
            bet={bet}
            canPlace={phase === "select"}
            canRoll={phase === "placed"}
            placingDisabled={picked.size === 0}
            leverArmed={phase === "placed"}
            walletConnected={connected}
            needsDeposit={needsDeposit}
            onBetChange={setBet}
            onPlace={placeOnly}
            onPullLever={() => void rollOnly()}
            onOpenWallet={openWalletFlow}
            onMax={() => {
              const n = Math.max(1, picked.size);
              setBet(Math.max(0.01, Math.floor((balance / n) * 10000) / 10000));
            }}
          />

          <div className="mt-3 bevel p-3">
            <div className="mb-2 text-ink-dim">AUTOBET</div>
            <div className="flex flex-wrap gap-1">
              {AUTOBET_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setAutobet(n);
                    setAutoLeft(n);
                  }}
                  className={`bevel-btn px-2 py-1 ${
                    autobet === n && autoLeft !== 0 ? "bevel-btn-acid" : ""
                  }`}
                >
                  {n === 0 ? "OFF" : n === -1 ? "∞" : n}
                </button>
              ))}
            </div>
            {autoLeft !== 0 && (
              <div className="mt-2 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
                remaining: {autoLeft < 0 ? "∞" : autoLeft}{" "}
                <button
                  type="button"
                  className="text-burn"
                  onClick={() => {
                    setAutobet(0);
                    setAutoLeft(0);
                  }}
                >
                  STOP
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <OsDialog
        open={dialogOpen && Boolean(result)}
        variant={dialogVariant}
        title={
          result?.matches === 3
            ? "★ JACKPOT · 3 MATCHES"
            : (result?.matches ?? 0) > 0
              ? `★ WIN · ${result?.matches} MATCH${(result?.matches ?? 0) > 1 ? "ES" : ""}`
              : "✕ ERROR: NO MATCH"
        }
        body={
          result
            ? result.matches > 0
              ? `+${fmt(result.winnings)} demo SOL returned to Midway play.`
              : `−${fmt(result.stake)} demo SOL from Midway play. The cut still comes home.`
            : ""
        }
        detail={
          parts
            ? `◎ +${fmt(result!.houseCut)} SOL → treasury · burn ${fmt(parts.burn)} · believers ${fmt(parts.believers)} · build ${fmt(parts.build)}`
            : undefined
        }
        shareHref={
          result && result.matches > 0
            ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Hit ${result.matches} match${result.matches > 1 ? "es" : ""} on MIDWAY COLORS — +${fmt(result.winnings)} SOL. The cut comes home.`,
              )}`
            : undefined
        }
        onRetry={() => {
          setDialogOpen(false);
          setResult(null);
        }}
        onClose={() => setDialogOpen(false)}
      />

      <ColorsRules open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
