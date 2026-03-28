import { NextResponse } from "next/server";
import { requireRequestUser } from "@/server/auth/session";
import { jsonError, safeErrorMessage } from "@/server/http";
import { deleteChat, getChatById } from "@/server/services/chat-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRequestUser();
    const chat = await getChatById(id, user.id);

    if (!chat) {
      return jsonError("Chat not found", 404);
    }

    return NextResponse.json({ chat });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRequestUser();
    await deleteChat(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
