create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  description text not null,
  renovation_details text,
  projected_price numeric(12,2),
  expected_completion_date date,
  image_url text,
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_status_check
    check (status in ('in_progress', 'ready', 'sold'))
);

create index if not exists listings_agent_id_idx
  on public.listings(agent_id);

create index if not exists listings_status_idx
  on public.listings(status);

create index if not exists listings_postal_code_idx
  on public.listings(postal_code);

insert into storage.buckets (id, name, public)
select 'listings', 'listings', true
where not exists (
  select 1 from storage.buckets where id = 'listings'
);

drop trigger if exists listings_set_updated_at on public.listings;

create trigger listings_set_updated_at
before update on public.listings
for each row
execute function public.set_updated_at_timestamp();
