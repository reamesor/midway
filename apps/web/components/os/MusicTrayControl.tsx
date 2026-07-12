"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon, GLYPHS, inkPalette } from "@/lib/pixel";
import { useOs } from "./OsContext";
import { useSpotify } from "./SpotifyContext";

/**
 * Taskbar tray: local ambient mute/volume + Spotify connect / in-panel play.
 */
export function MusicTrayControl() {
  const { sound, setSound, volume, setVolume, theme } = useOs();
  const spotify = useSpotify();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const palette = inkPalette(theme);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const muted = !sound || volume <= 0;
  const spotifyReady =
    spotify.connected &&
    (spotify.status === "ready" ||
      spotify.status === "playing" ||
      spotify.status === "paused");
  const canControlSpotify =
    spotifyReady || spotify.status === "connecting";

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
        <span className="hidden sm:inline">
          {spotify.playing ? "SPOTIFY" : muted ? "MUTED" : "MUSIC"}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Ambient music"
          className="absolute bottom-9 right-0 z-[130] w-[240px] bevel hard-shadow bg-panel p-2 font-heading text-[11px]"
        >
          <div className="mb-1.5 px-1 text-[10px] uppercase tracking-wide text-[var(--ink-dim)]">
            Boardwalk bed
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
            onClick={() => {
              const next = !sound;
              setSound(next);
              if (!next && spotify.playing) void spotify.pause();
            }}
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
              aria-label="Music volume"
              className="music-vol-slider w-full"
              onChange={(e) => {
                const next = Number(e.target.value) / 100;
                setVolume(next);
                if (spotify.connected) void spotify.setPlayerVolume(next);
              }}
            />
          </label>

          <hr className="my-1.5 border-line" />

          {!spotify.configured && (
            <>
              <a
                href={spotify.playlistUrl}
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
                OPEN SPOTIFY ↗
              </a>
              <p className="px-2 pb-1 text-[9px] leading-snug text-[var(--ink-dim)] normal-case tracking-normal">
                Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID for in-app play. Until then,
                Spotify opens in a new tab.
              </p>
            </>
          )}

          {spotify.configured && !spotify.connected && (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
                onClick={() => {
                  void spotify.connect();
                }}
              >
                <PixelIcon
                  grid={[...GLYPHS.play]}
                  palette={{ K: "currentColor" }}
                  px={2}
                  style={{ width: 10, height: 10 }}
                />
                CONNECT SPOTIFY
              </button>
              <p className="px-2 pb-1 text-[9px] leading-snug text-[var(--ink-dim)] normal-case tracking-normal">
                In-app loop is local. Connect Spotify Premium to play the Midway
                playlist here.
              </p>
            </>
          )}

          {spotify.configured && spotify.connected && (
            <>
              {canControlSpotify && spotify.status !== "error" && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-ink hover:text-[var(--btn)]"
                  disabled={spotify.status === "connecting"}
                  onClick={() => {
                    if (!sound) setSound(true);
                    void spotify.togglePlay();
                  }}
                >
                  <PixelIcon
                    grid={[...GLYPHS.play]}
                    palette={{ K: "currentColor" }}
                    px={2}
                    style={{ width: 10, height: 10 }}
                  />
                  {spotify.status === "connecting"
                    ? "STARTING…"
                    : spotify.playing
                      ? "PAUSE SPOTIFY"
                      : "PLAY SPOTIFY"}
                </button>
              )}

              {(spotify.trackName || spotify.artistName) && (
                <p className="px-2 py-1 text-[9px] leading-snug text-ink normal-case tracking-normal truncate">
                  {spotify.trackName}
                  {spotify.artistName ? ` — ${spotify.artistName}` : ""}
                </p>
              )}

              {spotify.error && (
                <p className="px-2 py-1 text-[9px] leading-snug text-[var(--ink-dim)] normal-case tracking-normal">
                  {spotify.error}
                </p>
              )}

              {!spotify.hasPlayableContext && !spotify.error && (
                <p className="px-2 py-1 text-[9px] leading-snug text-[var(--ink-dim)] normal-case tracking-normal">
                  Playlist URL is a search link — set NEXT_PUBLIC_SPOTIFY_URL to
                  a playlist URL for in-app play.
                </p>
              )}

              <div className="mt-0.5 flex flex-col">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1 text-left text-[10px] text-[var(--ink-dim)] hover:bg-ink hover:text-[var(--btn)]"
                  onClick={() => {
                    spotify.openPlaylistInSpotify();
                    setOpen(false);
                  }}
                >
                  Open playlist ↗
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1 text-left text-[10px] text-[var(--ink-dim)] hover:bg-ink hover:text-[var(--btn)]"
                  onClick={() => spotify.disconnect()}
                >
                  Disconnect
                </button>
              </div>

              {!spotify.error && (
                <p className="px-2 pb-1 text-[9px] leading-snug text-[var(--ink-dim)] normal-case tracking-normal">
                  Premium + supported browser required. Local loop pauses while
                  Spotify plays.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
