create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists listing_views_agent_id_idx
  on public.listing_views(agent_id);

create index if not exists listing_views_listing_id_idx
  on public.listing_views(listing_id);

create index if not exists listing_views_created_at_idx
  on public.listing_views(created_at desc);

alter table public.listing_views enable row level security;

drop policy if exists "Agents can view their own listing views" on public.listing_views;

create policy "Agents can view their own listing views"
  on public.listing_views
  for select
  to authenticated
  using (auth.uid() = agent_id);
