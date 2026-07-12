import type { Metadata } from "next";
import { JetBrains_Mono, Pixelify_Sans, Silkscreen, VT323 } from "next/font/google";
import "./globals.css";
import { OsProvider } from "@/components/os/OsContext";
import { DitherFilter } from "@/components/os/DitherFilter";

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

export const metadata: Metadata = {
  title: "MIDWAY OS — every cut comes home",
  description:
    "Haunted 8-bit boardwalk arcade. Every cut comes home — burn, believers, build.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${silkscreen.variable} ${pixelify.variable} ${vt323.variable} ${mono.variable}`}
      >
        <DitherFilter />
        <OsProvider>
          <div className="crt-scanlines" aria-hidden />
          <div className="crt-vignette" aria-hidden />
          <div className="crt-grain" aria-hidden />
          {children}
        </OsProvider>
      </body>
    </html>
  );
}
