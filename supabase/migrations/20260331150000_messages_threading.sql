alter table public.messages
add column if not exists conversation_id text;

alter table public.messages
add column if not exists sender_type text;

update public.messages
set
  conversation_id = coalesce(conversation_id, id::text),
  sender_type = coalesce(sender_type, 'client'),
  status = case
    when status = 'new' then 'unread'
    when status in ('unread', 'read', 'replied') then status
    else 'unread'
  end;

alter table public.messages
alter column conversation_id set not null;

alter table public.messages
alter column sender_type set not null;

alter table public.messages
alter column status set default 'unread';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'messages_status_check'
  ) then
    alter table public.messages
      drop constraint messages_status_check;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_status_check'
  ) then
    alter table public.messages
      add constraint messages_status_check
      check (status in ('unread', 'read', 'replied'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_sender_type_check'
  ) then
    alter table public.messages
      add constraint messages_sender_type_check
      check (sender_type in ('client', 'agent'));
  end if;
end
$$;

create index if not exists messages_agent_conversation_idx
  on public.messages(agent_id, conversation_id, created_at desc);

create index if not exists messages_conversation_created_at_idx
  on public.messages(conversation_id, created_at asc);

create index if not exists messages_conversation_archived_idx
  on public.messages(agent_id, conversation_id, archived);
