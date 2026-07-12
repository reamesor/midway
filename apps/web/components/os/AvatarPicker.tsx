"use client";

import { useCallback, useEffect, useState } from "react";
import { COLOR_KEYS, COLOR_LABEL, type ColorKey } from "@/lib/colors/engine";
import { ProfileAvatarView } from "@/components/os/ProfileAvatarView";
import {
  ACCESSORY_LABEL,
  AVATAR_ACCESSORIES,
  AVATAR_OUTLINES,
  DEFAULT_AVATAR,
  OUTLINE_LABEL,
  type AvatarAccessory,
  type AvatarOutline,
  type CharacterAvatar,
  type NftAvatar,
  type ProfileAvatar,
  type WalletNftItem,
} from "@/lib/profile/avatar";
import { DEMO_GUEST_PUBKEY } from "@/components/wallet/DemoGuestContext";

type AvatarPickerProps = {
  pubkey: string | null;
  /** Active profile avatar (persisted). */
  avatar: ProfileAvatar;
  onSave: (avatar: ProfileAvatar) => { ok: true } | { ok: false; error: string };
  /** Wallet used for NFT ownership (extension or active real pubkey). */
  nftOwner: string | null;
  onStatus?: (msg: string | null) => void;
  onError?: (msg: string | null) => void;
};

type Mode = "character" | "nft";

/**
 * PROFILE display-picture picker: Midway pixel mascot (+ light customize)
 * or an image NFT from the connected wallet.
 */
export function AvatarPicker({
  pubkey,
  avatar,
  onSave,
  nftOwner,
  onStatus,
  onError,
}: AvatarPickerProps) {
  const [mode, setMode] = useState<Mode>(
    avatar.kind === "nft" ? "nft" : "character",
  );
  const [draft, setDraft] = useState<CharacterAvatar>(() =>
    avatar.kind === "character" ? avatar : { ...DEFAULT_AVATAR },
  );
  const [nfts, setNfts] = useState<WalletNftItem[]>([]);
  const [nftLoading, setNftLoading] = useState(false);
  const [nftMessage, setNftMessage] = useState<string | null>(null);
  const [nftUnsupported, setNftUnsupported] = useState(false);

  useEffect(() => {
    if (avatar.kind === "character") {
      setDraft(avatar);
      setMode("character");
    } else {
      setMode("nft");
    }
  }, [avatar, pubkey]);

  const loadNfts = useCallback(async () => {
    if (!nftOwner || nftOwner === DEMO_GUEST_PUBKEY) {
      setNfts([]);
      setNftUnsupported(false);
      setNftMessage("Connect a Solana wallet to pick an NFT avatar.");
      return;
    }
    setNftLoading(true);
    setNftMessage(null);
    setNftUnsupported(false);
    try {
      const res = await fetch(
        `/api/wallet/nfts?owner=${encodeURIComponent(nftOwner)}&limit=24`,
      );
      const json = (await res.json()) as {
        nfts?: WalletNftItem[];
        message?: string | null;
        unsupported?: boolean;
      };
      setNfts(json.nfts ?? []);
      setNftUnsupported(Boolean(json.unsupported));
      setNftMessage(json.message ?? null);
    } catch {
      setNfts([]);
      setNftMessage("Could not load NFTs. Try again.");
    } finally {
      setNftLoading(false);
    }
  }, [nftOwner]);

  useEffect(() => {
    if (mode === "nft") void loadNfts();
  }, [mode, loadNfts]);

  const pickCharacter = (character: ColorKey) => {
    setDraft((d) => ({ ...d, kind: "character", character }));
    onError?.(null);
  };

  const pickAccessory = (accessory: AvatarAccessory) => {
    setDraft((d) => ({ ...d, accessory }));
    onError?.(null);
  };

  const pickOutline = (outline: AvatarOutline) => {
    setDraft((d) => ({ ...d, outline }));
    onError?.(null);
  };

  const saveCharacter = () => {
    if (!pubkey) {
      onError?.("Connect or play demo first.");
      return;
    }
    const res = onSave(draft);
    if (!res.ok) onError?.(res.error);
    else onStatus?.("Avatar saved.");
  };

  const saveNft = (item: WalletNftItem) => {
    if (!pubkey) {
      onError?.("Connect or play demo first.");
      return;
    }
    const next: NftAvatar = {
      kind: "nft",
      mint: item.mint,
      imageUri: item.imageUri,
      name: item.name,
    };
    const res = onSave(next);
    if (!res.ok) onError?.(res.error);
    else {
      setMode("nft");
      onStatus?.(`NFT avatar · ${item.name}`);
    }
  };

  const clearToDefault = () => {
    if (!pubkey) return;
    const res = onSave({ ...DEFAULT_AVATAR });
    if (res.ok) {
      setDraft({ ...DEFAULT_AVATAR });
      setMode("character");
      onStatus?.("Avatar reset to Midway character.");
    }
  };

  return (
    <section className="bevel-inset p-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-heading text-[10px] tracking-wide text-ink-dim">
            AVATAR · DISPLAY PICTURE
          </div>
          <p className="mt-0.5 font-sans text-[11px] normal-case tracking-normal text-ink-dim">
            Cosmetic only · Midway mascot or wallet NFT · saved per wallet
          </p>
        </div>
        <ProfileAvatarView avatar={avatar} size={56} px={3} />
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={`bevel-btn px-2 py-1 text-[10px] ${
            mode === "character" ? "bevel-btn-hot" : ""
          }`}
          onClick={() => setMode("character")}
        >
          MIDWAY CHARACTER
        </button>
        <button
          type="button"
          className={`bevel-btn px-2 py-1 text-[10px] ${
            mode === "nft" ? "bevel-btn-hot" : ""
          }`}
          onClick={() => setMode("nft")}
        >
          NFT FROM WALLET
        </button>
        <button
          type="button"
          className="bevel-btn px-2 py-1 text-[10px] text-ink-dim"
          onClick={clearToDefault}
          disabled={!pubkey}
        >
          RESET
        </button>
      </div>

      {mode === "character" && (
        <div className="space-y-2">
          <div className="font-heading text-[9px] tracking-wide text-ink-dim">
            CHARACTER
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_KEYS.map((key) => {
              const preview: CharacterAvatar = { ...draft, character: key };
              const selected = draft.character === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`bevel-btn p-1 ${selected ? "bevel-btn-hot" : ""}`}
                  title={COLOR_LABEL[key]}
                  onClick={() => pickCharacter(key)}
                  aria-pressed={selected}
                >
                  <ProfileAvatarView avatar={preview} size={36} px={2} />
                </button>
              );
            })}
          </div>

          <div className="font-heading text-[9px] tracking-wide text-ink-dim">
            ACCESSORY
          </div>
          <div className="flex flex-wrap gap-1">
            {AVATAR_ACCESSORIES.map((a) => (
              <button
                key={a}
                type="button"
                className={`bevel-btn px-2 py-1 text-[10px] ${
                  draft.accessory === a ? "bevel-btn-hot" : ""
                }`}
                onClick={() => pickAccessory(a)}
              >
                {ACCESSORY_LABEL[a]}
              </button>
            ))}
          </div>

          <div className="font-heading text-[9px] tracking-wide text-ink-dim">
            OUTLINE
          </div>
          <div className="flex flex-wrap gap-1">
            {AVATAR_OUTLINES.map((o) => (
              <button
                key={o}
                type="button"
                className={`bevel-btn px-2 py-1 text-[10px] ${
                  draft.outline === o ? "bevel-btn-hot" : ""
                }`}
                onClick={() => pickOutline(o)}
              >
                {OUTLINE_LABEL[o]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ProfileAvatarView avatar={draft} size={48} px={3} />
            <button
              type="button"
              className="bevel-btn bevel-btn-hot px-3 py-1.5"
              disabled={!pubkey}
              onClick={saveCharacter}
            >
              SAVE CHARACTER
            </button>
          </div>
        </div>
      )}

      {mode === "nft" && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-heading text-[9px] tracking-wide text-ink-dim">
              WALLET NFTS
            </div>
            <button
              type="button"
              className="bevel-btn px-2 py-1 text-[10px]"
              disabled={nftLoading || !nftOwner || nftOwner === DEMO_GUEST_PUBKEY}
              onClick={() => void loadNfts()}
            >
              {nftLoading ? "LOADING…" : "REFRESH"}
            </button>
          </div>

          {nftUnsupported && (
            <p className="font-sans text-[11px] normal-case tracking-normal text-cyber">
              {nftMessage ||
                "DAS RPC required to list NFTs. Character avatars still work."}
            </p>
          )}
          {!nftUnsupported && nftMessage && nfts.length === 0 && !nftLoading && (
            <p className="font-sans text-[11px] normal-case tracking-normal text-ink-dim">
              {nftMessage}
            </p>
          )}
          {nftLoading && (
            <p className="font-sans text-[11px] normal-case text-ink-dim">
              Scanning wallet NFTs…
            </p>
          )}

          {nfts.length > 0 && (
            <ul className="grid max-h-44 grid-cols-4 gap-1.5 overflow-auto sm:grid-cols-6">
              {nfts.map((item) => {
                const selected =
                  avatar.kind === "nft" && avatar.mint === item.mint;
                return (
                  <li key={item.mint}>
                    <button
                      type="button"
                      className={`bevel-btn w-full p-0.5 ${
                        selected ? "bevel-btn-hot" : ""
                      }`}
                      title={item.name}
                      onClick={() => saveNft(item)}
                      aria-pressed={selected}
                    >
                      <ProfileAvatarView
                        avatar={{
                          kind: "nft",
                          mint: item.mint,
                          imageUri: item.imageUri,
                          name: item.name,
                        }}
                        size={44}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {avatar.kind === "nft" && (
            <p className="font-mono text-[10px] text-ink-dim break-all">
              Active mint · {avatar.mint}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
