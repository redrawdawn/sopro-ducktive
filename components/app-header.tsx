"use client";

import { usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  function openSettings() {
    if (pathname !== "/dashboard") {
      window.sessionStorage.setItem("motive-open-settings", "true");
      router.push("/dashboard");
      return;
    }

    window.dispatchEvent(new Event("sopro-open-settings"));
  }

  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="app-brand">Motive</div>
      <button
        type="button"
        onClick={openSettings}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  );
}
