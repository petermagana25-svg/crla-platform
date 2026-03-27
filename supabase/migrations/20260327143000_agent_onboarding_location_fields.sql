alter table public.agents
add column if not exists city text;

alter table public.agents
add column if not exists state text;

alter table public.agents
add column if not exists postal_code text;

update public.agents
set city = public.profiles.city
from public.profiles
where public.profiles.id = public.agents.id
  and public.agents.city is null
  and public.profiles.city is not null;
