import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 font-black text-secondary-foreground", className)}>
      <Shield className="h-4 w-4" />
      Level {level}
    </div>
  );
}
