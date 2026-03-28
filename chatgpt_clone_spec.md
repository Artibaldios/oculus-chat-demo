# ChatGPT-like Chatbot --- Technical Specification

## 1. Overview

Build a web application that replicates a **ChatGPT-like conversational
interface** with support for:

-   Streaming AI responses\
-   Multi-chat history\
-   Authentication\
-   File/image input\
-   Context-aware conversations

The system must follow **strict separation of concerns**: - Client
(React) - API (Next.js REST) - Database (Postgres via Supabase)

------------------------------------------------------------------------

## 2. Functional Requirements

### 2.1 Chat System

-   User can:
    -   Create new chat
    -   Send messages
    -   Receive AI responses
-   Messages must:
    -   Persist in DB
    -   Be grouped by chat
-   AI responses:
    -   Be cancellable (optional bonus)

------------------------------------------------------------------------

### 2.2 LLM Integration

-   Support:
    -   At least one provider (OpenAI / Gemini / etc.)
    -   Optional: multi-provider abstraction layer
-   Features:
    -   Context injection (previous messages + uploaded docs)

------------------------------------------------------------------------

### 2.3 Chat History (Sidebar)

-   Left navigation:
    -   List of chats
    -   Chat titles (auto-generated or first message)
-   Features:
    -   Create / delete chats
    -   Persist in DB
    -   Sync across tabs in real-time

------------------------------------------------------------------------

### 2.4 Authentication

-   Users can:
    -   Register / log in / log out
-   Anonymous users:
    -   Allowed up to **3 free messages**
    -   Anonymous users are allowed up to 3 AI questions (real usage, not hardcoded)
    -   Then forced to sign up

------------------------------------------------------------------------

### 2.5 File & Image Support

-   User can:
    -   Upload images
    -   Upload documents (PDF, TXT, etc.)
-   Usage:
    -   Images → sent to LLM
    -   Documents → parsed and injected into prompt context

------------------------------------------------------------------------

### 2.6 Realtime Sync

-   New chats/messages:
    -   Sync across browser tabs
    -   Use Supabase Realtime 

------------------------------------------------------------------------

## 3. Non-Functional Requirements

-   Responsive UI (mobile + desktop)
-   Fast initial load (\<2s target)
-   Streaming latency \<500ms initial response
-   Clean UX:
    -   Loading states
    -   Empty states
    -   Error handling

------------------------------------------------------------------------

## 4. Architecture

### 4.1 High-Level

Client → API → Database → LLM Provider

------------------------------------------------------------------------

### 4.2 Key Principles

-   No DB access from client
-   No Supabase public client for DB
-   API layer handles all data access
-   Service role key used only on server
-   Realtime allowed via public client

------------------------------------------------------------------------

## 5. Frontend (Client)

### Stack

-   Next.js (App Router)
-   React
-   TanStack Query
-   Tailwind + Shadcn UI

------------------------------------------------------------------------

### 5.1 Pages

-   `/` → Chat UI
-   `/auth` → Login/Register

------------------------------------------------------------------------

### 5.2 Components

#### Core

-   ChatLayout
-   Sidebar (ChatList)
-   ChatWindow
-   MessageList
-   MessageInput

#### Supporting

-   FileUploader
-   EmptyState
-   LoadingIndicator
-   AuthGuard

------------------------------------------------------------------------

### 5.3 State Management

Use TanStack Query for: - Fetching chats - Fetching messages - Mutations

Local state: - Streaming buffer - Input field

------------------------------------------------------------------------

## 6. Backend (API)

-   Next.js (API)

### Base URL

/api

------------------------------------------------------------------------

### 6.1 Endpoints

#### Auth

-   POST /api/auth/login
-   POST /api/auth/register
-   POST /api/auth/logout
-   GET /api/auth/me

#### Chats

-   GET /api/chats
-   POST /api/chats
-   GET /api/chats/:id
-   DELETE /api/chats/:id

#### Messages

-   GET /api/chats/:id/messages
-   POST /api/chats/:id/messages

#### Streaming

-   POST /api/chat/stream

#### Files

-   POST /api/files/upload

------------------------------------------------------------------------

### 6.2 LLM Abstraction

``` ts
interface LLMProvider {
  streamCompletion(input): AsyncIterable<string>;
}
```

------------------------------------------------------------------------

## 7. Database Design

### Tables

#### users

-   id (uuid)
-   email
-   created_at

#### chats

-   id
-   user_id
-   title
-   created_at
-   updated_at

#### messages

-   id
-   chat_id
-   role
-   content
-   created_at

#### files

-   id
-   user_id
-   url
-   type
-   created_at

#### chat_files

-   chat_id
-   file_id

------------------------------------------------------------------------

### Indexes

-   messages(chat_id, created_at)
-   chats(user_id, updated_at)

------------------------------------------------------------------------

## 8. Realtime

-   Subscribe to chats & messages
-   Events: INSERT / UPDATE

------------------------------------------------------------------------

## 9. Security

-   API keys only on server
-   Validate inputs
-   Rate limit anonymous users
-   Auth required for persistence

------------------------------------------------------------------------

## 10. UX Requirements

-   Streaming effect
-   Auto-scroll
-   Skeleton loaders
-   Empty states

Nice to have: - Typing indicator - Retry - Copy button

------------------------------------------------------------------------

## 11. Deployment

-   Railway (frontend + API)
-   Supabase (DB)

------------------------------------------------------------------------

## 12. README Requirements

-   Setup instructions
-   Env variables
-   Architecture overview


