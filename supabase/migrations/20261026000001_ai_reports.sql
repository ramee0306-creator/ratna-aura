-- =====================================================================
-- Reporting AI answers (Google Play's rule for apps with AI-generated content)
-- =====================================================================
-- Users can flag an AI answer (Ask AI, astrologer chat, palm reading, rashifal) as harmful, wrong or other.
-- The admin panel lists recent reports. The reported text is kept encrypted, only for review.
-- =====================================================================

create table public.ai_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  feature     text not null check (feature in ('ask', 'persona', 'palm', 'rashifal')),
  item_id     text check (char_length(item_id) <= 100),
  reason      text not null check (reason in ('harmful', 'wrong', 'other')),
  note        text check (char_length(note) <= 500),
  -- the reported answer, encrypted by the server (see supabase/functions/_shared/crypto.ts)
  content_enc text check (char_length(content_enc) <= 40000),
  created_at  timestamptz not null default now()
);
create index ai_reports_recent on public.ai_reports (created_at desc);
create index ai_reports_user on public.ai_reports (user_id, created_at desc);

comment on table public.ai_reports is 'AI answers reported by users. Written and read only by server functions.';

alter table public.ai_reports enable row level security;
revoke all on public.ai_reports from anon, authenticated;
