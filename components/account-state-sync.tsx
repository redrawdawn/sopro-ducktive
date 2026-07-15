"use client";

import { useEffect } from "react";
import { restoreMotiveStateFromBackup } from "@/lib/motive-backup";

export function AccountStateSync() {
  useEffect(() => {
    let refreshing = false;

    async function refreshFromCloud(preferCloud = false) {
      if (refreshing) {
        return;
      }

      refreshing = true;

      try {
        await restoreMotiveStateFromBackup({ preferCloud });
      } finally {
        refreshing = false;
      }
    }

    void refreshFromCloud(true);

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

  return null;
}
