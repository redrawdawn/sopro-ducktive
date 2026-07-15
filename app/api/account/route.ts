import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function DELETE() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "You must be logged in to delete your account." }, { status: 401 });
  }

  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Account deletion is not configured." }, { status: 500 });
  }

  const admin = createAdminClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
