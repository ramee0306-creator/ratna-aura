-- =====================================================================
-- Premium subscription (monthly / quarterly / yearly)
-- =====================================================================
-- What Premium gives (kept in app_settings so prices and perks can change):
--  * Ask AI without counting questions (fair use: a daily limit),
--  * bonus credits every billing period, for the AI astrologers.
-- The subscription itself is bought and renewed in Google Play; RevenueCat
-- tells our server (supabase/functions/revenuecat), which records it here.
-- In test mode the app can start a subscription without payment.
-- Only the server can change subscriptions; users can read their own.
-- =====================================================================

create table public.subscriptions (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  plan_id                 text not null check (plan_id ~ '^[a-z0-9_]{1,30}$'),
  -- active: paid up · in_grace: a renewal payment failed, Google is retrying · expired: ended
  status                  text not null check (status in ('active', 'in_grace', 'expired')),
  -- false after the user cancels: Premium continues until current_period_end, then ends
  will_renew              boolean not null default true,
  is_trial                boolean not null default false,
  current_period_end      timestamptz not null,
  store                   text not null check (store in ('play', 'test')),
  original_transaction_id text check (char_length(original_transaction_id) <= 200),
  updated_at              timestamptz not null default now()
);

comment on table public.subscriptions is 'Premium subscription of each user. Changed only by server functions.';

alter table public.subscriptions enable row level security;
create policy "subscriptions: owner can read"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

-- Premium Ask AI questions used today (fair use).
alter table public.wallets add column premium_day date;
alter table public.wallets add column premium_day_used integer not null default 0 check (premium_day_used >= 0);

alter table public.chat_messages drop constraint chat_messages_paid_with_check;
alter table public.chat_messages add constraint chat_messages_paid_with_check check (paid_with in ('free', 'credit', 'premium'));

alter table public.credit_ledger drop constraint credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in ('purchase', 'test_purchase', 'question', 'refund', 'gift', 'persona_message', 'persona_session', 'subscription', 'test_subscription'));
-- Each store order (and each paid subscription period) is credited only once.
drop index if exists public.credit_ledger_purchase_once;
create unique index credit_ledger_purchase_once on public.credit_ledger (reference) where reason in ('purchase', 'subscription');

-- add_credits now also accepts subscription bonus credits.
create or replace function public.add_credits(p_user uuid, p_credits integer, p_reason text, p_reference text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  balance integer;
begin
  if p_credits <= 0 or p_reason not in ('purchase', 'test_purchase', 'gift', 'subscription', 'test_subscription') then
    raise exception 'invalid credit change';
  end if;
  insert into public.credit_ledger (user_id, change, reason, reference) values (p_user, p_credits, p_reason, p_reference);
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  update public.wallets set credits = credits + p_credits, updated_at = now() where user_id = p_user
    returning credits into balance;
  return balance;
end;
$$;

-- Is this user Premium right now? (A failed renewal keeps Premium during Google's grace period.)
create or replace function public.has_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions
     where user_id = p_user and status in ('active', 'in_grace') and current_period_end > now()
  );
$$;

-- Records a subscription (from Google Play via RevenueCat, or a test).
create or replace function public.set_subscription(
  p_user uuid, p_plan text, p_status text, p_period_end timestamptz, p_will_renew boolean,
  p_is_trial boolean, p_store text, p_original_transaction_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.subscriptions as s
    (user_id, plan_id, status, will_renew, is_trial, current_period_end, store, original_transaction_id, updated_at)
  values (p_user, p_plan, p_status, p_will_renew, p_is_trial, p_period_end, p_store, p_original_transaction_id, now())
  on conflict (user_id) do update set
    plan_id = excluded.plan_id, status = excluded.status, will_renew = excluded.will_renew, is_trial = excluded.is_trial,
    current_period_end = excluded.current_period_end, store = excluded.store,
    original_transaction_id = excluded.original_transaction_id, updated_at = now();
end;
$$;

-- Ask AI: Premium first (within the daily fair-use limit), then free questions, then a credit.
-- Returns 'premium', 'free', 'credit' or 'none'.
drop function public.spend_question(uuid, integer);
create or replace function public.spend_question(p_user uuid, p_free_limit integer, p_premium_daily integer default 30)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.wallets;
  today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into w from public.wallets where user_id = p_user for update;
  if public.has_premium(p_user) then
    if w.premium_day is distinct from today then
      update public.wallets set premium_day = today, premium_day_used = 1, updated_at = now() where user_id = p_user;
      return 'premium';
    elsif w.premium_day_used < p_premium_daily then
      update public.wallets set premium_day_used = premium_day_used + 1, updated_at = now() where user_id = p_user;
      return 'premium';
    end if;
  end if;
  if w.free_questions_used < p_free_limit then
    update public.wallets set free_questions_used = free_questions_used + 1, updated_at = now() where user_id = p_user;
    return 'free';
  elsif w.credits >= 1 then
    update public.wallets set credits = credits - 1, updated_at = now() where user_id = p_user;
    insert into public.credit_ledger (user_id, change, reason) values (p_user, -1, 'question');
    return 'credit';
  end if;
  return 'none';
end;
$$;

create or replace function public.refund_question(p_user uuid, p_paid_with text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_paid_with = 'premium' then
    update public.wallets set premium_day_used = greatest(premium_day_used - 1, 0), updated_at = now() where user_id = p_user;
  elsif p_paid_with = 'free' then
    update public.wallets set free_questions_used = greatest(free_questions_used - 1, 0), updated_at = now() where user_id = p_user;
  elsif p_paid_with = 'credit' then
    update public.wallets set credits = credits + 1, updated_at = now() where user_id = p_user;
    insert into public.credit_ledger (user_id, change, reason) values (p_user, 1, 'refund');
  end if;
end;
$$;

revoke execute on function public.spend_question(uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.has_premium(uuid) from public, anon, authenticated;
revoke execute on function public.set_subscription(uuid, text, text, timestamptz, boolean, boolean, text, text) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.spend_question(uuid, integer, integer) to service_role;
grant execute on function public.has_premium(uuid) to service_role;
grant execute on function public.set_subscription(uuid, text, text, timestamptz, boolean, boolean, text, text) to service_role;
grant execute on function public.add_credits(uuid, integer, text, text) to service_role;

-- Plans (prices are placeholders in rupees, including GST; change them in the admin panel or here).
-- productId = the Google Play subscription "product:base plan" as RevenueCat reports it.
insert into public.app_settings (key, value) values
  ('subscription_plans', '[
    {"id": "monthly",   "productId": "premium:monthly",   "months": 1,  "priceInr": 199,  "bonusCredits": 20,  "trialDays": 0},
    {"id": "quarterly", "productId": "premium:quarterly", "months": 3,  "priceInr": 499,  "bonusCredits": 60,  "trialDays": 0},
    {"id": "yearly",    "productId": "premium:yearly",    "months": 12, "priceInr": 1499, "bonusCredits": 240, "trialDays": 7}
  ]'),
  ('premium_daily_questions', '30')
on conflict (key) do nothing;
