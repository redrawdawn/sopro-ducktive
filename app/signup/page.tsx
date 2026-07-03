import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell flex items-center justify-center">
      <AuthForm mode="signup" />
    </main>
  );
}
