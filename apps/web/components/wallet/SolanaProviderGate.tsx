"use client";

import type { ReactNode } from "react";
import { SolanaProvider } from "./SolanaProvider";

/** Client wallet tree for arcade + colors layouts. */
export function SolanaProviderGate({ children }: { children: ReactNode }) {
  return <SolanaProvider>{children}</SolanaProvider>;
}
