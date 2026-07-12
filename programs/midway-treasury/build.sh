#!/usr/bin/env bash
# Build midway-treasury SBF with Agave 4.1.x platform-tools (v1.54).
# Anchor 0.30.1 wants Solana 1.18 by default; that toolchain cannot resolve
# current crates.io (edition2024). Pin cargo-build-sbf to 4.1.1 instead.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CARGO_BUILD_SBF="${CARGO_BUILD_SBF:-$HOME/.local/share/solana/install/releases/4.1.1/solana-release/bin/cargo-build-sbf}"

if [[ ! -x "$CARGO_BUILD_SBF" ]]; then
  echo "Missing cargo-build-sbf at $CARGO_BUILD_SBF"
  echo "Install with: curl -sSfL https://release.anza.xyz/stable/install | sh"
  exit 1
fi

export PATH="$(dirname "$CARGO_BUILD_SBF"):$HOME/.avm/bin:$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
cd "$ROOT"

echo "→ building with $($CARGO_BUILD_SBF --version 2>/dev/null | head -1)"
"$CARGO_BUILD_SBF" --manifest-path programs/midway-treasury/Cargo.toml

# Mirror artifact into target/deploy for Anchor-compatible layout
mkdir -p target/deploy
SO="$(find target -name 'midway_treasury.so' ! -path '*/deploy/*' | head -1)"
if [[ -n "$SO" && "$SO" != "target/deploy/midway_treasury.so" ]]; then
  cp -f "$SO" target/deploy/midway_treasury.so
fi
if [[ -f target/deploy/midway_treasury.so ]]; then
  echo "→ target/deploy/midway_treasury.so ($(wc -c < target/deploy/midway_treasury.so | tr -d ' ') bytes)"
else
  echo "✗ midway_treasury.so not found" >&2
  exit 1
fi
