import { Navigation } from "@/components/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <Navigation />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">{children}</main>
    </div>
  );
}
