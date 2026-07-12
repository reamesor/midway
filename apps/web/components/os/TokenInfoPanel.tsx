"use client";

import { useCallback, useState, type ReactNode } from "react";
import { truncateAddress } from "@/lib/solana/address";
import {
  explorerTokenUrl,
  getBuyLinks,
  getDiscordUrl,
  getMidwayMint,
  getTwitterUrl,
  solscanTokenUrl,
} from "@/lib/token/public";

export function TokenInfoPanel() {
  const mint = getMidwayMint();
  const twitter = getTwitterUrl();
  const discord = getDiscordUrl();
  const buyLinks = getBuyLinks(mint);
  const [copied, setCopied] = useState(false);

  const copyMint = useCallback(async () => {
    if (!mint) return;
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [mint]);

  return (
    <div className="info-panel space-y-5 text-[14px] leading-relaxed text-ink">
      <div className="info-tldr bevel-inset sticky top-0 z-10 -mx-1 mb-1 space-y-2 bg-panel px-3 py-3">
        <div className="font-heading text-[11px] tracking-wide text-ink">
          TL;DR — the MIDWAY token
        </div>
        <ul className="list-disc space-y-1.5 pl-4 font-sans text-[13px] text-ink-dim">
          <li>
            <span className="text-ink">MIDWAY</span> is the boardwalk&apos;s ecosystem
            token — believers share the cut that comes home.
          </li>
          <li>
            Tagline: <span className="text-ink">every cut comes home</span> — house edge
            routes to burn · believers · build, not a private purse.
          </li>
          <li>
            Holders sit in the <span className="text-ink">believers</span> slice of the
            treasury loop that every ride feeds.
          </li>
        </ul>
      </div>

      <Header>What the token is</Header>
      <p className="font-sans text-ink-dim">
        The MIDWAY token is how the arcade stays owned by the people who show up. Games,
        mints, and trades on Midway rails feed one shared treasury. Part of that cut is
        meant for <strong className="font-semibold text-ink">believers</strong> — holders
        and long-stay players — so the boardwalk compounds instead of leaking value off
        the pier.
      </p>
      <p className="font-sans text-ink-dim">
        It is not a casino chip you cash at a cage. It is the stake in the loop: burn
        tightens supply, believers get paid, build keeps the lights on. Same story as
        INFO.TXT and LOOP.EXE — just the token booth.
      </p>

      <Header>Token address</Header>
      <div className="bevel-inset space-y-3 p-3">
        {mint ? (
          <>
            <div className="font-mono text-[12px] break-all text-ink sm:text-[13px]">
              {mint}
            </div>
            <div className="font-heading text-[10px] tracking-wide text-ink-dim">
              {truncateAddress(mint, 6, 6)} · Solana mint
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="bevel-btn bevel-btn-hot px-3 py-2 font-heading text-[11px]"
                onClick={() => void copyMint()}
              >
                {copied ? "COPIED" : "COPY"}
              </button>
              <a
                href={explorerTokenUrl(mint)}
                target="_blank"
                rel="noopener noreferrer"
                className="bevel-btn px-3 py-2 font-heading text-[11px]"
              >
                SOLANA EXPLORER
              </a>
              <a
                href={solscanTokenUrl(mint)}
                target="_blank"
                rel="noopener noreferrer"
                className="bevel-btn px-3 py-2 font-heading text-[11px]"
              >
                SOLSCAN
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="font-heading text-sm tracking-wide text-ink">mint TBA</div>
            <p className="font-sans text-[13px] text-ink-dim">
              Set <span className="font-mono text-ink">NEXT_PUBLIC_MIDWAY_MINT</span> to
              show the live address, copy button, and explorer links.
            </p>
            <div className="flex flex-wrap gap-2 opacity-60">
              <button
                type="button"
                disabled
                className="bevel-btn px-3 py-2 font-heading text-[11px]"
              >
                COPY
              </button>
              <span className="bevel-btn px-3 py-2 font-heading text-[11px]">
                SOLANA EXPLORER
              </span>
              <span className="bevel-btn px-3 py-2 font-heading text-[11px]">
                SOLSCAN
              </span>
            </div>
          </>
        )}
      </div>

      <Header>Where to buy</Header>
      <p className="font-sans text-[13px] text-ink-dim">
        Prefer a single CTA via{" "}
        <span className="font-mono text-ink">NEXT_PUBLIC_BUY_URL</span>. Jupiter / Raydium
        light up automatically once the mint is set.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {buyLinks.map((link) =>
          link.href ? (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bevel-btn bevel-btn-hot flex flex-col items-start gap-0.5 px-3 py-2.5 text-left"
            >
              <span className="font-heading text-[11px] tracking-wide">{link.label}</span>
              <span className="font-sans text-[10px] normal-case tracking-normal opacity-80">
                {link.hint}
              </span>
            </a>
          ) : (
            <div
              key={link.id}
              className="bevel-inset flex flex-col items-start gap-0.5 px-3 py-2.5 opacity-70"
              title={link.hint}
            >
              <span className="font-heading text-[11px] tracking-wide text-ink">
                {link.label}
              </span>
              <span className="font-sans text-[10px] text-ink-dim">TBA · {link.hint}</span>
            </div>
          ),
        )}
      </div>

      <Header>Socials</Header>
      <div className="flex flex-wrap gap-2">
        {twitter ? (
          <a
            href={twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="bevel-btn px-3 py-2 font-heading text-[11px]"
          >
            TWITTER / X
          </a>
        ) : (
          <span
            className="bevel-inset px-3 py-2 font-heading text-[11px] text-ink-dim"
            title="Set NEXT_PUBLIC_TWITTER_URL"
          >
            TWITTER / X · TBA
          </span>
        )}
        {discord ? (
          <a
            href={discord}
            target="_blank"
            rel="noopener noreferrer"
            className="bevel-btn px-3 py-2 font-heading text-[11px]"
          >
            DISCORD
          </a>
        ) : (
          <span
            className="bevel-inset px-3 py-2 font-heading text-[11px] text-ink-dim"
            title="Set NEXT_PUBLIC_DISCORD_URL"
          >
            DISCORD · TBA
          </span>
        )}
      </div>

      <p className="border-t border-line pt-3 font-heading text-[10px] tracking-wide text-ink-dim">
        MIDWAY OS · TOKEN.INFO · every cut comes home
      </p>
    </div>
  );
}

function Header({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-heading text-[12px] tracking-wide text-ink border-b border-line pb-1">
      {children}
    </h3>
  );
}
