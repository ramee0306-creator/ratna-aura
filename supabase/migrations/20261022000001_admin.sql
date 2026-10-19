-- =====================================================================
-- Milestone 7: admin panel
-- =====================================================================
-- Admins see usage numbers and can change app_settings and gift credits
-- through the `admin` server function. Nobody can make themselves an
-- admin from the app: the flag can only be set in the SQL editor:
--
--   update public.profiles set is_admin = true
--    where id = (select id from auth.users where email = 'you@example.com');
-- =====================================================================

alter table public.profiles add column is_admin boolean not null default false;
-- The app may read it (to show the admin button) but never change it:
-- the existing column grants allow updating only display_name and preferred_language.

-- Usage numbers for the admin panel (server only).
create or replace function public.admin_stats()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'newUsers7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'questionsToday', (select count(*) from public.chat_messages where role = 'user' and created_at > date_trunc('day', now())),
    'questions7d', (select count(*) from public.chat_messages where role = 'user' and created_at > now() - interval '7 days'),
    'aiUsage7d', coalesce((
      select jsonb_agg(jsonb_build_object('model', model, 'answers', n, 'inputTokens', i, 'outputTokens', o))
        from (select model, count(*) n, sum(input_tokens) i, sum(output_tokens) o
                from public.chat_messages
               where role = 'assistant' and created_at > now() - interval '7 days'
               group by model) m
    ), '[]'::jsonb),
    'rashifalToday', (select count(*) from public.rashifal where day = (now() at time zone 'Asia/Kolkata')::date and status = 'ready'),
    'creditsBought7d', (select coalesce(sum(change), 0) from public.credit_ledger where reason = 'purchase' and created_at > now() - interval '7 days'),
    'testCredits7d', (select coalesce(sum(change), 0) from public.credit_ledger where reason = 'test_purchase' and created_at > now() - interval '7 days'),
    'creditsSpent7d', (select coalesce(-sum(change), 0) from public.credit_ledger where change < 0 and created_at > now() - interval '7 days')
  );
$$;

-- Finds a user by e-mail or phone (for gifting credits). Server only.
create or replace function public.find_user(p_contact text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id from auth.users
   where lower(email) = lower(trim(p_contact))
      or phone = regexp_replace(p_contact, '[^0-9]', '', 'g')
   limit 1;
$$;

revoke execute on function public.admin_stats() from public, anon, authenticated;
revoke execute on function public.find_user(text) from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;
grant execute on function public.find_user(text) to service_role;
