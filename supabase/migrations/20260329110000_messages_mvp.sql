create extension if not exists pgcrypto;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  sender_name text,
  sender_email text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint messages_status_check
    check (status in ('new', 'read'))
);

create index if not exists messages_agent_id_idx
  on public.messages(agent_id);

create index if not exists messages_agent_status_idx
  on public.messages(agent_id, status);

create index if not exists messages_created_at_idx
  on public.messages(created_at desc);

create index if not exists messages_listing_id_idx
  on public.messages(listing_id);

alter table public.messages enable row level security;

drop policy if exists "Agents can view their own messages" on public.messages;

create policy "Agents can view their own messages"
  on public.messages
  for select
  to authenticated
  using (auth.uid() = agent_id);
