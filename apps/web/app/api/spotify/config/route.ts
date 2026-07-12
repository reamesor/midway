import { NextResponse } from "next/server";
import {
  getSpotifyClientId,
  getSpotifyContextUri,
  getSpotifyPlaylistUrl,
  getSpotifyRedirectUriOverride,
  isSpotifyConfigured,
  SPOTIFY_SCOPES,
} from "@/lib/spotify/config";

/**
 * Public Spotify config for the static intro HTML (no Next.js env injection).
 * Client ID is public by design (PKCE); no secrets here.
 */
export async function GET() {
  return NextResponse.json({
    configured: isSpotifyConfigured(),
    clientId: getSpotifyClientId() || null,
    playlistUrl: getSpotifyPlaylistUrl(),
    contextUri: getSpotifyContextUri(),
    redirectUri: getSpotifyRedirectUriOverride(),
    scopes: SPOTIFY_SCOPES,
  });
}
