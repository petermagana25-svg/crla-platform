alter table public.agents
  add column if not exists profile_completed boolean not null default false,
  add column if not exists certification_status text,
  add column if not exists agent_status text;

update public.agents
set certification_status = case
  when certification_status is null then 'not_started'
  when certification_status = 'none' then 'not_started'
  when certification_status = 'certified' then 'completed'
  when certification_status in ('not_started', 'in_progress', 'completed') then certification_status
  else 'not_started'
end;

alter table public.agents
  alter column certification_status set default 'not_started',
  alter column certification_status set not null,
  alter column agent_status set default 'pending';

update public.agents as agents
set agent_status = case
  when coalesce(agents.profile_completed, false) = false then 'pending'
  when agents.certification_status = 'completed'
    and coalesce(
      (
        select memberships.status
        from public.memberships as memberships
        where memberships.agent_id = agents.id
        order by
          case memberships.status
            when 'active' then 0
            when 'pending' then 1
            when 'expired' then 2
            when 'cancelled' then 3
            else 4
          end,
          coalesce(memberships.starts_at, memberships.created_at) desc
        limit 1
      ),
      'pending'
    ) = 'active' then 'active'
  else 'in_progress'
end;

update public.agents
set agent_status = 'pending'
where agent_status is null;

alter table public.agents
  alter column agent_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agents_certification_status_check'
  ) then
    alter table public.agents
      add constraint agents_certification_status_check
      check (certification_status in ('not_started', 'in_progress', 'completed'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agents_agent_status_check'
  ) then
    alter table public.agents
      add constraint agents_agent_status_check
      check (agent_status in ('pending', 'in_progress', 'active'));
  end if;
end
$$;
