"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon, GLYPHS, inkPalette } from "@/lib/pixel";
import { getSpotifyUrl } from "@/lib/ambientAudio";
import { useOs } from "./OsContext";

/**
 * Taskbar tray: mute/unmute, volume, open Midway Spotify playlist.
 * Local loop is in-app; Spotify is the full playlist deep link.
 */
export function MusicTrayControl() {
  const { sound, setSound, volume, setVolume, theme } = useOs();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const palette = inkPalette(theme);
  const spotifyUrl = getSpotifyUrl();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const muted = !sound || volume <= 0;

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        className="bevel-btn flex items-center gap-1 px-2 py-1 text-[10px] whitespace-nowrap"
        title={muted ? "Unmute ambient music" : "Music controls"}
        aria-label={muted ? "Unmute ambient music" : "Open music controls"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <PixelIcon
          grid={[...(muted ? GLYPHS.speakerOff : GLYPHS.speaker)]}
          palette={palette}
          px={2}
          style={{ width: 12, height: 12 }}
        />
        <span className="hidden sm:inline">{muted ? "MUTED" : "MUSIC"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Ambient music"
          className="absolute bottom-9 right-0 z-[130] w-[220px] bevel hard-shadow bg-panel p-2 font-heading text-[11px]"
        >
          <div className="mb-1.5 px-1 text-[10px] uppercase tracking-wide text-[var(--ink-dim)]">
            Boardwalk bed
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
            onClick={() => setSound(!sound)}
          >
            <PixelIcon
              grid={[...(sound ? GLYPHS.speaker : GLYPHS.speakerOff)]}
              palette={{ K: "currentColor", Y: "currentColor", X: "currentColor" }}
              px={2}
              style={{ width: 12, height: 12 }}
            />
            {sound ? "MUTE" : "UNMUTE"}
          </button>

          <label className="mt-1 flex flex-col gap-1 px-2 py-1.5">
            <span className="flex justify-between text-[10px] uppercase text-[var(--ink-dim)]">
              <span>Volume</span>
              <span className="num">{Math.round(volume * 100)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(volume * 100)}
              disabled={!sound}
              aria-label="Ambient volume"
              className="music-vol-slider w-full"
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
            />
          </label>

          <hr className="my-1.5 border-line" />

          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-ink no-underline hover:bg-ink hover:text-[var(--btn)]"
            onClick={() => setOpen(false)}
          >
            <PixelIcon
              grid={[...GLYPHS.play]}
              palette={{ K: "currentColor" }}
              px={2}
              style={{ width: 10, height: 10 }}
            />
            CONNECT SPOTIFY
          </a>
          <p className="px-2 pb-1 text-[9px] leading-snug text-[var(--ink-dim)] normal-case tracking-normal">
            In-app loop is local. Spotify opens the full Midway playlist.
          </p>
        </div>
      )}
    </div>
  );
}
