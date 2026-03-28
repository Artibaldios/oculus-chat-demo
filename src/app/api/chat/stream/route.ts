import { getRequestUser } from "@/server/auth/session";
import { jsonError, safeErrorMessage } from "@/server/http";
import {
  createAssistantReplyStream,
  createEphemeralAssistantReplyStream,
} from "@/server/services/stream-service";
import { chatReplySchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = chatReplySchema.parse(await request.json());
    const user = await getRequestUser();
    const result = user
      ? await createAssistantReplyStream({
          chatId: payload.chatId,
          userId: user.id,
          content: payload.content,
          fileIds: payload.fileIds,
        })
      : await createEphemeralAssistantReplyStream({
          chatId: payload.chatId,
          content: payload.content,
          history: payload.history,
        });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        };

        void (async () => {
          let content = "";

          try {
            for await (const chunk of result.stream) {
              content += chunk;
              sendEvent("chunk", { delta: chunk, content });
            }

            const message = await result.finalize(content);
            sendEvent("done", { message });
          } catch (error) {
            sendEvent("error", { error: safeErrorMessage(error) });
          } finally {
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
    });
  } catch (error) {
    return jsonError(safeErrorMessage(error), 400);
  }
}
