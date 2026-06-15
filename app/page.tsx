import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-10">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
            RPG progress for real life
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Sopro Ducktive
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground sm:text-xl">
            Turn chores, goals, habits, and household routines into quests with XP, levels, and achievements.
            Built for couples first, ready for families and groups later.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start questing <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { icon: CheckCircle2, title: "Quest Logs", body: "Daily, weekly, and one-time quests with configurable XP." },
            { icon: Trophy, title: "Levels", body: "XP progress and level milestones that make effort visible." },
            { icon: Sparkles, title: "Achievements", body: "Automatic unlocks that celebrate household momentum." }
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <item.icon className="h-7 w-7 text-primary" />
                <h2 className="mt-4 font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
