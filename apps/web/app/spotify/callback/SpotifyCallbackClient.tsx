"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  consumeSpotifyReturnPath,
  exchangeSpotifyCode,
} from "@/lib/spotify/auth";

/**
 * Spotify PKCE redirect target. Exchanges ?code= for tokens, then returns
 * to the page that started Connect (arcade MUSIC tray or intro).
 */
export default function SpotifyCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Connecting Spotify…");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const returnPath = useMemo(() => consumeSpotifyReturnPath("/arcade"), []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (oauthError) {
        setMessage(errorDesc || oauthError || "Spotify authorization denied");
        window.setTimeout(() => router.replace(returnPath), 1800);
        return;
      }
      if (!code || !state) {
        setMessage("Missing Spotify authorization code");
        window.setTimeout(() => router.replace(returnPath), 1800);
        return;
      }
      try {
        await exchangeSpotifyCode(code, state);
        if (cancelled) return;
        setMessage("Connected — returning…");
        router.replace(returnPath);
      } catch (e) {
        if (cancelled) return;
        setMessage(e instanceof Error ? e.message : "Spotify connect failed");
        window.setTimeout(() => router.replace(returnPath), 2200);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [code, state, oauthError, errorDesc, returnPath, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#e9e6df",
        color: "#1a1a1a",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 12, letterSpacing: 2, marginBottom: 8 }}>
          MIDWAY · SPOTIFY
        </div>
        <p style={{ fontSize: 14, maxWidth: 360, lineHeight: 1.4 }}>{message}</p>
      </div>
    </main>
  );
}
