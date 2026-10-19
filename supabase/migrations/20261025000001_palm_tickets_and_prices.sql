-- =====================================================================
-- Palm reading: pay first, then take the photos.  And prices × 1.5.
-- =====================================================================
-- Paying for a palm reading gives a "ticket" (one paid reading). The photos are sent with the ticket; a reading
-- uses it up. If the photos don't show a clear palm, or the AI fails, the ticket stays so the user can try again
-- without paying twice. An unused ticket is kept (e.g. if the app is closed after paying).
-- =====================================================================

create table public.palm_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  paid_with  text not null check (paid_with in ('credits', 'premium', 'free')),
  credits    integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now(),
  used_at    timestamptz
);
create index palm_tickets_open on public.palm_tickets (user_id) where used_at is null;
alter table public.palm_tickets enable row level security;
revoke all on public.palm_tickets from anon, authenticated;

-- Pays for one palm reading. Returns the ticket id (an unused one if the user already has it), or null if
-- there are not enough credits.
create or replace function public.buy_palm_ticket(p_user uuid, p_price integer, p_premium_included boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  ticket uuid;
  have integer;
begin
  if p_price < 0 then
    raise exception 'invalid price';
  end if;
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  -- Lock the wallet first, so two taps cannot buy two tickets.
  select credits into have from public.wallets where user_id = p_user for update;
  select id into ticket from public.palm_tickets where user_id = p_user and used_at is null order by created_at limit 1;
  if ticket is not null then
    return ticket;
  end if;
  if p_premium_included and public.has_premium(p_user) then
    insert into public.palm_tickets (user_id, paid_with) values (p_user, 'premium') returning id into ticket;
  elsif p_price = 0 then
    insert into public.palm_tickets (user_id, paid_with) values (p_user, 'free') returning id into ticket;
  elsif have >= p_price then
    update public.wallets set credits = credits - p_price, updated_at = now() where user_id = p_user;
    insert into public.credit_ledger (user_id, change, reason) values (p_user, -p_price, 'unlock');
    insert into public.palm_tickets (user_id, paid_with, credits) values (p_user, 'credits', p_price) returning id into ticket;
  end if;
  return ticket;
end;
$$;

-- Marks a ticket as used (true), or false if it is not this user's unused ticket.
create or replace function public.use_palm_ticket(p_user uuid, p_ticket uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with used as (
    update public.palm_tickets set used_at = now()
     where id = p_ticket and user_id = p_user and used_at is null
    returning id
  )
  select exists (select 1 from used);
$$;

-- Gives a used ticket back (the reading could not be made), so the user can try again without paying.
create or replace function public.release_palm_ticket(p_user uuid, p_ticket uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.palm_tickets set used_at = null where id = p_ticket and user_id = p_user;
$$;

revoke execute on function public.buy_palm_ticket(uuid, integer, boolean) from public, anon, authenticated;
revoke execute on function public.use_palm_ticket(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.release_palm_ticket(uuid, uuid) from public, anon, authenticated;
grant execute on function public.buy_palm_ticket(uuid, integer, boolean) to service_role;
grant execute on function public.use_palm_ticket(uuid, uuid) to service_role;
grant execute on function public.release_palm_ticket(uuid, uuid) to service_role;

-- Prices × 1.5 (rounded up): credit packs and Premium. Tools and AI are priced in credits, so they cost 1.5× too.
update public.app_settings set value = '[
  {"id": "q10", "credits": 10, "priceInr": 74},
  {"id": "q30", "credits": 30, "priceInr": 194},
  {"id": "q100", "credits": 100, "priceInr": 524}
]', updated_at = now() where key = 'credit_packs';
update public.app_settings set value = '[
  {"id": "monthly",   "productId": "premium:monthly",   "months": 1,  "priceInr": 299,  "bonusCredits": 20,  "trialDays": 0},
  {"id": "quarterly", "productId": "premium:quarterly", "months": 3,  "priceInr": 749,  "bonusCredits": 60,  "trialDays": 0},
  {"id": "yearly",    "productId": "premium:yearly",    "months": 12, "priceInr": 2249, "bonusCredits": 240, "trialDays": 7}
]', updated_at = now() where key = 'subscription_plans';
