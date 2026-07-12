/** Spotify OAuth PKCE + token storage / refresh. */

import {
  SPOTIFY_PKCE_KEY,
  SPOTIFY_RETURN_KEY,
  SPOTIFY_SCOPES,
  SPOTIFY_STATE_KEY,
  SPOTIFY_TOKEN_KEY,
  getSpotifyClientId,
  getSpotifyRedirectUri,
} from "./config";
import {
  challengeFromVerifier,
  generateCodeVerifier,
  generateOAuthState,
} from "./pkce";

export type SpotifyTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope?: string;
};

export type SpotifyProfile = {
  id: string;
  display_name: string | null;
  product: string;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readSpotifyTokens(): SpotifyTokens | null {
  const t = readJson<SpotifyTokens>(SPOTIFY_TOKEN_KEY);
  if (!t?.access_token || !t.refresh_token || !t.expires_at) return null;
  return t;
}

export function writeSpotifyTokens(tokens: SpotifyTokens) {
  writeJson(SPOTIFY_TOKEN_KEY, tokens);
}

export function clearSpotifyAuth() {
  try {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    sessionStorage.removeItem(SPOTIFY_PKCE_KEY);
    sessionStorage.removeItem(SPOTIFY_STATE_KEY);
    sessionStorage.removeItem(SPOTIFY_RETURN_KEY);
  } catch {
    /* ignore */
  }
}

export function setSpotifyReturnPath(path: string) {
  try {
    sessionStorage.setItem(SPOTIFY_RETURN_KEY, path);
  } catch {
    /* ignore */
  }
}

/** Cached so React Strict Mode double-mount does not lose the return path. */
let consumedReturnPath: string | null = null;

export function consumeSpotifyReturnPath(fallback = "/arcade"): string {
  if (consumedReturnPath) return consumedReturnPath;
  try {
    const v = sessionStorage.getItem(SPOTIFY_RETURN_KEY);
    sessionStorage.removeItem(SPOTIFY_RETURN_KEY);
    if (v && v.startsWith("/") && !v.startsWith("//")) {
      consumedReturnPath = v;
      return v;
    }
  } catch {
    /* ignore */
  }
  consumedReturnPath = fallback;
  return fallback;
}

function tokensFromTokenResponse(data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}, prevRefresh?: string): SpotifyTokens {
  const refresh = data.refresh_token || prevRefresh;
  if (!refresh) {
    throw new Error("Spotify token response missing refresh_token");
  }
  return {
    access_token: data.access_token,
    refresh_token: refresh,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    scope: data.scope,
  };
}

export async function startSpotifyLogin(returnPath?: string): Promise<void> {
  const clientId = getSpotifyClientId();
  if (!clientId) {
    throw new Error("Spotify client ID is not configured");
  }

  const verifier = generateCodeVerifier();
  const challenge = await challengeFromVerifier(verifier);
  const state = generateOAuthState();
  const redirectUri = getSpotifyRedirectUri();

  try {
    sessionStorage.setItem(SPOTIFY_PKCE_KEY, verifier);
    sessionStorage.setItem(SPOTIFY_STATE_KEY, state);
    if (returnPath) sessionStorage.setItem(SPOTIFY_RETURN_KEY, returnPath);
  } catch {
    /* ignore */
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });

  window.location.assign(
    `https://accounts.spotify.com/authorize?${params.toString()}`,
  );
}

export async function exchangeSpotifyCode(code: string, state: string) {
  const clientId = getSpotifyClientId();
  if (!clientId) throw new Error("Spotify client ID is not configured");

  const expectedState = sessionStorage.getItem(SPOTIFY_STATE_KEY);
  const verifier = sessionStorage.getItem(SPOTIFY_PKCE_KEY);
  if (!expectedState || state !== expectedState) {
    throw new Error("Spotify OAuth state mismatch");
  }
  if (!verifier) throw new Error("Missing PKCE verifier");

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: getSpotifyRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token || !data.expires_in || !data.token_type) {
    throw new Error(
      data.error_description || data.error || "Spotify token exchange failed",
    );
  }

  const tokens = tokensFromTokenResponse({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  });
  writeSpotifyTokens(tokens);

  try {
    sessionStorage.removeItem(SPOTIFY_PKCE_KEY);
    sessionStorage.removeItem(SPOTIFY_STATE_KEY);
  } catch {
    /* ignore */
  }

  return tokens;
}

async function refreshSpotifyTokens(
  tokens: SpotifyTokens,
): Promise<SpotifyTokens> {
  const clientId = getSpotifyClientId();
  if (!clientId) throw new Error("Spotify client ID is not configured");

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token || !data.expires_in || !data.token_type) {
    clearSpotifyAuth();
    throw new Error(
      data.error_description || data.error || "Spotify token refresh failed",
    );
  }

  const next = tokensFromTokenResponse(
    {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    },
    tokens.refresh_token,
  );
  writeSpotifyTokens(next);
  return next;
}

export async function getValidSpotifyAccessToken(): Promise<string | null> {
  let tokens = readSpotifyTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token;
  }
  try {
    tokens = await refreshSpotifyTokens(tokens);
    return tokens.access_token;
  } catch {
    return null;
  }
}

export async function fetchSpotifyProfile(
  accessToken?: string,
): Promise<SpotifyProfile | null> {
  const token = accessToken || (await getValidSpotifyAccessToken());
  if (!token) return null;

  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    id?: string;
    display_name?: string | null;
    product?: string;
  };
  if (!data.id) return null;
  return {
    id: data.id,
    display_name: data.display_name ?? null,
    product: data.product || "unknown",
  };
}

export function isSpotifyPremium(profile: SpotifyProfile | null): boolean {
  return profile?.product === "premium";
}
