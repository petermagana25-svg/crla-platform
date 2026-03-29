create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists profile_views_agent_id_idx
  on public.profile_views(agent_id);

create index if not exists profile_views_created_at_idx
  on public.profile_views(created_at desc);

alter table public.profile_views enable row level security;

drop policy if exists "Agents can view their own profile views" on public.profile_views;

create policy "Agents can view their own profile views"
  on public.profile_views
  for select
  to authenticated
  using (auth.uid() = agent_id);
