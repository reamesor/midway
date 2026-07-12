/** Shared ambient music prefs (arcade OsContext + intro HTML). */

export const SOUND_KEY = "midway-os-sound";
export const VOLUME_KEY = "midway-os-volume";

/** Local looping boardwalk bed — cheerful chiptune/arcade procedural loop. */
export const AMBIENT_SRC = "/audio/ambient-loop.wav";

export const DEFAULT_VOLUME = 0.4;

/** Fallback when NEXT_PUBLIC_SPOTIFY_URL is unset. */
export const SPOTIFY_FALLBACK_URL =
  "https://open.spotify.com/search/midway%20arcade%20chiptune";

export function readStoredSound(fallback = false): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(SOUND_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeStoredSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readStoredVolume(fallback = DEFAULT_VOLUME): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw == null) return fallback;
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n));
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeStoredVolume(v: number) {
  try {
    localStorage.setItem(
      VOLUME_KEY,
      String(Math.min(1, Math.max(0, v))),
    );
  } catch {
    /* ignore */
  }
}

export function getSpotifyUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SPOTIFY_URL?.trim()
      : "";
  return fromEnv || SPOTIFY_FALLBACK_URL;
}
