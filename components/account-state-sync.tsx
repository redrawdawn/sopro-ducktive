"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ensureInitialMotiveStateRestore, restoreMotiveStateFromBackup } from "@/lib/motive-backup";

export function AccountStateSync() {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    let refreshing = false;

    async function refreshFromCloud(preferCloud = false) {
      if (refreshing) {
        return;
      }

      refreshing = true;

      try {
        if (preferCloud) {
          await ensureInitialMotiveStateRestore();
        } else {
          await restoreMotiveStateFromBackup();
        }
      } finally {
        refreshing = false;
      }
    }

    void refreshFromCloud(true).finally(() => setInitialLoadComplete(true));

    function handleFocus() {
      void refreshFromCloud();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshFromCloud();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (initialLoadComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/30 bg-card shadow-2xl shadow-primary/20">
        <LoaderCircle className="h-9 w-9 animate-spin text-primary" aria-hidden="true" />
      </div>
      <div className="text-center">
        <div className="text-lg font-black">Loading Motive</div>
        <div className="mt-1 text-xs font-semibold text-muted-foreground">Getting your tasks ready...</div>
      </div>
      <span className="sr-only" role="status">Loading your Motive data</span>
    </div>
  );
}
