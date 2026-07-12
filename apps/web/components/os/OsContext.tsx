"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_VOLUME,
  readStoredSound,
  readStoredVolume,
  writeStoredSound,
  writeStoredVolume,
} from "@/lib/ambientAudio";

export type WinId =
  | "loop"
  | "colors"
  | "treasury"
  | "wallet"
  | "info"
  | "token"
  | "fairness"
  | "soon";
export type OsTheme = "light" | "dark";

/** Last Colors commit/reveal — FAIRNESS.LOG + verify API. */
export type LastFairness = {
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  dice: string[];
};

type OsContextValue = {
  calm: boolean;
  oneBit: boolean;
  sound: boolean;
  volume: number;
  theme: OsTheme;
  booted: boolean;
  zCounter: number;
  open: Record<WinId, boolean>;
  focused: WinId | null;
  zMap: Record<WinId, number>;
  soonTitle: string;
  soonBlurb: string;
  lastFairness: LastFairness | null;
  setLastFairness: (v: LastFairness | null) => void;
  setCalm: (v: boolean) => void;
  setOneBit: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setVolume: (v: number) => void;
  setTheme: (v: OsTheme) => void;
  toggleTheme: () => void;
  finishBoot: () => void;
  openWin: (id: WinId) => void;
  openSoon: (title: string, blurb: string) => void;
  closeWin: (id: WinId) => void;
  focusWin: (id: WinId) => void;
  toggleWin: (id: WinId) => void;
  goToIntro: () => void;
};

const OsContext = createContext<OsContextValue | null>(null);

const DEFAULT_OPEN: Record<WinId, boolean> = {
  loop: true,
  colors: true,
  treasury: true,
  wallet: false,
  info: false,
  token: false,
  fairness: false,
  soon: false,
};

const THEME_KEY = "midway-os-theme";

export function OsProvider({ children }: { children: ReactNode }) {
  const [calm, setCalmState] = useState(false);
  const [oneBit, setOneBitState] = useState(false);
  const [sound, setSoundState] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [theme, setThemeState] = useState<OsTheme>("light");
  const [booted, setBooted] = useState(false);
  const [open, setOpen] = useState(DEFAULT_OPEN);
  const [focused, setFocused] = useState<WinId | null>("colors");
  const [soonTitle, setSoonTitle] = useState("");
  const [soonBlurb, setSoonBlurb] = useState("");
  const [lastFairness, setLastFairness] = useState<LastFairness | null>(null);
  // zCounter must be >= max(zMap) so focusWin/openWin always raise above peers.
  const [zMap, setZMap] = useState<Record<WinId, number>>({
    loop: 11,
    colors: 14,
    treasury: 12,
    wallet: 13,
    info: 10,
    token: 10,
    fairness: 10,
    soon: 10,
  });
  const [zCounter, setZCounter] = useState(14);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("midway-booted") === "1") setBooted(true);
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") setThemeState(saved);
    setSoundState(readStoredSound(false));
    setVolumeState(readStoredVolume(DEFAULT_VOLUME));
  }, []);

  const setSound = useCallback((v: boolean) => {
    setSoundState(v);
    writeStoredSound(v);
  }, []);

  const setVolume = useCallback((v: number) => {
    const next = Math.min(1, Math.max(0, v));
    setVolumeState(next);
    writeStoredVolume(next);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("calm", calm);
  }, [calm]);

  useEffect(() => {
    document.documentElement.classList.toggle("one-bit", oneBit);
  }, [oneBit]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setCalm = useCallback((v: boolean) => setCalmState(v), []);
  const setOneBit = useCallback((v: boolean) => setOneBitState(v), []);
  const setTheme = useCallback((v: OsTheme) => setThemeState(v), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "light" ? "dark" : "light")),
    [],
  );

  const goToIntro = useCallback(() => {
    try {
      sessionStorage.removeItem("midway-intro-seen");
    } catch {
      /* ignore */
    }
    window.location.href = "/?replay=1";
  }, []);

  const finishBoot = useCallback(() => {
    setBooted(true);
    sessionStorage.setItem("midway-booted", "1");
  }, []);

  const focusWin = useCallback((id: WinId) => {
    setFocused(id);
    setZMap((m) => {
      const next = Math.max(...Object.values(m)) + 1;
      setZCounter(next);
      return { ...m, [id]: next };
    });
  }, []);

  const openWin = useCallback(
    (id: WinId) => {
      setOpen((o) => ({ ...o, [id]: true }));
      focusWin(id);
    },
    [focusWin],
  );

  const openSoon = useCallback(
    (title: string, blurb: string) => {
      setSoonTitle(title);
      setSoonBlurb(blurb);
      setOpen((o) => ({ ...o, soon: true }));
      focusWin("soon");
    },
    [focusWin],
  );

  const closeWin = useCallback((id: WinId) => {
    setOpen((o) => ({ ...o, [id]: false }));
    setFocused((f) => (f === id ? null : f));
  }, []);

  const toggleWin = useCallback(
    (id: WinId) => {
      setOpen((o) => {
        if (o[id]) {
          setFocused((f) => (f === id ? null : f));
          return { ...o, [id]: false };
        }
        focusWin(id);
        return { ...o, [id]: true };
      });
    },
    [focusWin],
  );

  const value = useMemo(
    () => ({
      calm,
      oneBit,
      sound,
      volume,
      theme,
      booted,
      zCounter,
      open,
      focused,
      zMap,
      soonTitle,
      soonBlurb,
      lastFairness,
      setLastFairness,
      setCalm,
      setOneBit,
      setSound,
      setVolume,
      setTheme,
      toggleTheme,
      finishBoot,
      openWin,
      openSoon,
      closeWin,
      focusWin,
      toggleWin,
      goToIntro,
    }),
    [
      calm,
      oneBit,
      sound,
      volume,
      theme,
      booted,
      zCounter,
      open,
      focused,
      zMap,
      soonTitle,
      soonBlurb,
      lastFairness,
      setCalm,
      setOneBit,
      setSound,
      setVolume,
      setTheme,
      toggleTheme,
      finishBoot,
      openWin,
      openSoon,
      closeWin,
      focusWin,
      toggleWin,
      goToIntro,
    ],
  );

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>;
}

export function useOs() {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOs must be used within OsProvider");
  return ctx;
}
