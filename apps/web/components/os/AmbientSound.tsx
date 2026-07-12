"use client";

import { useEffect, useRef } from "react";
import { AMBIENT_SRC } from "@/lib/ambientAudio";
import { useOs } from "./OsContext";
import { useSpotifyOptional } from "./SpotifyContext";

/**
 * Single looping ambient bed for the arcade shell.
 * Starts only after sound is enabled (user gesture via mute toggle / menu).
 * Yields to Spotify Web Playback while Spotify is actively playing.
 */
export function AmbientSound() {
  const { sound, volume } = useOs();
  const spotify = useSpotifyOptional();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spotifyPlaying = Boolean(spotify?.spotifyActive);

  useEffect(() => {
    const el = new Audio(AMBIENT_SRC);
    el.loop = true;
    el.preload = "auto";
    el.volume = volume;
    audioRef.current = el;
    return () => {
      el.pause();
      el.src = "";
      audioRef.current = null;
    };
    // Intentionally mount once; volume/sound synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = Math.min(1, Math.max(0, volume));
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!sound || volume <= 0 || spotifyPlaying) {
      el.pause();
      el.muted = true;
      return;
    }

    el.muted = false;
    const play = el.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        /* Autoplay blocked until a later gesture — mute toggle retries. */
      });
    }
  }, [sound, volume, spotifyPlaying]);

  return null;
}
