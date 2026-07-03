"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setLoading(false);
      setMessage("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated.");
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <main className="app-shell flex items-center justify-center">
      <Card className="neon-card w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={updatePassword}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            {message ? <p className="rounded-xl border border-white/10 bg-muted p-3 text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full rounded-2xl" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
