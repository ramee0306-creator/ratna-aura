-- =====================================================================
-- Paid tools: pay before use, and palm reading
-- =====================================================================
-- Each tool on the home screen costs credits before its result is shown (prices in app_settings.feature_prices,
-- shown on the tiles). One payment unlocks one thing for good: a person's kundli, a matching pair, a name, a
-- number, a month of rashifal or panchang, one palm reading. Premium includes every tool.
-- Only a hash of what was unlocked is stored, never the name or number itself.
-- =====================================================================

create table public.unlocks (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  feature    text not null check (feature ~ '^[a-z_]{2,30}$'),
  -- sha-256 (hex) of what was unlocked, e.g. of the person's name and birth date
  key_hash   text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  paid_with  text not null check (paid_with in ('credits', 'premium', 'free')),
  credits    integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, feature, key_hash)
);

comment on table public.unlocks is 'Paid tools a user has unlocked. Changed only by server functions.';

alter table public.unlocks enable row level security;
create policy "unlocks: owner can read"
  on public.unlocks for select
  to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.unlocks from anon, authenticated;
grant select on public.unlocks to authenticated;

-- Palm readings (the photos are never stored; only the reading text, encrypted by the server).
create table public.palm_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  language    text not null check (language ~ '^[a-z]{2,3}$'),
  -- the reading, encrypted by the server (see supabase/functions/_shared/crypto.ts)
  reading_enc text not null check (char_length(reading_enc) <= 40000),
  created_at  timestamptz not null default now()
);
create index palm_readings_user on public.palm_readings (user_id, created_at desc);
alter table public.palm_readings enable row level security;
revoke all on public.palm_readings from anon, authenticated;

alter table public.credit_ledger drop constraint credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in ('purchase', 'test_purchase', 'question', 'refund', 'gift', 'persona_message', 'persona_session', 'subscription', 'test_subscription', 'unlock'));

-- Unlocks a tool if the user can pay. Returns 'already', 'premium', 'free', 'paid' or 'none' (not enough credits).
create or replace function public.unlock_feature(p_user uuid, p_feature text, p_key_hash text, p_price integer, p_premium_included boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  have integer;
begin
  if p_price < 0 then
    raise exception 'invalid price';
  end if;
  if exists (select 1 from public.unlocks where user_id = p_user and feature = p_feature and key_hash = p_key_hash) then
    return 'already';
  end if;
  if p_premium_included and public.has_premium(p_user) then
    insert into public.unlocks (user_id, feature, key_hash, paid_with) values (p_user, p_feature, p_key_hash, 'premium');
    return 'premium';
  end if;
  if p_price = 0 then
    insert into public.unlocks (user_id, feature, key_hash, paid_with) values (p_user, p_feature, p_key_hash, 'free');
    return 'free';
  end if;
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select credits into have from public.wallets where user_id = p_user for update;
  if have < p_price then
    return 'none';
  end if;
  update public.wallets set credits = credits - p_price, updated_at = now() where user_id = p_user;
  insert into public.credit_ledger (user_id, change, reason) values (p_user, -p_price, 'unlock');
  insert into public.unlocks (user_id, feature, key_hash, paid_with, credits) values (p_user, p_feature, p_key_hash, 'credits', p_price);
  return 'paid';
end;
$$;

-- Takes an unlock back and returns its credits (when the paid work could not be done, e.g. a palm reading failed).
create or replace function public.undo_unlock(p_user uuid, p_feature text, p_key_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  u public.unlocks;
begin
  delete from public.unlocks where user_id = p_user and feature = p_feature and key_hash = p_key_hash returning * into u;
  if u.credits > 0 then
    update public.wallets set credits = credits + u.credits, updated_at = now() where user_id = p_user;
    insert into public.credit_ledger (user_id, change, reason) values (p_user, u.credits, 'refund');
  end if;
end;
$$;

revoke execute on function public.unlock_feature(uuid, text, text, integer, boolean) from public, anon, authenticated;
revoke execute on function public.undo_unlock(uuid, text, text) from public, anon, authenticated;
grant execute on function public.unlock_feature(uuid, text, text, integer, boolean) to service_role;
grant execute on function public.undo_unlock(uuid, text, text) to service_role;

-- Prices in credits (1 credit ≈ ₹3.5–₹4.9 depending on the pack). Change them in the admin panel.
insert into public.app_settings (key, value) values
  ('feature_prices', '{
    "kundli": 40, "milan": 30, "rashifal": 10, "panchang": 5,
    "numbers": 20, "loshu": 20, "name": 30, "vibrations": 10, "compatibility": 20,
    "palm": 30
  }'),
  ('premium_includes_tools', 'true')
on conflict (key) do nothing;
