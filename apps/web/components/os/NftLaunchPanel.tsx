"use client";

import { useOs } from "@/components/os/OsContext";
import {
  HOLDER_CLAIM_BONUS_BPS,
  HOLDER_MULTIPLIERS,
  NFT_HOLDER_BENEFITS_STATUS,
  formatClaimBonusBps,
  formatMultiplier,
} from "@/lib/nft/holders";

/**
 * NFT.LAUNCH booth — promise copy + planned economics.
 * Mint is not live; numbers come from lib/nft/holders.ts.
 */
export function NftLaunchPanel() {
  const { openWin } = useOs();
  const claimBonus = formatClaimBonusBps(HOLDER_CLAIM_BONUS_BPS);

  return (
    <div className="space-y-4 font-sans text-[14px] leading-relaxed text-ink">
      <div className="font-heading text-[12px] tracking-wide text-ink-dim">
        ATTRACTION · NOT LIVE YET
      </div>
      <h2 className="font-heading text-base tracking-wide text-ink">NFT.LAUNCH</h2>

      <div className="bevel-inset space-y-2 p-3">
        <div className="font-heading text-[11px] tracking-wide text-ink">
          TL;DR — holder promise
        </div>
        <ul className="list-disc space-y-1.5 pl-4 text-[13px] text-ink-dim">
          <li>
            Booth under construction —{" "}
            <span className="text-ink">mint not live</span> yet.
          </li>
          <li>
            When it launches: mint fees + royalties feed{" "}
            <span className="text-ink">burn · believers · build</span>.
          </li>
          <li>
            Holders get <span className="text-ink">planned ride multipliers</span>{" "}
            plus an <span className="text-ink">extra cut of claimable fees</span> vs
            non-holders.
          </li>
        </ul>
      </div>

      <p className="text-ink-dim">
        Midway NFTs are meant to be tickets into the loop — not just pictures on a
        wall. Once mint is live, holding is designed to boost Colors / attractions
        math and thicken your believers claim vs someone without a pass.
      </p>

      <div>
        <div className="mb-1.5 font-heading text-[11px] tracking-wide text-ink">
          Multipliers · {NFT_HOLDER_BENEFITS_STATUS}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {HOLDER_MULTIPLIERS.map((tier) => (
            <div key={tier.id} className="bevel-inset p-2.5">
              <div className="font-heading text-[10px] text-ink-dim">{tier.label}</div>
              <div className="num my-0.5 text-lg text-ink">
                {formatMultiplier(tier.multiplier)}
              </div>
              <p className="font-sans text-[12px] leading-snug text-ink-dim">
                {tier.flavor}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 font-heading text-[11px] tracking-wide text-ink">
          Believers claim · designed
        </div>
        <div className="bevel-inset space-y-1.5 p-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="num text-lg text-ink">{claimBonus}</span>
            <span className="font-heading text-[10px] tracking-wide text-ink-dim">
              of believers / claimable fee share
            </span>
          </div>
          <p className="text-[13px] text-ink-dim">
            NFT holders get an additional cut of claimable fees vs non-holders — a
            thicker slice of the believers claim, not a separate off-board purse.
            Demo constant:{" "}
            <span className="font-mono text-ink">
              HOLDER_CLAIM_BONUS_BPS = {HOLDER_CLAIM_BONUS_BPS}
            </span>{" "}
            ({claimBonus}). Not wired yet.
          </p>
        </div>
      </div>

      <p className="bevel-inset p-3 text-[13px] text-ink-dim">
        Live now: <span className="text-ink">Colors</span> feeds the house cut into
        burn · believers · build. Open INFO.TXT for the full boardwalk story.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bevel-btn bevel-btn-hot px-3 py-2 font-heading text-[11px]"
          onClick={() => openWin("info")}
        >
          READ INFO.TXT
        </button>
        <button
          type="button"
          className="bevel-btn px-3 py-2 font-heading text-[11px]"
          onClick={() => openWin("colors")}
        >
          PLAY COLORS
        </button>
      </div>
    </div>
  );
}
