import { NextResponse } from "next/server";
import { requireRequestUser } from "@/server/auth/session";
import { jsonError, safeErrorMessage } from "@/server/http";
import { createChat, listChats } from "@/server/services/chat-service";
import { createChatSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireRequestUser();
    const chats = await listChats(user.id);
    return NextResponse.json({ chats });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRequestUser();
    const payload = createChatSchema.parse(await request.json().catch(() => ({})));
    const chat = await createChat(user.id, payload.firstMessage);
    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
