"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearSpotifyAuth,
  fetchSpotifyProfile,
  getValidSpotifyAccessToken,
  isSpotifyPremium,
  readSpotifyTokens,
  startSpotifyLogin,
  type SpotifyProfile,
} from "@/lib/spotify/auth";
import {
  getSpotifyContextUri,
  getSpotifyPlaylistUrl,
  isSpotifyConfigured,
} from "@/lib/spotify/config";
import {
  loadSpotifyPlaybackSdk,
  openSpotifyPlaylistFallback,
  playSpotifyContext,
} from "@/lib/spotify/playback";
import type { SpotifyPlayer, SpotifyPlayerState } from "@/lib/spotify/sdk";

export type SpotifyStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "playing"
  | "paused"
  | "error";

type SpotifyContextValue = {
  configured: boolean;
  connected: boolean;
  status: SpotifyStatus;
  playing: boolean;
  /** True when Spotify owns audio (connected + ready player). Local loop should yield. */
  spotifyActive: boolean;
  trackName: string | null;
  artistName: string | null;
  error: string | null;
  profile: SpotifyProfile | null;
  playlistUrl: string;
  hasPlayableContext: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  setPlayerVolume: (v: number) => Promise<void>;
  openPlaylistInSpotify: () => void;
};

const SpotifyCtx = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({
  children,
  volume,
}: {
  children: ReactNode;
  /** 0–1 OS volume — mirrored to Spotify Web Playback when active. */
  volume: number;
}) {
  const [configured] = useState(() => isSpotifyConfigured());
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<SpotifyStatus>("idle");
  const [trackName, setTrackName] = useState<string | null>(null);
  const [artistName, setArtistName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [deviceReady, setDeviceReady] = useState(false);

  const playerRef = useRef<SpotifyPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const playlistUrl = getSpotifyPlaylistUrl();
  const hasPlayableContext = Boolean(getSpotifyContextUri());

  const teardownPlayer = useCallback(() => {
    try {
      playerRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    playerRef.current = null;
    deviceIdRef.current = null;
    setDeviceReady(false);
  }, []);

  const applyState = useCallback((state: SpotifyPlayerState | null) => {
    if (!state) {
      setStatus((s) => (s === "error" ? s : "ready"));
      setTrackName(null);
      setArtistName(null);
      return;
    }
    const track = state.track_window.current_track;
    setTrackName(track?.name ?? null);
    setArtistName(track?.artists?.map((a) => a.name).join(", ") || null);
    setStatus(state.paused ? "paused" : "playing");
  }, []);

  const initPlayer = useCallback(async () => {
    if (!configured) return;
    const token = await getValidSpotifyAccessToken();
    if (!token) {
      setConnected(false);
      setStatus("idle");
      return;
    }

    setConnected(true);
    setStatus("connecting");
    setError(null);

    const me = await fetchSpotifyProfile(token);
    setProfile(me);

    if (!isSpotifyPremium(me)) {
      teardownPlayer();
      setStatus("error");
      setError(
        "Spotify Premium is required for in-app playback. Local loop still works — or open the playlist in Spotify.",
      );
      return;
    }

    try {
      await loadSpotifyPlaybackSdk();
    } catch (e) {
      setStatus("error");
      setError(
        e instanceof Error ? e.message : "Could not load Spotify player",
      );
      return;
    }

    if (!window.Spotify?.Player) {
      setStatus("error");
      setError("Spotify player unavailable in this browser");
      return;
    }

    teardownPlayer();

    const player = new window.Spotify.Player({
      name: "Midway Arcade",
      getOAuthToken: (cb) => {
        void getValidSpotifyAccessToken().then((t) => {
          if (t) cb(t);
        });
      },
      volume: Math.min(1, Math.max(0, volumeRef.current)),
    });

    player.addListener("ready", (payload) => {
      const { device_id } = payload as { device_id: string };
      deviceIdRef.current = device_id;
      setDeviceReady(true);
      setStatus("ready");
      void player.setVolume(Math.min(1, Math.max(0, volumeRef.current)));
    });

    player.addListener("not_ready", () => {
      deviceIdRef.current = null;
      setDeviceReady(false);
      setStatus("connecting");
    });

    player.addListener("player_state_changed", (payload) => {
      applyState(payload as SpotifyPlayerState | null);
    });

    player.addListener("initialization_error", (payload) => {
      const { message } = payload as { message?: string };
      setStatus("error");
      setError(message || "Spotify player failed to initialize");
    });

    player.addListener("authentication_error", (payload) => {
      const { message } = payload as { message?: string };
      setStatus("error");
      setError(message || "Spotify authentication failed — reconnect");
      clearSpotifyAuth();
      setConnected(false);
      teardownPlayer();
    });

    player.addListener("account_error", (payload) => {
      const { message } = payload as { message?: string };
      setStatus("error");
      setError(
        message ||
          "Spotify Premium is required for in-app playback. Local loop still works.",
      );
    });

    playerRef.current = player;
    const ok = await player.connect();
    if (!ok) {
      setStatus("error");
      setError("Could not connect Spotify Web Player");
    }
  }, [applyState, configured, teardownPlayer]);

  useEffect(() => {
    if (!configured) return;
    if (readSpotifyTokens()) {
      void initPlayer();
    }
    return () => {
      teardownPlayer();
    };
    // Mount once for session restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !deviceReady) return;
    void player.setVolume(Math.min(1, Math.max(0, volume)));
  }, [volume, deviceReady]);

  const connect = useCallback(async () => {
    if (!configured) {
      openSpotifyPlaylistFallback();
      return;
    }
    setError(null);
    setStatus("connecting");
    const returnPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/arcade";
    await startSpotifyLogin(returnPath || "/arcade");
  }, [configured]);

  const disconnect = useCallback(() => {
    teardownPlayer();
    clearSpotifyAuth();
    setConnected(false);
    setProfile(null);
    setTrackName(null);
    setArtistName(null);
    setError(null);
    setStatus("idle");
  }, [teardownPlayer]);

  const play = useCallback(async () => {
    const player = playerRef.current;
    const deviceId = deviceIdRef.current;
    if (!player || !deviceId) {
      setError("Spotify player not ready yet");
      return;
    }
    try {
      await player.activateElement();
    } catch {
      /* older SDK — ignore */
    }

    const state = await player.getCurrentState();
    if (state && state.paused && state.track_window.current_track) {
      await player.resume();
      return;
    }
    if (state && !state.paused) return;

    try {
      await playSpotifyContext(deviceId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
      setStatus("error");
    }
  }, []);

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
  }, []);

  const togglePlay = useCallback(async () => {
    if (status === "playing") {
      await pause();
      return;
    }
    await play();
  }, [pause, play, status]);

  const setPlayerVolume = useCallback(async (v: number) => {
    await playerRef.current?.setVolume(Math.min(1, Math.max(0, v)));
  }, []);

  const playing = status === "playing";
  const spotifyActive =
    connected && deviceReady && (status === "playing" || status === "paused");

  const value = useMemo<SpotifyContextValue>(
    () => ({
      configured,
      connected,
      status,
      playing,
      spotifyActive: spotifyActive && status === "playing",
      trackName,
      artistName,
      error,
      profile,
      playlistUrl,
      hasPlayableContext,
      connect,
      disconnect,
      togglePlay,
      play,
      pause,
      setPlayerVolume,
      openPlaylistInSpotify: openSpotifyPlaylistFallback,
    }),
    [
      artistName,
      configured,
      connect,
      connected,
      disconnect,
      error,
      hasPlayableContext,
      pause,
      play,
      playing,
      playlistUrl,
      profile,
      setPlayerVolume,
      spotifyActive,
      status,
      togglePlay,
      trackName,
    ],
  );

  return <SpotifyCtx.Provider value={value}>{children}</SpotifyCtx.Provider>;
}

export function useSpotify() {
  const ctx = useContext(SpotifyCtx);
  if (!ctx) {
    throw new Error("useSpotify must be used within SpotifyProvider");
  }
  return ctx;
}

/** Optional hook when provider may be absent (e.g. tests). */
export function useSpotifyOptional() {
  return useContext(SpotifyCtx);
}
