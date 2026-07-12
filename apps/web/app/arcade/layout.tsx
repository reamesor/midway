import {
  JetBrains_Mono,
  Pixelify_Sans,
  Silkscreen,
  VT323,
} from "next/font/google";
import { AmbientSound } from "@/components/os/AmbientSound";
import { OsProvider } from "@/components/os/OsContext";
import { DitherFilter } from "@/components/os/DitherFilter";
import { SolanaProviderGate } from "@/components/wallet/SolanaProviderGate";
import "../globals.css";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
  display: "swap",
});

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify",
  display: "swap",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function ArcadeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`arcade-shell ${silkscreen.variable} ${pixelify.variable} ${vt323.variable} ${mono.variable}`}
    >
      <DitherFilter />
      <SolanaProviderGate>
        <OsProvider>
          <AmbientSound />
          <div className="crt-scanlines" aria-hidden />
          <div className="crt-vignette" aria-hidden />
          <div className="crt-grain" aria-hidden />
          {children}
        </OsProvider>
      </SolanaProviderGate>
    </div>
  );
}
