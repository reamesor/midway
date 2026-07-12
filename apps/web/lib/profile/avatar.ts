import { COLOR_KEYS, type ColorKey } from "@/lib/colors/engine";
import { IDLE_CUBE_CHARS, idleCharPalette } from "@/lib/idleCubeChars";

/** Pixel accessory overlays (same 12×12 grid as mascots; empty = transparent). */
export const AVATAR_ACCESSORIES = ["none", "cap", "bow", "star"] as const;
export type AvatarAccessory = (typeof AVATAR_ACCESSORIES)[number];

export const AVATAR_OUTLINES = ["sage", "ink", "warm"] as const;
export type AvatarOutline = (typeof AVATAR_OUTLINES)[number];

export type CharacterAvatar = {
  kind: "character";
  character: ColorKey;
  accessory: AvatarAccessory;
  outline: AvatarOutline;
};

export type NftAvatar = {
  kind: "nft";
  mint: string;
  imageUri: string;
  name?: string;
};

export type ProfileAvatar = CharacterAvatar | NftAvatar;

export const DEFAULT_AVATAR: CharacterAvatar = {
  kind: "character",
  character: "yellow",
  accessory: "none",
  outline: "sage",
};

export const ACCESSORY_LABEL: Record<AvatarAccessory, string> = {
  none: "NONE",
  cap: "CAP",
  bow: "BOW",
  star: "STAR",
};

export const OUTLINE_LABEL: Record<AvatarOutline, string> = {
  sage: "SAGE",
  ink: "INK",
  warm: "WARM",
};

const OUTLINE_HEX: Record<AvatarOutline, string> = {
  sage: "#2f5a38",
  ink: "#1a241c",
  warm: "#9a6b2f",
};

/** Sparse overlays — A = accessory fill. */
export const ACCESSORY_GRIDS: Record<
  Exclude<AvatarAccessory, "none">,
  string[]
> = {
  cap: [
    "............",
    "....AAAA....",
    "...A....A...",
    "..AAAAAAAA..",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  bow: [
    "............",
    "..AA....AA..",
    ".A..A..A..A.",
    "..AA.AA.AA..",
    "....AAAA....",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  star: [
    "............",
    ".....A......",
    "....AAA.....",
    "..AAAAAAA...",
    "....AAA.....",
    "...A...A....",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
};

const ACCESSORY_FILL: Record<Exclude<AvatarAccessory, "none">, string> = {
  cap: "#c08a2e",
  bow: "#e86b8a",
  star: "#e8d24a",
};

function isColorKey(v: unknown): v is ColorKey {
  return typeof v === "string" && (COLOR_KEYS as readonly string[]).includes(v);
}

function isAccessory(v: unknown): v is AvatarAccessory {
  return (
    typeof v === "string" &&
    (AVATAR_ACCESSORIES as readonly string[]).includes(v)
  );
}

function isOutline(v: unknown): v is AvatarOutline {
  return (
    typeof v === "string" && (AVATAR_OUTLINES as readonly string[]).includes(v)
  );
}

/** Normalize unknown JSON into a ProfileAvatar (or default). */
export function normalizeAvatar(raw: unknown): ProfileAvatar {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_AVATAR };
  const o = raw as Record<string, unknown>;
  if (o.kind === "nft") {
    const mint = typeof o.mint === "string" ? o.mint.trim() : "";
    const imageUri = typeof o.imageUri === "string" ? o.imageUri.trim() : "";
    if (!mint || !imageUri) return { ...DEFAULT_AVATAR };
    const name = typeof o.name === "string" ? o.name.slice(0, 64) : undefined;
    return { kind: "nft", mint, imageUri, name };
  }
  if (o.kind === "character" || o.character != null) {
    return {
      kind: "character",
      character: isColorKey(o.character) ? o.character : DEFAULT_AVATAR.character,
      accessory: isAccessory(o.accessory) ? o.accessory : "none",
      outline: isOutline(o.outline) ? o.outline : "sage",
    };
  }
  return { ...DEFAULT_AVATAR };
}

export function characterGrid(avatar: CharacterAvatar): string[] {
  return IDLE_CUBE_CHARS[avatar.character];
}

export function characterPalette(avatar: CharacterAvatar) {
  return idleCharPalette(avatar.character, OUTLINE_HEX[avatar.outline]);
}

export function accessoryPalette(
  accessory: Exclude<AvatarAccessory, "none">,
): Record<string, string> {
  return { A: ACCESSORY_FILL[accessory] };
}

/** Rewrite ipfs/arweave URIs for browser <img>. */
export function resolveMediaUri(uri: string): string {
  const u = uri.trim();
  if (!u) return u;
  if (u.startsWith("ipfs://")) {
    const path = u.slice("ipfs://".length).replace(/^ipfs\//, "");
    return `https://ipfs.io/ipfs/${path}`;
  }
  if (u.startsWith("ar://")) {
    return `https://arweave.net/${u.slice("ar://".length)}`;
  }
  return u;
}

export function avatarLabel(avatar: ProfileAvatar): string {
  if (avatar.kind === "nft") {
    return avatar.name?.trim() || `NFT · ${avatar.mint.slice(0, 4)}…`;
  }
  return `${avatar.character.toUpperCase()} · ${ACCESSORY_LABEL[avatar.accessory]}`;
}

/** NFT row returned by `/api/wallet/nfts`. */
export type WalletNftItem = {
  mint: string;
  name: string;
  imageUri: string;
  collectionName?: string;
};
