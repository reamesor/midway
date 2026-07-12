/** Public Spotify config for Midway in-panel playback. */

import { SPOTIFY_FALLBACK_URL } from "@/lib/ambientAudio";

export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

export const SPOTIFY_TOKEN_KEY = "midway-spotify-tokens";
export const SPOTIFY_PKCE_KEY = "midway-spotify-pkce";
export const SPOTIFY_RETURN_KEY = "midway-spotify-return";
export const SPOTIFY_STATE_KEY = "midway-spotify-state";

export function getSpotifyClientId(): string {
  const id =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID?.trim()
      : "";
  return id || "";
}

export function getSpotifyPlaylistUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SPOTIFY_URL?.trim()
      : "";
  return fromEnv || SPOTIFY_FALLBACK_URL;
}

/**
 * Parse spotify: URI or open.spotify.com playlist/album/track URL.
 * Search URLs return null (cannot play via Web Playback SDK).
 */
export function parseSpotifyUri(urlOrUri: string): string | null {
  const raw = urlOrUri.trim();
  if (!raw) return null;

  const uriMatch = raw.match(
    /^spotify:(playlist|album|track|artist):([A-Za-z0-9]+)$/i,
  );
  if (uriMatch) {
    return `spotify:${uriMatch[1]!.toLowerCase()}:${uriMatch[2]}`;
  }

  try {
    const u = new URL(raw);
    if (!u.hostname.includes("spotify.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    // /playlist/ID, /album/ID, /track/ID — ignore locale prefix
    const typeIdx = parts.findIndex((p) =>
      ["playlist", "album", "track", "artist"].includes(p.toLowerCase()),
    );
    if (typeIdx < 0 || !parts[typeIdx + 1]) return null;
    const type = parts[typeIdx]!.toLowerCase();
    const id = parts[typeIdx + 1]!.split("?")[0]!;
    if (!/^[A-Za-z0-9]+$/.test(id)) return null;
    return `spotify:${type}:${id}`;
  } catch {
    return null;
  }
}

export function getSpotifyContextUri(): string | null {
  return parseSpotifyUri(getSpotifyPlaylistUrl());
}

export function getSpotifyRedirectUri(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI?.trim()
      : "";
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/spotify/callback`;
  }
  const appUrl =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "")
      : "";
  return appUrl ? `${appUrl}/spotify/callback` : "/spotify/callback";
}

/** Server-safe: only an explicit env override (clients otherwise use origin). */
export function getSpotifyRedirectUriOverride(): string | null {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI?.trim()
      : "";
  return fromEnv || null;
}

export function isSpotifyConfigured(): boolean {
  return Boolean(getSpotifyClientId());
}
