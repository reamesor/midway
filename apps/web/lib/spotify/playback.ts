/** Spotify Web API playback helpers (device transfer + context play). */

import { getValidSpotifyAccessToken } from "./auth";
import { getSpotifyContextUri, getSpotifyPlaylistUrl } from "./config";

async function spotifyFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getValidSpotifyAccessToken();
  if (!token) throw new Error("Not connected to Spotify");
  return fetch(`https://api.spotify.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export async function playSpotifyContext(deviceId: string): Promise<void> {
  const contextUri = getSpotifyContextUri();
  const body = contextUri
    ? { context_uri: contextUri }
    : undefined;

  const res = await spotifyFetch(
    `/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  // 204 = ok; 404 with NO_ACTIVE_DEVICE sometimes needs a moment after connect
  if (res.status === 204 || res.status === 202) return;
  if (res.ok) return;

  const data = (await res.json().catch(() => ({}))) as {
    error?: { reason?: string; message?: string };
  };
  const reason = data.error?.reason || data.error?.message || res.statusText;
  throw new Error(reason || "Could not start Spotify playback");
}

export async function transferPlaybackToDevice(
  deviceId: string,
  play = false,
): Promise<void> {
  const res = await spotifyFetch("/v1/me/player", {
    method: "PUT",
    body: JSON.stringify({ device_ids: [deviceId], play }),
  });
  if (res.status === 204 || res.ok) return;
  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  throw new Error(data.error?.message || "Could not transfer playback");
}

export function openSpotifyPlaylistFallback() {
  window.open(getSpotifyPlaylistUrl(), "_blank", "noopener,noreferrer");
}

let sdkPromise: Promise<void> | null = null;

export function loadSpotifyPlaybackSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SDK requires browser"));
  }
  if (window.Spotify?.Player) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const prev = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      prev?.();
      resolve();
    };

    const existing = document.getElementById("spotify-player-sdk");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "spotify-player-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Failed to load Spotify Web Playback SDK"));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}
