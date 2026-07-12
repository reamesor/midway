import { OsProvider } from "@/components/os/OsContext";
import { SolanaProviderGate } from "@/components/wallet/SolanaProviderGate";
import "../globals.css";

export default function ColorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dark">
      <SolanaProviderGate>
        <OsProvider>{children}</OsProvider>
      </SolanaProviderGate>
    </div>
  );
}
