"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Motive app error", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-4 text-center">
      <div className="neon-card max-w-sm rounded-3xl p-5">
        <h1 className="text-2xl font-black">Something got stuck</h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Your progress is still saved locally. Try reloading this page.
        </p>
        <Button type="button" className="mt-4 w-full" onClick={reset}>
          Reload
        </Button>
      </div>
    </div>
  );
}
