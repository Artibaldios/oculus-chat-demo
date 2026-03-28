# Oculus Chat

ChatGPT-style chat app built with Next.js App Router, Supabase, OpenAI streaming, TanStack Query, Tailwind v4, and shadcn/ui.

## Features

- Streaming assistant responses via `/api/chat/stream`
- Supabase email/password auth via API route handlers
- Multi-chat history persisted in Postgres
- Anonymous local-only preview mode with a 3-message cap
- File uploads for images, TXT, and PDF
- Realtime chat/message sync across tabs

## Stack

- Next.js 16.2 App Router
- React 19
- Supabase Auth, Postgres, Storage, Realtime
- OpenAI Node SDK
- TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Vitest + Testing Library

## Environment Variables

Create `.env.local` from `.env.example`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_API_KEY=
AI_MODEL=
```

## Local Setup

1. Install dependencies.
   `npm install`
2. Create a Supabase project.
3. Run the SQL in [supabase/migrations/001_init.sql](/d:/D/2024React/chatbot/supabase/migrations/001_init.sql).
4. Create a Storage bucket named `chat-uploads`.
   Use a private bucket so signed URLs are generated server-side.
5. Add env vars to `.env.local`.
6. Start the app.
   `npm run dev`

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run build`

## Architecture

- `src/app` contains pages and Route Handlers.
- `src/components` contains the chat/auth UI.
- `src/lib/supabase` contains browser, server, and admin client helpers.
- `src/server/services` contains DB, upload, parsing, and LLM logic.

## API Surface

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:id`
- `DELETE /api/chats/:id`
- `GET /api/chats/:id/messages`
- `POST /api/chats/:id/messages`
- `POST /api/chat/stream`
- `POST /api/files/upload`

## Notes

- Anonymous chat uses browser localStorage and is not persisted.
- Browser Supabase usage is limited to auth session state and Realtime subscriptions.
- Server-side DB access uses the Supabase service role key and explicit user scoping.
