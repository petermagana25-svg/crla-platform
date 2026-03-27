alter table public.agents
add column if not exists profile_completed boolean not null default false;

alter table public.agents
add column if not exists phone_number text;

update public.agents
set profile_completed = true
where role = 'admin'
   or exists (
     select 1
     from public.profiles
     where public.profiles.id = public.agents.id
   );
