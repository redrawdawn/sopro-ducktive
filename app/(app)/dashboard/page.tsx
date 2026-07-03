import { redirect } from "next/navigation";
import { DailyDashboard } from "@/components/daily-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <DailyDashboard />;
}
