-- =====================================================================
-- Milestone 6: AI astrologer / numerologist personas
-- =====================================================================
-- Personas are AI characters with a specialty (always shown as AI).
-- Billing:
--  * per message: each message costs the persona's price in credits;
--  * per minute: the user buys a session (5, 10 or 15 minutes) up front
--    and can chat until it ends (with a fair-use cap on messages).
-- As before, credits only change through server-only functions, and
-- every change is written to credit_ledger.
-- =====================================================================

alter table public.chat_threads
  add column persona_id text check (persona_id ~ '^[a-z]{2,20}$');

drop index if exists public.chat_threads_owner;
create index chat_threads_owner on public.chat_threads (owner_id, persona_id, updated_at desc);

alter table public.credit_ledger drop constraint credit_ledger_reason_check;
alter table public.credit_ledger add constraint credit_ledger_reason_check
  check (reason in ('purchase', 'test_purchase', 'question', 'refund', 'gift', 'persona_message', 'persona_session'));

-- ---------- per-minute sessions ----------
create table public.persona_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  persona_id text not null check (persona_id ~ '^[a-z]{2,20}$'),
  minutes    integer not null check (minutes between 1 and 60),
  credits    integer not null check (credits >= 0),
  -- messages sent in this session (a fair-use cap keeps AI costs predictable)
  messages   integer not null default 0 check (messages >= 0),
  started_at timestamptz not null default now(),
  ends_at    timestamptz not null
);

create index persona_sessions_user on public.persona_sessions (user_id, persona_id, ends_at desc);

alter table public.persona_sessions enable row level security;
create policy "persona_sessions: owner can read"
  on public.persona_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.persona_sessions from anon, authenticated;
grant select on public.persona_sessions to authenticated;

-- ---------- server-only functions ----------

-- Takes `p_amount` credits if the user has them. Returns true if paid.
create or replace function public.spend_credits(p_user uuid, p_amount integer, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  have integer;
begin
  if p_amount <= 0 or p_reason not in ('persona_message', 'persona_session') then
    raise exception 'invalid credit change';
  end if;
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select credits into have from public.wallets where user_id = p_user for update;
  if have < p_amount then
    return false;
  end if;
  update public.wallets set credits = credits - p_amount, updated_at = now() where user_id = p_user;
  insert into public.credit_ledger (user_id, change, reason) values (p_user, -p_amount, p_reason);
  return true;
end;
$$;

-- Gives credits back (for example when the AI could not answer a paid message).
create or replace function public.refund_credits(p_user uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_amount <= 0 then
    raise exception 'invalid credit change';
  end if;
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  update public.wallets set credits = credits + p_amount, updated_at = now() where user_id = p_user;
  insert into public.credit_ledger (user_id, change, reason) values (p_user, p_amount, 'refund');
end;
$$;

-- Starts a per-minute session if the user can pay for it. Returns the session id, or null if not enough credits.
create or replace function public.start_persona_session(p_user uuid, p_persona text, p_minutes integer, p_credits integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_id uuid;
begin
  if not public.spend_credits(p_user, p_credits, 'persona_session') then
    return null;
  end if;
  insert into public.persona_sessions (user_id, persona_id, minutes, credits, ends_at)
    values (p_user, p_persona, p_minutes, p_credits, now() + make_interval(mins => p_minutes))
    returning id into session_id;
  return session_id;
end;
$$;

-- Counts one message against the user's running session with this persona.
-- Returns false if there is no running session or its fair-use cap is reached.
create or replace function public.use_session_message(p_user uuid, p_persona text, p_cap integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated integer;
begin
  update public.persona_sessions
     set messages = messages + 1
   where id = (
     select id from public.persona_sessions
      where user_id = p_user and persona_id = p_persona and ends_at > now() and messages < p_cap
      order by ends_at desc
      limit 1
      for update
   );
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

-- Gives back a session message the AI could not answer.
create or replace function public.release_session_message(p_user uuid, p_persona text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.persona_sessions
     set messages = greatest(messages - 1, 0)
   where id = (
     select id from public.persona_sessions
      where user_id = p_user and persona_id = p_persona
      order by ends_at desc
      limit 1
   );
end;
$$;

revoke execute on function public.spend_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.refund_credits(uuid, integer) from public, anon, authenticated;
revoke execute on function public.start_persona_session(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.use_session_message(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.release_session_message(uuid, text) from public, anon, authenticated;
grant execute on function public.spend_credits(uuid, integer, text) to service_role;
grant execute on function public.refund_credits(uuid, integer) to service_role;
grant execute on function public.start_persona_session(uuid, text, integer, integer) to service_role;
grant execute on function public.use_session_message(uuid, text, integer) to service_role;
grant execute on function public.release_session_message(uuid, text) to service_role;
