"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { BetPanel } from "./BetPanel";
import { OsDialog } from "@/components/os/OsDialog";
import { useOs } from "@/components/os/OsContext";
import type { ColorKey } from "@/lib/colors/engine";
import { PAYOUT_MODE, settleRoll, splitCut } from "@/lib/colors/engine";

const DiceStage = dynamic(
  () => import("./DiceStage").then((m) => m.DiceStage),
  {
    ssr: false,
    loading: () => <div className="bevel-inset min-h-[300px] bg-black" />,
  },
);

type Phase = "select" | "placed" | "rolling" | "done";
type Mode = "fun" | "sol";

type Fairness = {
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  dice: ColorKey[];
};

const AUTOBET_OPTIONS = [0, 5, 10, 20, 50, 100, -1] as const;

type ColorsGameProps = {
  onHouseCut: (houseCut: number) => void;
};

export function ColorsGame({ onHouseCut }: ColorsGameProps) {
  const { openWin } = useOs();
  const [mode, setMode] = useState<Mode>("fun");
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(100);
  const [picked, setPicked] = useState<Set<ColorKey>>(new Set());
  const [phase, setPhase] = useState<Phase>("select");
  const [stake, setStake] = useState(0);
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

  const unit = mode === "fun" ? "PTS" : "SOL";
  const unitLower = mode === "fun" ? "pts" : "◎";
  const locked = phase === "placed" || phase === "rolling";

  const stakePreview = useMemo(() => {
    if (picked.size === 0) return "— (pick colors)";
    const s = bet * picked.size;
    return `${bet} × ${picked.size} = ${s.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unitLower}`;
  }, [bet, picked.size, unitLower]);

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

  const switchMode = (m: Mode) => {
    setMode(m);
    setBalance(m === "fun" ? 1000 : 5);
    setPhase("select");
    setDice(null);
    setResult(null);
    setDialogOpen(false);
    setHits([false, false, false]);
    setAutoLeft(0);
    setAutobet(0);
    if (m === "sol") {
      alert("SOLANA MODE (demo): wallet connect lands in Phase 6.");
    }
  };

  const runRound = useCallback(async () => {
    const currentPicked = pickedRef.current;
    const currentBet = betRef.current;
    const currentBalance = balanceRef.current;
    if (currentPicked.size === 0) {
      setPrompt("PICK AT LEAST ONE COLOR");
      return false;
    }
    const nextStake = currentBet * currentPicked.size;
    if (nextStake > currentBalance || nextStake <= 0) {
      setPrompt("NOT ENOUGH BALANCE");
      return false;
    }

    setBalance((b) => b - nextStake);
    setStake(nextStake);
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
      setBalance((b) => b + settlement.winnings);
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
      setBalance((b) => b + nextStake);
      setPhase("select");
      return false;
    }
  }, [onHouseCut]);

  const placeOnly = () => {
    if (phaseRef.current !== "select") return;
    const currentPicked = pickedRef.current;
    const currentBet = betRef.current;
    const currentBalance = balanceRef.current;
    if (currentPicked.size === 0) {
      setPrompt("PICK AT LEAST ONE COLOR");
      return;
    }
    const nextStake = currentBet * currentPicked.size;
    if (nextStake > currentBalance || nextStake <= 0) {
      setPrompt("NOT ENOUGH BALANCE");
      return;
    }
    setBalance((b) => b - nextStake);
    setStake(nextStake);
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
      setBalance((b) => b + settlement.winnings);
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
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => switchMode("fun")}
            className={`bevel-btn px-2 py-1 ${mode === "fun" ? "bevel-btn-hot" : ""}`}
          >
            FUN
          </button>
          <button
            type="button"
            onClick={() => switchMode("sol")}
            className={`bevel-btn px-2 py-1 ${mode === "sol" ? "bevel-btn-hot" : ""}`}
          >
            SOLANA
          </button>
          <button type="button" className="bevel-btn px-2 py-1" onClick={() => setRulesOpen(true)}>
            ?
          </button>
        </div>
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
                <div>mode: {PAYOUT_MODE}</div>
              </div>
            </details>
          )}
        </div>

        <div>
          <BetPanel
            balance={balance}
            unit={unit}
            bet={bet}
            stakePreview={stakePreview}
            canPlace={phase === "select"}
            canRoll={phase === "placed"}
            placingDisabled={picked.size === 0}
            leverArmed={phase === "placed"}
            onBetChange={setBet}
            onPlace={placeOnly}
            onPullLever={() => void rollOnly()}
            onMax={() => {
              const n = Math.max(1, picked.size);
              setBet(Math.max(1, Math.floor(balance / n)));
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
              ? `+${fmt(result.winnings)} ${unitLower} returned to your wallet buffer.`
              : `−${fmt(result.stake)} ${unitLower} this round. The cut still comes home.`
            : ""
        }
        detail={
          parts
            ? `◎ +${fmt(result!.houseCut)} → treasury · 🔥 ${fmt(parts.burn)} · ⭐ ${fmt(parts.believers)} · 🔧 ${fmt(parts.build)}`
            : undefined
        }
        onRetry={() => {
          setDialogOpen(false);
          setResult(null);
        }}
        onClose={() => setDialogOpen(false)}
      />

      {rulesOpen && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setRulesOpen(false)}
        >
          <div
            className="bevel hard-shadow-lg max-h-[80vh] w-full max-w-md overflow-y-auto bg-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="win-titlebar focused mb-3">
              <span>RULES.TXT</span>
              <div className="win-controls">
                <button type="button" onClick={() => setRulesOpen(false)}>
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-2 font-mono text-[14px] text-ink">
              <p>Pick up to 3 colors. Three dice roll. Matches = dice in your pick.</p>
              <p>
                Payout mode: <span className="text-acid">{PAYOUT_MODE}</span> (stake-based
                default).
              </p>
              <p>5% house cut always feeds the treasury. Pull the lever to roll.</p>
            </div>
          </div>
        </div>
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

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
