create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  plan_name text not null default 'CRLA Annual Membership',
  status text not null default 'pending',
  amount numeric(10,2) not null default 1000.00,
  currency text not null default 'USD',
  renewal_period text not null default 'annual',
  starts_at timestamptz,
  expires_at timestamptz,
  stripe_customer_id text,
  stripe_session_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_status_check
    check (status in ('active', 'expired', 'pending', 'cancelled'))
);

create index if not exists memberships_agent_id_idx
  on public.memberships(agent_id);

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid references public.memberships(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending',
  paid_at timestamptz,
  invoice_url text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  constraint membership_payments_status_check
    check (status in ('pending', 'paid', 'failed', 'refunded'))
);

create index if not exists membership_payments_agent_id_idx
  on public.membership_payments(agent_id);

create index if not exists membership_payments_membership_id_idx
  on public.membership_payments(membership_id);

drop trigger if exists memberships_set_updated_at on public.memberships;

create trigger memberships_set_updated_at
before update on public.memberships
for each row
execute function public.set_updated_at_timestamp();
