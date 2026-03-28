create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  mime_type text not null,
  byte_size integer not null,
  storage_path text not null,
  url text,
  extracted_text text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.chat_files (
  chat_id uuid not null references public.chats(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (message_id, file_id)
);

create index if not exists idx_messages_chat_created_at
  on public.messages (chat_id, created_at);

create index if not exists idx_chats_user_updated_at
  on public.chats (user_id, updated_at desc);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

create or replace function public.touch_chat_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.chats
  set updated_at = timezone('utc'::text, now())
  where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists on_message_written on public.messages;
create trigger on_message_written
after insert on public.messages
for each row execute procedure public.touch_chat_updated_at();

alter table public.users enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
alter table public.chat_files enable row level security;

create policy "users can view own profile"
on public.users for select
using (auth.uid() = id);

create policy "users can view own chats"
on public.chats for select
using (auth.uid() = user_id);

create policy "users can view own messages"
on public.messages for select
using (
  exists (
    select 1 from public.chats
    where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
  )
);

create policy "users can view own files"
on public.files for select
using (auth.uid() = user_id);

create policy "users can view own chat files"
on public.chat_files for select
using (
  exists (
    select 1 from public.chats
    where chats.id = chat_files.chat_id
      and chats.user_id = auth.uid()
  )
);

alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.messages;
