"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const supabase = createClient();

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
          });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Check your email, then log in.");
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  async function sendPasswordReset(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setMessage("Enter your email first.");
      return;
    }

    setResetLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
    });

    setResetLoading(false);
    setMessage(error ? error.message : "Password reset email sent.");
  }

  return (
    <Card className="neon-card w-full">
      <CardHeader>
        <div className="mb-3 h-14 w-14 rounded-full border border-white/10 bg-muted shadow-inner" aria-label="Profile icon placeholder" />
        <CardTitle className="text-2xl">{mode === "login" ? "Log in" : "Sign up"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} />
          </div>
          {message ? <p className="rounded-xl border border-white/10 bg-muted p-3 text-sm text-muted-foreground">{message}</p> : null}
          <Button className="w-full rounded-2xl" type="submit" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
          </Button>
          {mode === "login" ? (
            <Button
              className="w-full rounded-2xl"
              type="button"
              variant="outline"
              disabled={resetLoading}
              onClick={sendPasswordReset}
            >
              {resetLoading ? "Sending..." : "Forgot password"}
            </Button>
          ) : null}
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link className="font-semibold text-primary" href={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Sign up" : "Log in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
