import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="app-shell flex flex-col justify-between">
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-black shadow-lg shadow-primary/30">
            <Shield className="h-4 w-4" />
            Level 1
          </div>
          <div className="h-12 w-12 rounded-full border border-white/10 bg-muted shadow-inner" aria-label="Profile icon placeholder" />
        </div>

        <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/45 via-purple-950 to-card p-6 shadow-2xl shadow-primary/20">
          <p className="text-sm font-bold text-purple-200">Motive</p>
          <h1 className="mt-3 text-4xl font-black leading-tight">Quests. XP. Rewards.</h1>
          <div className="mt-6 h-3 rounded-full bg-black/30">
            <div className="h-3 w-2/3 rounded-full bg-gradient-to-r from-secondary to-orange-500" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Button asChild size="lg" className="w-full rounded-2xl bg-primary text-base shadow-lg shadow-primary/30">
          <Link href="/signup">
            Sign up <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full rounded-2xl border-white/10 bg-card text-base">
          <Link href="/login">Log in</Link>
        </Button>
      </section>
    </main>
  );
}
