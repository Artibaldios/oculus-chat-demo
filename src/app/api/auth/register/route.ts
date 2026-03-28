import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, safeErrorMessage } from "@/server/http";
import { authSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = authSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp(payload);

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({
      user: data.user ? { id: data.user.id, email: data.user.email ?? "" } : null,
      needsEmailConfirmation: !data.session,
    });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
