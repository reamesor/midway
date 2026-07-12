import { Suspense } from "react";
import SpotifyCallbackClient from "./SpotifyCallbackClient";

export default function SpotifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#e9e6df",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          Connecting Spotify…
        </main>
      }
    >
      <SpotifyCallbackClient />
    </Suspense>
  );
}
