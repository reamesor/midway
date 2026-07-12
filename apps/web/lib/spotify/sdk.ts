/** Minimal Spotify Web Playback SDK typings used by Midway. */

export type SpotifyPlayerState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      name: string;
      artists: { name: string }[];
      uri: string;
    } | null;
  };
};

export type SpotifyPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (
    event: string,
    cb: (payload: unknown) => void,
  ) => boolean;
  removeListener: (event: string, cb?: (payload: unknown) => void) => boolean;
  getCurrentState: () => Promise<SpotifyPlayerState | null>;
  setName: (name: string) => Promise<void>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement: () => Promise<void>;
};

export type SpotifyPlayerConstructor = new (options: {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}) => SpotifyPlayer;

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: SpotifyPlayerConstructor;
    };
  }
}

export {};
