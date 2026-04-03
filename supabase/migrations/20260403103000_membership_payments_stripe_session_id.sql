alter table public.membership_payments
  add column if not exists stripe_session_id text;

create unique index if not exists membership_payments_stripe_session_id_key
  on public.membership_payments(stripe_session_id)
  where stripe_session_id is not null;
