"use client";

import type { ReactNode } from "react";
import { useOs } from "./OsContext";
import { SpotifyProvider } from "./SpotifyContext";

/** Wires OS volume into Spotify Web Playback inside the arcade shell. */
export function ArcadeMusicBridge({ children }: { children: ReactNode }) {
  const { volume } = useOs();
  return <SpotifyProvider volume={volume}>{children}</SpotifyProvider>;
}
