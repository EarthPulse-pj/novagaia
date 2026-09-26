import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function isAdmin() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return false;
  }

  const claims = data.claims;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  const userEmail =
    typeof claims.email === "string"
      ? claims.email.trim().toLowerCase()
      : "";

  if (!adminEmail || !userEmail) {
    return false;
  }

  return userEmail === adminEmail;
}