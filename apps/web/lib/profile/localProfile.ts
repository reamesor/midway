/** Local profile (username) keyed by wallet pubkey or DEMO_GUEST. Ready for a future API. */

export type MidwayProfile = {
  username: string;
  updatedAt: number;
};

export const USERNAME_MIN = 2;
export const USERNAME_MAX = 16;
/** Letters, digits, underscore, hyphen. */
const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

const KEY = (pubkey: string) => `midway-profile:v1:${pubkey}`;

/** Broadcast so taskbar / other windows refresh after save. */
export const PROFILE_EVENT = "midway-profile";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function validateUsername(
  raw: string,
): { ok: true; username: string } | { ok: false; error: string } {
  const username = raw.trim();
  if (username.length < USERNAME_MIN) {
    return { ok: false, error: `At least ${USERNAME_MIN} characters.` };
  }
  if (username.length > USERNAME_MAX) {
    return { ok: false, error: `At most ${USERNAME_MAX} characters.` };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Letters, numbers, _ and - only.",
    };
  }
  return { ok: true, username };
}

export function loadProfile(pubkey: string): MidwayProfile | null {
  const stored = readJson<MidwayProfile | null>(KEY(pubkey), null);
  if (!stored || typeof stored.username !== "string") return null;
  const check = validateUsername(stored.username);
  if (!check.ok) return null;
  return {
    username: check.username,
    updatedAt: typeof stored.updatedAt === "number" ? stored.updatedAt : Date.now(),
  };
}

export function saveProfile(
  pubkey: string,
  rawUsername: string,
): { ok: true; profile: MidwayProfile } | { ok: false; error: string } {
  const check = validateUsername(rawUsername);
  if (!check.ok) return check;
  const profile: MidwayProfile = {
    username: check.username,
    updatedAt: Date.now(),
  };
  writeJson(KEY(pubkey), profile);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { pubkey } }));
  }
  return { ok: true, profile };
}

export function clearProfile(pubkey: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY(pubkey));
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { pubkey } }));
  } catch {
    /* ignore */
  }
}
