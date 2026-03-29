alter table public.messages
add column if not exists archived boolean not null default false;

create index if not exists messages_agent_archived_idx
  on public.messages(agent_id, archived);
