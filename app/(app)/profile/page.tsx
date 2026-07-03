import { redirect } from "next/navigation";
import { ProfilePage } from "@/components/profile-page";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileRoute() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <ProfilePage />;
}
