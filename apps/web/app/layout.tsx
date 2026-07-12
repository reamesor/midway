import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MIDWAY — every cut comes home",
  description:
    "The boardwalk, rebuilt honest. Play, mint, trade — the house cut flows back to everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#e9e6df" }}>{children}</body>
    </html>
  );
}
