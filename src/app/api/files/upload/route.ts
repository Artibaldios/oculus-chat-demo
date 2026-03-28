import { NextResponse } from "next/server";
import { requireRequestUser } from "@/server/auth/session";
import { jsonError, safeErrorMessage } from "@/server/http";
import { uploadFileForUser } from "@/server/services/file-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireRequestUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (
      !file ||
      typeof file !== "object" ||
      !("arrayBuffer" in file) ||
      !("name" in file)
    ) {
      return jsonError("A file field is required", 400);
    }

    const uploadedFile = await uploadFileForUser(user.id, file as File);
    return NextResponse.json({ file: uploadedFile }, { status: 201 });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
