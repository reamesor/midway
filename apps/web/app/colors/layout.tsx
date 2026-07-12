import { OsProvider } from "@/components/os/OsContext";
import "../globals.css";

export default function ColorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dark">
      <OsProvider>{children}</OsProvider>
    </div>
  );
}
