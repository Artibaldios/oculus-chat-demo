import { NextResponse } from "next/server";
import { requireRequestUser } from "@/server/auth/session";
import { jsonError, safeErrorMessage } from "@/server/http";
import { createMessage, listMessages } from "@/server/services/message-service";
import { createMessageSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRequestUser();
    const messages = await listMessages(id, user.id);
    return NextResponse.json({ messages });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRequestUser();
    const payload = createMessageSchema.parse(await request.json());
    const message = await createMessage({
      chatId: id,
      userId: user.id,
      role: "user",
      content: payload.content,
      fileIds: payload.fileIds,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
