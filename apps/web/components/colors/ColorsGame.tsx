"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ColorPicker } from "./ColorPicker";
import { BetPanel } from "./BetPanel";
import { ColorsRules } from "./ColorsRules";
import { OsDialog } from "@/components/os/OsDialog";
import { useOs } from "@/components/os/OsContext";
import type { ColorKey } from "@/lib/colors/engine";
import { PAYOUT_MODE, settleRoll } from "@/lib/colors/engine";
import { useMidwayWallet } from "@/hooks/useMidwayWallet";
import { useColorsBetTx } from "@/hooks/useColorsBetTx";
import { DEMO_PLAY_SOL } from "@/lib/solana/escrow";
import { ResultBreakdown } from "./ResultBreakdown";
import { recordColorsRound } from "@/lib/leaderboard/localScores";

const DiceStage = dynamic(
  () => import("./DiceStage").then((m) => m.DiceStage),
  {
    ssr: false,
    loading: () => (
      <div className="bevel-inset h-[220px] bg-black sm:h-[260px] md:h-[300px]" />
    ),
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

type ColorsGameProps = {
  onHouseCut: (houseCut: number) => void;
};

export function ColorsGame({ onHouseCut }: ColorsGameProps) {
  const { openWin, setLastFairness } = useOs();
  const { setVisible } = useWalletModal();
  const {
    connected,
    demoGuest,
    pubkey,
    play,
    debitPlaySol,
    creditPlaySol,
    logBetLoss,
    refresh: refreshPlay,
  } = useMidwayWallet();
  const { placeBetOnChain } = useColorsBetTx();

  /** Midway play balance only when identity is unlocked — never show a fake spendable balance. */
  const balance = connected ? play.sol : 0;
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
  const dialogOpenRef = useRef(dialogOpen);

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
  useEffect(() => {
    dialogOpenRef.current = dialogOpen;
  }, [dialogOpen]);

  const locked = phase === "placed" || phase === "rolling";

  const openWalletFlow = () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    openWin("wallet");
  };

  const clearBoard = useCallback(() => {
    setResult(null);
    setDialogOpen(false);
    setDice(null);
    setHits([false, false, false]);
  }, []);

  const toggleColor = (c: ColorKey) => {
    if (locked) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else if (next.size < 3) next.add(c);
      return next;
    });
    clearBoard();
  };

  useEffect(() => {
    if (phase !== "select") return;
    if (dialogOpen || dice) {
      setPrompt("");
      return;
    }
    if (!connected) {
      setPrompt(
        picked.size
          ? "CONNECT / DEMO TO PLACE BET"
          : "SELECT UP TO 3 COLORS",
      );
      return;
    }
    setPrompt(picked.size ? "PLACE YOUR BET" : "SELECT UP TO 3 COLORS");
  }, [picked.size, phase, dialogOpen, dice, connected]);

  const ensureWalletAndBalance = (cost: number) => {
    if (!connectedRef.current) {
      setPrompt("CONNECT PHANTOM / SOLFLARE — OR PLAY DEMO");
      openWalletFlow();
      return false;
    }
    if (cost > balanceRef.current || cost <= 0) {
      setPrompt("NOT ENOUGH MIDWAY BALANCE — DEPOSIT OR RESET IN WALLET");
      openWin("wallet");
      return false;
    }
    return true;
  };

  const settleRound = useCallback(
    (
      currentBet: number,
      currentPicked: Set<ColorKey>,
      rolled: ColorKey[],
      data: { fairness?: Fairness; settlement?: ReturnType<typeof settleRoll> },
    ) => {
      const settlement =
        data.settlement ??
        settleRoll(currentBet, currentPicked, rolled, PAYOUT_MODE);
      const hitFlags = rolled.map((c) => currentPicked.has(c));

      setDice(rolled);
      setHits(hitFlags);
      if (data.fairness) {
        setFairness(data.fairness);
        setLastFairness(data.fairness);
      }
      if (settlement.winnings > 0) {
        creditPlaySol(settlement.winnings, "colors payout");
        refreshPlay();
      } else if (settlement.stake > 0) {
        logBetLoss(settlement.stake, "colors loss");
      }
      if (pubkey) {
        recordColorsRound(pubkey, {
          matches: settlement.matches,
          winnings: settlement.winnings,
          stake: settlement.stake,
        });
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
    },
    [creditPlaySol, logBetLoss, onHouseCut, pubkey, refreshPlay, setLastFairness],
  );

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

    const debit = debitPlaySol(cost, "colors bet");
    if (!debit.ok) {
      setPrompt(debit.error.toUpperCase());
      openWin("wallet");
      return false;
    }
    refreshPlay();

    setPhase("rolling");
    setPrompt("");
    clearBoard();

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

      await wait(780);

      const rolled = data.dice as ColorKey[];
      settleRound(currentBet, currentPicked, rolled, data);
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
    clearBoard,
    creditPlaySol,
    debitPlaySol,
    openWin,
    placeBetOnChain,
    refreshPlay,
    settleRound,
  ]);

  /** Arm the lever — does NOT debit. Bet cost leaves the pot only when the lever is pulled. */
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

    setPhase("placed");
    setPrompt("READY — PULL THE LEVER");
    clearBoard();
  };

  const cancelPlaced = () => {
    if (phaseRef.current !== "placed") return;
    setPhase("select");
    setPrompt(pickedRef.current.size ? "PLACE YOUR BET" : "SELECT UP TO 3 COLORS");
  };

  const rollOnly = async () => {
    if (phaseRef.current !== "placed") return;
    const currentPicked = pickedRef.current;
    const currentBet = betRef.current;
    const cost = currentBet * currentPicked.size;
    if (!ensureWalletAndBalance(cost)) {
      setPhase("select");
      return;
    }

    const debit = debitPlaySol(cost, "colors bet");
    if (!debit.ok) {
      setPrompt(debit.error.toUpperCase());
      openWin("wallet");
      setPhase("select");
      return;
    }
    refreshPlay();

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
      await wait(780);
      const rolled = data.dice as ColorKey[];
      settleRound(currentBet, currentPicked, rolled, data);
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
    if (dialogOpen) return;
    if (picked.size === 0) return;
    let cancelled = false;
    (async () => {
      await wait(280);
      if (cancelled || dialogOpenRef.current) return;
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
  }, [autoLeft, phase, picked.size, dialogOpen, runRound]);

  const dismissResult = () => {
    clearBoard();
    setPhase("select");
  };

  const dialogVariant =
    result?.matches === 3 ? "jackpot" : (result?.matches ?? 0) > 0 ? "win" : "lose";

  return (
    <div className="colors-game min-w-0 font-heading text-xs">
      <div className="mb-3 flex flex-col gap-2 border-b-2 border-line pb-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="chroma text-sm text-hot">COLORS.EXE</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="bevel-inset px-2 py-1.5 text-[10px] text-acid">
            {demoGuest ? "DEMO · GUEST" : "DEMO"}
          </span>
          <span className="bevel-inset px-2 py-1.5 text-[10px] text-ink-dim">
            MIDWAY · {DEMO_PLAY_SOL} SOL
          </span>
          <button
            type="button"
            className="bevel-btn min-h-11 px-3 py-2"
            onClick={() => openWin("wallet")}
            title="Open Midway wallet"
          >
            WALLET
          </button>
          <button
            type="button"
            className="bevel-btn min-h-11 px-3 py-2"
            onClick={() => openWin("dashboard")}
            title="Open dashboard"
          >
            PROFILE
          </button>
          <button
            type="button"
            className="bevel-btn min-h-11 min-w-11 px-3 py-2"
            onClick={() => setRulesOpen(true)}
            aria-label="Rules"
          >
            ?
          </button>
        </div>
      </div>

      <div className="mb-3 bevel-inset border border-acid/40 bg-acid/10 px-2.5 py-2 font-sans text-[11px] leading-snug normal-case tracking-normal text-ink-dim sm:px-3 sm:text-[12px]">
        <strong className="font-heading text-[10px] tracking-wide text-acid">
          DEMO · NO REAL FUNDS MOVE
        </strong>
        {" — "}
        Bets debit your Midway wallet play balance ({DEMO_PLAY_SOL} SOL DEMO seed).
        Main wallet is for connect / withdraw — not for betting.
      </div>

      <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]">
        <div className="min-w-0">
          <DiceStage
            dice={dice}
            rolling={phase === "rolling"}
            hits={hits}
            result={result}
            prompt={
              phase === "rolling" ||
              phase === "done" ||
              dialogOpen ||
              Boolean(dice)
                ? ""
                : prompt
            }
          />
          <ColorPicker picked={picked} locked={locked} onToggle={toggleColor} />

          {fairness && (
            <button
              type="button"
              className="bevel-btn mt-3 min-h-11 w-full py-3 text-cyber"
              onClick={() => openWin("fairness")}
            >
              ▶ VERIFY FAIRNESS.LOG
            </button>
          )}
          {fairness && (
            <details className="mt-2 bevel-inset p-2 font-mono text-[12px] text-ink-dim">
              <summary className="cursor-pointer py-1 text-cyber">seeds (inline)</summary>
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

        <div className="min-w-0">
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
            onCancelPlace={cancelPlaced}
            onPullLever={() => void rollOnly()}
            onOpenWallet={openWalletFlow}
            onMax={() => {
              const n = Math.max(1, picked.size);
              setBet(Math.max(0.01, Math.floor((balance / n) * 10000) / 10000));
            }}
          />

          <div className="mt-3 bevel p-3">
            <div className="mb-2 text-ink-dim">AUTOBET</div>
            <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
              {AUTOBET_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setAutobet(n);
                    setAutoLeft(n);
                  }}
                  className={`bevel-btn min-h-11 min-w-0 px-2 py-2 sm:min-w-11 sm:flex-1 ${
                    autobet === n && autoLeft !== 0 ? "bevel-btn-acid" : ""
                  }`}
                >
                  {n === 0 ? "OFF" : n === -1 ? "∞" : n}
                </button>
              ))}
            </div>
            {autoLeft !== 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 font-sans text-[12px] normal-case tracking-normal text-ink-dim">
                <span>remaining: {autoLeft < 0 ? "∞" : autoLeft}</span>
                <button
                  type="button"
                  className="bevel-btn min-h-11 px-3 py-2 text-burn"
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
          result ? (
            <ResultBreakdown
              matches={result.matches}
              winnings={result.winnings}
              stake={result.stake}
              houseCut={result.houseCut}
              unit="DEMO SOL"
            />
          ) : null
        }
        shareHref={
          result && result.matches > 0
            ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Hit ${result.matches} match${result.matches > 1 ? "es" : ""} on MIDWAY COLORS — +${fmt(result.winnings)} DEMO SOL to Midway Play. The cut comes home.`,
              )}`
            : undefined
        }
        onRetry={dismissResult}
        onClose={dismissResult}
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
