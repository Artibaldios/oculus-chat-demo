import "server-only";
import type { User } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function ensureUserProfile(user: User) {
  const email = user.email ?? "";

  if (!email) {
    return;
  }

  const admin = getAdminSupabaseClient();
  const { error } = await admin.from("users").upsert({
    id: user.id,
    email,
  });

  if (error) {
    throw error;
  }
}
