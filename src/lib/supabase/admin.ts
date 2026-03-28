import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getAdminSupabaseClient() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      env.nextPublicSupabaseUrl(),
      env.supabaseServiceRoleKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient;
}
