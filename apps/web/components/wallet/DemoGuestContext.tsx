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

export const DEMO_GUEST_PUBKEY = "DEMO_GUEST";
const STORAGE_KEY = "midway-demo-guest";

type DemoGuestContextValue = {
  /** Local demo identity without a Solana wallet extension. */
  demoGuest: boolean;
  enableDemoGuest: () => void;
  clearDemoGuest: () => void;
};

const DemoGuestContext = createContext<DemoGuestContextValue>({
  demoGuest: false,
  enableDemoGuest: () => undefined,
  clearDemoGuest: () => undefined,
});

export function DemoGuestProvider({ children }: { children: ReactNode }) {
  const [demoGuest, setDemoGuest] = useState(false);

  useEffect(() => {
    try {
      setDemoGuest(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  const enableDemoGuest = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDemoGuest(true);
  }, []);

  const clearDemoGuest = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setDemoGuest(false);
  }, []);

  const value = useMemo(
    () => ({ demoGuest, enableDemoGuest, clearDemoGuest }),
    [demoGuest, enableDemoGuest, clearDemoGuest],
  );

  return (
    <DemoGuestContext.Provider value={value}>{children}</DemoGuestContext.Provider>
  );
}

export function useDemoGuest() {
  return useContext(DemoGuestContext);
}
