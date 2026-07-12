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

export type WinId = "loop" | "colors" | "treasury" | "readme" | "fairness";
export type OsTheme = "light" | "dark";

type OsContextValue = {
  calm: boolean;
  oneBit: boolean;
  sound: boolean;
  theme: OsTheme;
  booted: boolean;
  zCounter: number;
  open: Record<WinId, boolean>;
  focused: WinId | null;
  zMap: Record<WinId, number>;
  setCalm: (v: boolean) => void;
  setOneBit: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setTheme: (v: OsTheme) => void;
  toggleTheme: () => void;
  finishBoot: () => void;
  openWin: (id: WinId) => void;
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
  readme: false,
  fairness: false,
};

const THEME_KEY = "midway-os-theme";

export function OsProvider({ children }: { children: ReactNode }) {
  const [calm, setCalmState] = useState(false);
  const [oneBit, setOneBitState] = useState(false);
  const [sound, setSound] = useState(false);
  const [theme, setThemeState] = useState<OsTheme>("light");
  const [booted, setBooted] = useState(false);
  const [open, setOpen] = useState(DEFAULT_OPEN);
  const [focused, setFocused] = useState<WinId | null>("colors");
  const [zCounter, setZCounter] = useState(10);
  const [zMap, setZMap] = useState<Record<WinId, number>>({
    loop: 11,
    colors: 14,
    treasury: 12,
    readme: 10,
    fairness: 10,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("midway-booted") === "1") setBooted(true);
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") setThemeState(saved);
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
    setZCounter((z) => {
      const next = z + 1;
      setZMap((m) => ({ ...m, [id]: next }));
      return next;
    });
  }, []);

  const openWin = useCallback(
    (id: WinId) => {
      setOpen((o) => ({ ...o, [id]: true }));
      focusWin(id);
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
      theme,
      booted,
      zCounter,
      open,
      focused,
      zMap,
      setCalm,
      setOneBit,
      setSound,
      setTheme,
      toggleTheme,
      finishBoot,
      openWin,
      closeWin,
      focusWin,
      toggleWin,
      goToIntro,
    }),
    [
      calm,
      oneBit,
      sound,
      theme,
      booted,
      zCounter,
      open,
      focused,
      zMap,
      setCalm,
      setOneBit,
      setTheme,
      toggleTheme,
      finishBoot,
      openWin,
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
