import { BottomMenu } from "@/components/bottom-menu";
import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AppHeader />
      <main>{children}</main>
      <BottomMenu />
    </div>
  );
}
