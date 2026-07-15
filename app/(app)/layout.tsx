import { BottomMenu } from "@/components/bottom-menu";
import { AppHeader } from "@/components/app-header";
import { AccountStateSync } from "@/components/account-state-sync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AccountStateSync />
      <AppHeader />
      <main>{children}</main>
      <BottomMenu />
    </div>
  );
}
