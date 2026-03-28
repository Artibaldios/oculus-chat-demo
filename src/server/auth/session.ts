import "server-only";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getRequestUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (
      error.name === "AuthSessionMissingError" ||
      error.message.toLowerCase().includes("auth session missing")
    ) {
      return null;
    }

    throw error;
  }

  return user;
}

export async function requireRequestUser(): Promise<User> {
  const user = await getRequestUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}
