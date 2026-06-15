import Link from "next/link";
import type { Route } from "next";
import { Home, ListChecks, Trophy, Users } from "lucide-react";
import { brand } from "@/lib/brand";

const items: Array<{ href: Route; label: string; icon: typeof Home }> = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/quests", label: "Quests", icon: ListChecks },
  { href: "/achievements", label: "Awards", icon: Trophy },
  { href: "/household", label: "Household", icon: Users }
];

export function Navigation() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-base font-black">
            {brand.casualName}
          </Link>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
            Sopro awaits
          </span>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground">
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
