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

type OsContextValue = {
  calm: boolean;
  oneBit: boolean;
  sound: boolean;
  booted: boolean;
  zCounter: number;
  open: Record<WinId, boolean>;
  focused: WinId | null;
  zMap: Record<WinId, number>;
  setCalm: (v: boolean) => void;
  setOneBit: (v: boolean) => void;
  setSound: (v: boolean) => void;
  finishBoot: () => void;
  openWin: (id: WinId) => void;
  closeWin: (id: WinId) => void;
  focusWin: (id: WinId) => void;
  toggleWin: (id: WinId) => void;
};

const OsContext = createContext<OsContextValue | null>(null);

const DEFAULT_OPEN: Record<WinId, boolean> = {
  loop: true,
  colors: true,
  treasury: true,
  readme: false,
  fairness: false,
};

export function OsProvider({ children }: { children: ReactNode }) {
  const [calm, setCalmState] = useState(false);
  const [oneBit, setOneBitState] = useState(false);
  const [sound, setSound] = useState(false);
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
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("calm", calm);
  }, [calm]);

  useEffect(() => {
    document.documentElement.classList.toggle("one-bit", oneBit);
  }, [oneBit]);

  const setCalm = useCallback((v: boolean) => setCalmState(v), []);
  const setOneBit = useCallback((v: boolean) => setOneBitState(v), []);

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
      booted,
      zCounter,
      open,
      focused,
      zMap,
      setCalm,
      setOneBit,
      setSound,
      finishBoot,
      openWin,
      closeWin,
      focusWin,
      toggleWin,
    }),
    [
      calm,
      oneBit,
      sound,
      booted,
      zCounter,
      open,
      focused,
      zMap,
      setCalm,
      setOneBit,
      finishBoot,
      openWin,
      closeWin,
      focusWin,
      toggleWin,
    ],
  );

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>;
}

export function useOs() {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOs must be used within OsProvider");
  return ctx;
}
