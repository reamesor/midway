"use client";

import type { ReactNode } from "react";
import { SolanaProvider } from "./SolanaProvider";

/** Client wallet tree. Adapters hydrate after mount inside SolanaProvider. */
export function SolanaProviderGate({ children }: { children: ReactNode }) {
  return <SolanaProvider>{children}</SolanaProvider>;
}
