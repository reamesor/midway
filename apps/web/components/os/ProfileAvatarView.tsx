"use client";

import { PixelIcon } from "@/lib/pixel";
import {
  ACCESSORY_GRIDS,
  accessoryPalette,
  avatarLabel,
  characterGrid,
  characterPalette,
  resolveMediaUri,
  type ProfileAvatar,
} from "@/lib/profile/avatar";

type ProfileAvatarViewProps = {
  avatar: ProfileAvatar;
  /** Pixel cell size for character mode. */
  px?: number;
  /** CSS size for the frame (e.g. 40, 56). */
  size?: number;
  className?: string;
  title?: string;
};

/** Renders Midway character (pixel) or NFT image as display picture. */
export function ProfileAvatarView({
  avatar,
  px = 3,
  size = 48,
  className = "",
  title,
}: ProfileAvatarViewProps) {
  const label = title ?? avatarLabel(avatar);

  if (avatar.kind === "nft") {
    const src = resolveMediaUri(avatar.imageUri);
    return (
      <span
        className={`inline-block overflow-hidden border-2 border-line bg-panel ${className}`}
        style={{ width: size, height: size, imageRendering: "pixelated" }}
        title={label}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          style={{ imageRendering: "pixelated" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.35";
          }}
        />
      </span>
    );
  }

  const grid = characterGrid(avatar);
  const palette = characterPalette(avatar);
  const accessory =
    avatar.accessory !== "none" ? avatar.accessory : null;

  return (
    <span
      className={`relative inline-grid place-items-center overflow-hidden border-2 border-line bg-panel ${className}`}
      style={{ width: size, height: size }}
      title={label}
    >
      <PixelIcon
        grid={grid}
        palette={palette}
        px={px}
        style={{ width: size - 4, height: size - 4 }}
      />
      {accessory && (
        <PixelIcon
          grid={ACCESSORY_GRIDS[accessory]}
          palette={accessoryPalette(accessory)}
          px={px}
          className="pointer-events-none absolute inset-0.5"
          style={{ width: size - 4, height: size - 4 }}
        />
      )}
    </span>
  );
}
