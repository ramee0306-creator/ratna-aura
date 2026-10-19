-- =====================================================================
-- Milestone 4: daily rashifal (written by AI) and app settings
-- =====================================================================
-- Both tables are used ONLY by the server functions (with the secret
-- service key). RLS is on with no policies, so the phone app can never
-- read or change them directly.
-- =====================================================================

-- ---------- all 31 app languages may be saved on the account ----------
alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles add constraint profiles_preferred_language_check
  check (preferred_language in ('en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'or', 'ml', 'pa', 'as', 'mai', 'bho', 'raj', 'hne', 'mag', 'awa', 'ne', 'kok', 'sat', 'ks', 'sd', 'doi', 'mni', 'brx', 'tcy', 'sa', 'lus', 'kha'));

-- ---------- app_settings: switches the admin can change without an app update ----------
create table public.app_settings (
  key        text primary key check (key ~ '^[a-z_]{1,60}$'),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is 'Server settings, e.g. which AI model writes the rashifal. Server only.';

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

-- Which Claude model writes each feature (can be changed later, e.g. to 'claude-sonnet-5-5' to save money).
insert into public.app_settings (key, value) values
  ('rashifal_model', '"claude-opus-5-5"'),
  ('chat_model', '"claude-opus-5-5"');

-- ---------- rashifal: one AI-written reading per day, Moon sign and language ----------
create table public.rashifal (
  day        date not null,
  sign       smallint not null check (sign between 0 and 11),
  language   text not null check (char_length(language) between 2 and 8),
  -- 'generating' while the AI is writing it (so two people asking at once don't pay twice)
  status     text not null default 'generating' check (status in ('generating', 'ready')),
  content    jsonb,
  model      text,
  created_at timestamptz not null default now(),
  primary key (day, sign, language),
  check (status = 'generating' or content is not null)
);

comment on table public.rashifal is 'Daily rashifal written by AI, shared by all users. Server only.';

alter table public.rashifal enable row level security;
revoke all on public.rashifal from anon, authenticated;
