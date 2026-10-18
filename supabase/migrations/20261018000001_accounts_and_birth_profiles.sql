-- =====================================================================
-- Milestone 1: user accounts, consent, and (encrypted) birth profiles
-- =====================================================================
-- Security model
--  * Row Level Security (RLS) is ON for every table.
--  * The phone app may only READ its own account row and change two
--    harmless columns (display name, language).
--  * Birth profiles are never touched by the app directly. They go
--    through the `birth-profiles` server function, which encrypts the
--    personal fields with a key that only the server knows.
-- =====================================================================

-- ---------- helper: keep updated_at fresh ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles: one row per signed-in user ----------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text check (char_length(display_name) <= 80),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi', 'mr')),
  -- When the user confirmed they are 18 or older
  age_confirmed_at   timestamptz,
  -- Which version of the privacy notice they accepted, and when
  consent_version    integer,
  consent_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.profiles is 'App account data for each auth user. No birth data here.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: owner can update"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Supabase grants everything on new tables by default; narrow it down.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, preferred_language) on public.profiles to authenticated;

-- Create the profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Record that the signed-in user is 18+ and accepted the privacy notice.
create or replace function public.accept_terms(p_consent_version integer, p_is_adult boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_is_adult is distinct from true then
    raise exception 'You must be 18 or older to use this app' using errcode = '22023';
  end if;
  if p_consent_version is null or p_consent_version < 1 then
    raise exception 'Invalid consent version' using errcode = '22023';
  end if;

  update public.profiles
     set age_confirmed_at = coalesce(age_confirmed_at, now()),
         consent_version  = p_consent_version,
         consent_at       = now()
   where id = v_uid;
end;
$$;

revoke execute on function public.accept_terms(integer, boolean) from public, anon;
grant execute on function public.accept_terms(integer, boolean) to authenticated;

-- ---------- birth_profiles: the user and their family members ----------
create table public.birth_profiles (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  relation    text not null default 'self'
              check (relation in ('self', 'spouse', 'partner', 'child', 'parent', 'sibling', 'friend', 'other')),
  is_primary  boolean not null default false,
  -- AES-256-GCM encrypted JSON with name, gender, birth date, time and place.
  -- Format: v<keyVersion>.<iv>.<ciphertext> (base64). Unreadable without the server key.
  data_enc    text not null check (data_enc ~ '^v[0-9]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.birth_profiles is 'Saved people (self + family). Personal fields are encrypted in data_enc.';

create index birth_profiles_owner_idx on public.birth_profiles (owner_id);
create unique index birth_profiles_one_primary_per_owner
  on public.birth_profiles (owner_id) where is_primary;

create trigger birth_profiles_set_updated_at
  before update on public.birth_profiles
  for each row execute function public.set_updated_at();

-- Max 20 saved people per account (stops abuse).
create or replace function public.enforce_birth_profile_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.birth_profiles where owner_id = new.owner_id) >= 20 then
    raise exception 'You can save up to 20 profiles' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger birth_profiles_limit
  before insert on public.birth_profiles
  for each row execute function public.enforce_birth_profile_limit();

-- RLS on, and NO policies: only the server (service role) can read or write.
alter table public.birth_profiles enable row level security;
revoke all on public.birth_profiles from anon, authenticated;
