-- =====================================================================
-- Milestone 5: "Ask AI" — question credits and chat history
-- =====================================================================
-- * Every user gets a few free questions (app_settings.free_questions),
--   then each question costs 1 credit.
-- * Credits change ONLY through the functions below, which only the
--   server (service role) may call; every change is written to the
--   credit_ledger so it can always be checked.
-- * Chat messages are stored ENCRYPTED by the server (like birth
--   details). The app cannot read the chat tables directly.
-- =====================================================================

-- ---------- wallets: credits and free questions used ----------
create table public.wallets (
  user_id             uuid primary key references public.profiles (id) on delete cascade,
  credits             integer not null default 0 check (credits >= 0),
  free_questions_used integer not null default 0 check (free_questions_used >= 0),
  updated_at          timestamptz not null default now()
);

comment on table public.wallets is 'Question credits of each user. Changed only by server functions.';

alter table public.wallets enable row level security;
create policy "wallets: owner can read"
  on public.wallets for select
  to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.wallets from anon, authenticated;
grant select on public.wallets to authenticated;

-- ---------- credit_ledger: every change of credits ----------
create table public.credit_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  change     integer not null check (change <> 0),
  reason     text not null check (reason in ('purchase', 'test_purchase', 'question', 'refund', 'gift')),
  -- e.g. the store order id of a purchase (each order is credited only once)
  reference  text check (char_length(reference) <= 200),
  created_at timestamptz not null default now()
);

create index credit_ledger_user on public.credit_ledger (user_id, created_at desc);
create unique index credit_ledger_purchase_once on public.credit_ledger (reference) where reason = 'purchase';

alter table public.credit_ledger enable row level security;
create policy "credit_ledger: owner can read"
  on public.credit_ledger for select
  to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.credit_ledger from anon, authenticated;
grant select on public.credit_ledger to authenticated;

-- ---------- chats (server only; message text is encrypted) ----------
create table public.chat_threads (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles (id) on delete cascade,
  -- whose chart the conversation is about (null = general questions)
  birth_profile_id uuid references public.birth_profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index chat_threads_owner on public.chat_threads (owner_id, updated_at desc);

create table public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.chat_threads (id) on delete cascade,
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  role          text not null check (role in ('user', 'assistant')),
  -- the text, encrypted by the server (see supabase/functions/_shared/crypto.ts)
  content_enc   text not null,
  -- for questions: paid with a free question or a credit
  paid_with     text check (paid_with in ('free', 'credit')),
  -- for answers: which AI model wrote it and how many tokens it used (for cost checks)
  model         text,
  input_tokens  integer,
  output_tokens integer,
  created_at    timestamptz not null default now()
);

create index chat_messages_thread on public.chat_messages (thread_id, created_at);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
revoke all on public.chat_threads from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;

-- ---------- credit functions (server only) ----------

-- Uses one free question if any are left, otherwise one credit.
-- Returns 'free', 'credit' or 'none' (nothing left). Safe when two questions arrive at once.
create or replace function public.spend_question(p_user uuid, p_free_limit integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.wallets;
begin
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into w from public.wallets where user_id = p_user for update;
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

-- Gives back a question that could not be answered (for example the AI was busy).
create or replace function public.refund_question(p_user uuid, p_paid_with text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_paid_with = 'free' then
    update public.wallets set free_questions_used = greatest(free_questions_used - 1, 0), updated_at = now() where user_id = p_user;
  elsif p_paid_with = 'credit' then
    update public.wallets set credits = credits + 1, updated_at = now() where user_id = p_user;
    insert into public.credit_ledger (user_id, change, reason) values (p_user, 1, 'refund');
  end if;
end;
$$;

-- Adds credits (a purchase, a test purchase or a gift). Returns the new balance.
-- A purchase with the same store reference is only ever credited once.
create or replace function public.add_credits(p_user uuid, p_credits integer, p_reason text, p_reference text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  balance integer;
begin
  if p_credits <= 0 or p_reason not in ('purchase', 'test_purchase', 'gift') then
    raise exception 'invalid credit change';
  end if;
  insert into public.credit_ledger (user_id, change, reason, reference) values (p_user, p_credits, p_reason, p_reference);
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  update public.wallets set credits = credits + p_credits, updated_at = now() where user_id = p_user
    returning credits into balance;
  return balance;
end;
$$;

revoke execute on function public.spend_question(uuid, integer) from public, anon, authenticated;
revoke execute on function public.refund_question(uuid, text) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.spend_question(uuid, integer) to service_role;
grant execute on function public.refund_question(uuid, text) to service_role;
grant execute on function public.add_credits(uuid, integer, text, text) to service_role;

-- ---------- settings ----------
-- payments_mode 'test': the "Buy" buttons add credits WITHOUT payment, for testing.
-- ⚠️ Must be changed before launch (Google Play billing comes in a later milestone).
-- credit_packs prices are placeholders in rupees — change them to your real prices.
insert into public.app_settings (key, value) values
  ('free_questions', '3'),
  ('payments_mode', '"test"'),
  ('credit_packs', '[{"id": "q10", "credits": 10, "priceInr": 49}, {"id": "q30", "credits": 30, "priceInr": 129}, {"id": "q100", "credits": 100, "priceInr": 349}]')
on conflict (key) do nothing;
