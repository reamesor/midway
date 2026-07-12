import { NextResponse } from "next/server";
import { getSolanaEndpoint } from "@/lib/solana/cluster";
import {
  resolveMediaUri,
  type WalletNftItem,
} from "@/lib/profile/avatar";

type DasAsset = {
  id?: string;
  content?: {
    json_uri?: string;
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
    files?: Array<{ uri?: string; cdn_uri?: string; mime?: string }>;
  };
  grouping?: Array<{ group_key?: string; group_value?: string }>;
};

function serverRpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
    getSolanaEndpoint()
  );
}

function pickImage(asset: DasAsset): string | null {
  const links = asset.content?.links?.image?.trim();
  if (links) return resolveMediaUri(links);
  const files = asset.content?.files ?? [];
  for (const f of files) {
    const uri = (f.cdn_uri || f.uri || "").trim();
    if (!uri) continue;
    if (f.mime && !f.mime.startsWith("image/") && !f.mime.includes("json")) {
      continue;
    }
    return resolveMediaUri(uri);
  }
  return null;
}

/**
 * List image NFTs for a wallet via DAS `getAssetsByOwner`.
 * Requires an RPC that supports Metaplex DAS (e.g. Helius). Public
 * clusterApiUrl endpoints typically return method-not-found — we surface that.
 */
export async function GET(req: Request) {
  const owner = new URL(req.url).searchParams.get("owner")?.trim();
  if (!owner || owner.length < 32 || owner.length > 64) {
    return NextResponse.json({ error: "owner pubkey required" }, { status: 400 });
  }

  const rpc = serverRpcUrl();
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") || 1));
  const limit = Math.min(
    50,
    Math.max(1, Number(new URL(req.url).searchParams.get("limit") || 24)),
  );

  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "midway-nfts",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: owner,
          page,
          limit,
          sortBy: { sortBy: "created", sortDirection: "desc" },
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
            showCollectionMetadata: true,
          },
        },
      }),
      // Avoid hanging the profile panel forever.
      signal: AbortSignal.timeout(12_000),
    });

    const json = (await res.json()) as {
      result?: { items?: DasAsset[]; total?: number };
      error?: { message?: string; code?: number };
    };

    if (json.error) {
      const msg = json.error.message || "RPC error";
      const unsupported =
        /method not found|not supported|invalid|unknown method/i.test(msg) ||
        json.error.code === -32601;
      return NextResponse.json({
        owner,
        nfts: [] as WalletNftItem[],
        total: 0,
        unsupported,
        message: unsupported
          ? "NFT listing needs a DAS-capable RPC (e.g. Helius). Set NEXT_PUBLIC_SOLANA_RPC."
          : msg,
      });
    }

    const items = json.result?.items ?? [];
    const nfts: WalletNftItem[] = [];
    for (const asset of items) {
      const mint = typeof asset.id === "string" ? asset.id : "";
      if (!mint) continue;
      const imageUri = pickImage(asset);
      if (!imageUri) continue;
      const name =
        asset.content?.metadata?.name?.trim() ||
        `${mint.slice(0, 4)}…${mint.slice(-4)}`;
      const col = asset.grouping?.find((g) => g.group_key === "collection");
      nfts.push({
        mint,
        name: name.slice(0, 64),
        imageUri,
        collectionName: col?.group_value,
      });
    }

    return NextResponse.json({
      owner,
      nfts,
      total: json.result?.total ?? nfts.length,
      unsupported: false,
      message: nfts.length === 0 ? "No image NFTs found for this wallet." : null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch wallet NFTs";
    return NextResponse.json(
      {
        owner,
        nfts: [] as WalletNftItem[],
        total: 0,
        unsupported: false,
        message,
      },
      { status: 502 },
    );
  }
}
