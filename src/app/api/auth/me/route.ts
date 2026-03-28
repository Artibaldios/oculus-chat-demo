import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/server/auth/profile";
import { getRequestUser } from "@/server/auth/session";
import { jsonError, safeErrorMessage } from "@/server/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getRequestUser();

    if (user) {
      await ensureUserProfile(user);
    }

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email ?? "" } : null,
    });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
