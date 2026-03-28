import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, safeErrorMessage } from "@/server/http";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
