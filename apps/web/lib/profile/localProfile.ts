/** Local profile (username + session stamps) keyed by wallet pubkey or DEMO_GUEST. */

export type MidwayProfile = {
  username: string;
  updatedAt: number;
  /** Last time this identity was active in the arcade. */
  lastSessionAt?: number;
  /** Last wallet connect / guest enable for this pubkey. */
  lastConnectedAt?: number;
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
  if (!stored) return null;
  const rawName = typeof stored.username === "string" ? stored.username : "";
  let username = "";
  if (rawName) {
    const check = validateUsername(rawName);
    if (!check.ok) return null;
    username = check.username;
  }
  const lastSessionAt =
    typeof stored.lastSessionAt === "number" ? stored.lastSessionAt : undefined;
  const lastConnectedAt =
    typeof stored.lastConnectedAt === "number" ? stored.lastConnectedAt : undefined;
  // Empty username is only useful as a session stub.
  if (!username && lastSessionAt == null && lastConnectedAt == null) return null;
  return {
    username,
    updatedAt: typeof stored.updatedAt === "number" ? stored.updatedAt : Date.now(),
    lastSessionAt,
    lastConnectedAt,
  };
}

function writeProfile(pubkey: string, profile: MidwayProfile) {
  writeJson(KEY(pubkey), profile);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { pubkey } }));
  }
}

export function saveProfile(
  pubkey: string,
  rawUsername: string,
): { ok: true; profile: MidwayProfile } | { ok: false; error: string } {
  const check = validateUsername(rawUsername);
  if (!check.ok) return check;
  const prev = loadProfile(pubkey);
  const profile: MidwayProfile = {
    username: check.username,
    updatedAt: Date.now(),
    lastSessionAt: prev?.lastSessionAt,
    lastConnectedAt: prev?.lastConnectedAt,
  };
  writeProfile(pubkey, profile);
  return { ok: true, profile };
}

/** Stamp last connected / session without requiring a username yet. */
export function touchProfileSession(
  pubkey: string,
  opts?: { connected?: boolean },
): MidwayProfile {
  const prev = loadProfile(pubkey);
  const now = Date.now();
  const profile: MidwayProfile = {
    username: prev?.username ?? "",
    updatedAt: prev?.updatedAt ?? now,
    lastSessionAt: now,
    lastConnectedAt: opts?.connected ? now : prev?.lastConnectedAt,
  };
  // Only persist if we have a username or we're recording connect stamps in a stub.
  if (prev?.username) {
    writeProfile(pubkey, {
      ...profile,
      username: prev.username,
    });
    return { ...profile, username: prev.username };
  }
  // Keep a lightweight session stub so reconnect can show "last connected".
  writeJson(KEY(pubkey), {
    ...profile,
    username: prev?.username ?? "",
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { pubkey } }));
  }
  return profile;
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
