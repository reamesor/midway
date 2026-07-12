import { splitCut } from "@/lib/colors/engine";

export type TreasuryState = {
  total: number;
  burn: number;
  believers: number;
  build: number;
  burnedTokens: number;
};

export function applyHouseCut(
  state: TreasuryState,
  houseCut: number,
): TreasuryState {
  const parts = splitCut(houseCut);
  return {
    total: state.total + houseCut,
    burn: state.burn + parts.burn,
    believers: state.believers + parts.believers,
    build: state.build + parts.build,
    // Fun-mode pretend price for the burn ticker
    burnedTokens: state.burnedTokens + Math.round(parts.burn * 1200),
  };
}
