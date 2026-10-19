# Ratna Aura

A Vedic astrology + numerology app for Android (iOS later), by **Raksha**.
Available in **English and 30 Indian languages**: all 22 official languages of India (Hindi, Bengali, Marathi,
Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, Assamese, Maithili, Nepali, Konkani, Santali,
Kashmiri, Sindhi, Dogri, Manipuri, Bodo, Sanskrit) plus Bhojpuri, Rajasthani, Chhattisgarhi, Magahi, Awadhi, Tulu,
Mizo and Khasi. The first screen on a new phone asks which language the person is comfortable in.

> The name, logo words, package ID and colours all live in **one file: [`brand.config.js`](brand.config.js)**.
> See [Renaming the app](#renaming-the-app).

**Look:** jewel tones. A sapphire-indigo night sky, metallic gold and emerald ("Ratna" in gold, "Aura" in
emerald). Headings use an elegant serif (Cormorant Garamond; Tiro Devanagari for Hindi), and everyday text
uses clean Poppins and Hind for comfortable long reading. Astrology is marked in gold, numerology in emerald.

---

## Progress

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Project set-up, database, login (phone OTP + Google), consent, delete account | ✅ Done |
| 2 | Numerology engine with tests + numerology screens | ✅ Done |
| 3 | Kundli calculations with tests, North & South Indian charts | ✅ Done |
| 4 | Daily rashifal, panchang, kundli matching, numerology compatibility | ✅ Done |
| 5 | AI chat ("Ask AI") with free questions and credits (test payments) | ✅ Done |
| 6 | AI astrologer / numerologist personas with per-minute / per-message billing | ✅ Done |
| 7 | PDF reports, full Hindi, push notifications, admin panel, privacy policy | ⏳ Next |
| 8 | Debug APK to install on your phone | |
| 9 | Signed release (AAB) for Google Play + store listing + checklist | |
| 10 | Voice conversations | |

---

## What is in this folder

```
brand.config.js          ← app name, logo words, package ID, colours (the ONE place to rename)
app/                     ← the phone app (React Native + Expo, TypeScript)
  src/app/               ← screens (each file is one screen)
  src/components/        ← buttons, cards, the night-sky background, etc.
  src/i18n/locales/      ← all text, one set of files per language (en.ts is the master copy)
  src/auth/              ← sign-in, consent, phone-number checks
  src/numerology/        ← numerology forms, number cards, Lo Shu grid drawing
  src/kundli/            ← kundli form checks, server calls, North/South Indian chart drawing
  src/jyotish/           ← server calls for the panchang and daily rashifal (+ demo samples)
  src/ai/                ← server calls for Ask AI and question credits
  src/places/            ← birth-place search (cities.data.json is made by scripts/build-cities.mjs)
packages/numerology/     ← all numerology maths (Chaldean & Pythagorean) + its tests
packages/kundli/         ← kundli logic: signs, nakshatras, houses, navamsa, dasha, panchang,
                           Kundli Milan + its tests
  .env.example           ← copy to app/.env and fill in (public Supabase values only)
supabase/                ← the server
  migrations/            ← database tables and security rules
  functions/             ← server functions (run on Supabase, hold the secrets)
  functions/.env.example ← copy to supabase/functions/.env (server secrets, never in Git)
  functions/kundli/      ← makes a kundli with the Swiss Ephemeris (the swappable, AGPL part)
  functions/panchang/    ← the panchang for a date and place
  functions/rashifal/    ← the daily rashifal, written by AI once per day, sign and language
  functions/ask/         ← Ask AI: answers from the person's kundli and numbers
  functions/credits/     ← question credits (test-mode purchases for now)
  dashboard/             ← one-file copies of each function, to paste into the Supabase website
.github/workflows/       ← automatic checks, and automatic server deployment
  tests/                 ← automatic tests for the database rules
scripts/make-icons.mjs   ← draws the app icon from the brand colours
```

### Why Supabase?

Supabase gives us **login (phone OTP + Google), a real Postgres database, and server functions** in one
place, with a free tier to start and a predictable price later (Pro plan ≈ $25/month).
Compared with Firebase:
- It is a normal SQL database, which suits astrology/numerology data (profiles, charts, payments, reports) and makes the admin panel and revenue reports simple.
- Security rules ("Row Level Security") live next to the tables and are tested automatically (`supabase/tests`).
- Server functions run TypeScript, the same language as the app, so calculation code can be shared.
- You can choose the **Mumbai** region, keeping Indian users' data close and fast.

---

## How the numerology is calculated

All the maths lives in `packages/numerology` and is checked by automatic tests with worked examples
(for example: born 14 Aug 1990 → Mulank 5, Bhagyank 5; "Amit Kumar" → Chaldean 25 → 7).

| Feature | Method used |
| --- | --- |
| Mulank | Birth day reduced to 1–9 (29 → 11 → 2) |
| Bhagyank | Every digit of DD MM YYYY added and reduced to 1–9 |
| Life path (Pythagorean only) | Day, month, year reduced separately, master numbers 11/22/33 kept |
| Name, soul urge, personality | Chaldean (Indian/Cheiro) or Pythagorean letter values — the user can switch |
| Maturity | Destiny number + name number |
| Personal year / month / day | Birth day + birth month + current year, then + month, then + day |
| Lucky numbers, days, colours, gem | Planet of each number and the classical Vedic planetary friendships |
| Lo Shu grid | Date digits (no zeros) + Bhagyank + Mulank (if the day has two digits) + optional Kua |
| Name correction | Tries natural spelling changes (Amit → Amith, Kumar → Koomar) and keeps ones that suit the person better |
| Mobile / vehicle / house / business | Digit totals (vehicle: digits only, letters shown separately); business names use Chaldean |
| Compatibility | Planet friendships between both people's Mulank and Bhagyank, as a score out of 100 |

Numerology details (name, date of birth) are saved **only on the phone, encrypted**, separately for each signed-in person,
and are removed by "Delete my account".

## How the kundli is calculated

- **Planet positions:** the Swiss Ephemeris (version 2.10, built-in Moshier mode, about 1″ accuracy) runs on the
  server in `supabase/functions/kundli`. It is wrapped by `supabase/functions/_shared/swisseph.ts`, the **only**
  AGPL part, which can be swapped for a licensed engine or a paid API without touching anything else.
- **Zodiac:** sidereal, **Lahiri ayanamsa**; Rahu = mean lunar node, Ketu exactly opposite.
- **Houses:** whole-sign houses from the lagna (the usual Indian method). Charts: birth chart (D1), navamsa (D9)
  and Moon chart, each in **North Indian** or **South Indian** style.
- **Dasha:** Vimshottari mahadashas and antardashas (years of 365.25 days) from the Moon's nakshatra.
- **Birth time → Universal Time** uses the place's real time-zone history (for example India's +6:30 war time in 1942–45).
- **Unknown birth time:** 12:00 noon is used and the app says the lagna may be wrong (the Moon chart is shown first).
- **Birth places:** about 28,000 places — every Indian town in GeoNames plus every place abroad with 15,000+
  people — with old names too (Bombay, Madras, Allahabad…). Built by `npm run build-cities`.
- Tests compare the engine with real sky events (the 2024 equinox and solar eclipse, the 2020 Jupiter–Saturn
  conjunction) and check the lagna against the textbook formula.

Birth details are stored **encrypted** on the server; the kundli is calculated fresh each time and never stored.

## How the panchang, Kundli Milan and rashifal work

- **Panchang** (server, Swiss Ephemeris) for any date and place: vara, tithi and paksha, nakshatra, yoga,
  karana — each with its exact end time — sunrise/sunset (upper edge of the Sun with refraction, as Indian
  panchangs use), moonrise/moonset, the Moon and Sun signs, the lunar month in both the **amanta** and
  **purnimanta** systems (with adhika months), Vikram and Shaka samvat, **Rahu Kaal, Yamaganda, Gulika**
  (eighths of the daytime by weekday), **Abhijit** and **Brahma muhurta**. Like printed panchangs, the day runs
  from sunrise to sunrise. Tests compare it with published panchangs (Hanuman Jayanti and Janmashtami 2024,
  Adhik Shravan 2023) to within 2 minutes.
- **Kundli Milan** (in the app, from two saved kundlis): the 8 kootas of Ashtakoota gun milan out of 36 (Varna 1,
  Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7, Nadi 8) from both people's Moon, with the usual
  Nadi and Bhakoot dosha exceptions, plus **Manglik** (Mars in house 1, 2, 4, 7, 8 or 12 from the lagna or the
  Moon). Regional traditions differ in a few table cells; we use the tables most panchangs use. The wording
  stays calm: a score is a traditional guide, not a verdict.
- **Daily rashifal**: written by Claude (AI) from the day's real planet positions counted from each Moon sign,
  the first time anyone asks for that day, sign and language, then saved and shared with everyone. The AI is
  told to stay gentle and practical: no fear, no medical/legal/financial advice, no black magic or paid
  remedies. Every reading carries the **AI** badge. It uses **Claude Haiku 5.5**, the cheapest Claude model;
  the model is a setting in the database (`app_settings` → `rashifal_model`), so it can be changed without an
  app update.

## How "Ask AI" works

- The person picks whose chart to ask about (or "General"). The server rebuilds that kundli, adds the running
  dasha, Manglik status and numerology numbers, and sends this summary with the question to Claude
  (**Haiku 5.5** by default; `app_settings` → `chat_model`). The answer comes back in the app's language.
- **Safety rules** are in `supabase/functions/_shared/ask.ts` (tested): honest that it is an AI, guidance only,
  no medical/legal/financial advice, no fear or death/disaster predictions, no black magic or paid remedies.
  If the AI senses distress, the app shows the free **Tele-MANAS** helpline (14416 / 1-800-891-4416) with a call button.
- **Credits:** every user gets **3 free questions** (`app_settings` → `free_questions`), then 1 credit per question.
  If the AI fails, the question is given back. All credit changes go through database functions only the server
  can call, and each is recorded in `credit_ledger`.
- Questions and answers are stored **encrypted** (same key as birth details) and deleted with the account.
- **Payments are in TEST MODE** (`app_settings` → `payments_mode` = `test`): "Buy" adds credits without taking money
  (max 5 test purchases a day per user). ⚠️ **Before launch**, Google Play billing replaces this (Milestone 9);
  until then you can set `payments_mode` to `off` to hide buying. Pack sizes and ₹ prices are placeholders in
  `app_settings` → `credit_packs`.

## AI personas ("Talk to an Astrologer")

Five AI characters, each with a specialty and speaking style: **Acharya Vidya** (Vedic astrology), **Guru Anand**
(numerology), **Meera** (love & marriage), **Pandit Shastri** (panchang, muhurta, remedies) and **Tara** (career &
studies). They are always shown with the **AI** badge, introduce themselves as AI and never claim to be human;
all the Ask AI safety rules apply. Their instructions are in `supabase/functions/_shared/personas.ts`.

- **Per message** (Vidya, Anand, Shastri): 1 credit per message.
- **Per minute** (Meera, Tara): the user starts a 5, 10 or 15 minute session (1 credit per minute) and chats freely
  until it ends (fair-use cap: 4 messages per minute).
- Personas use credits only (the 3 free questions are for Ask AI). If the AI fails, the credit is given back.

## Languages

- All text lives in `app/src/i18n/locales/`. **English (`en.ts`, `numerology.en.ts`, `kundli.en.ts`,
  `jyotish.en.ts`, `ai.en.ts`) is the master copy**; every other language has the same five files.
- An automatic test (`app/src/i18n/translations.test.ts`) fails if any language is missing a text or drops a
  `{{placeholder}}`, so new English text can't be forgotten in another language.
- Hindi and Marathi use the bundled Devanagari fonts; the other Indian scripts use the phone's own fonts
  (Noto on Android), which keeps the app small.
- The translations were written by AI and checked automatically, **not yet by native speakers**. Before launch,
  ask a fluent speaker of each language to read through the app (especially astrology terms and the
  "guidance, not advice" wording).
- Urdu, Kashmiri and Sindhi are written right to left; the app flips its layout for them (after reopening).
- To add a language: add it to `app/src/i18n/languages.ts`, copy the five English files to `<code>.ts`,
  `numerology.<code>.ts`, `kundli.<code>.ts`, `jyotish.<code>.ts`, `ai.<code>.ts`, translate them, and run `npm run sync-languages`.
  The daily rashifal is written in every language on the list automatically.

## Rules about secrets (important)

- **Never** put a secret key in the app or in Git. The app only ever gets the Supabase *URL* and *publishable key*. These are public by design: the database rules protect the data.
- Secret keys (Supabase secret/service key, the data-encryption key, and later the Claude API key and payment keys) live **only on the Supabase server**, set with `npx supabase secrets set`. A local copy goes in `supabase/functions/.env`, which Git ignores.
- `.gitignore` already blocks `.env` files, signing keys (`*.jks`, `*.keystore`) and Google credential files.

---

## 1. One-time set-up on your computer

Install these (all free):

| Tool | Why | Get it |
|------|-----|--------|
| **Git** | saves versions, uploads to GitHub | https://git-scm.com/downloads |
| **Node.js 22 LTS** | runs the project tools | https://nodejs.org (choose "LTS") |
| **Expo Go** app on your Android phone | preview the app instantly | Google Play Store → "Expo Go" |
| VS Code (optional) | to look at the code | https://code.visualstudio.com |

You do **not** need Android Studio or Java yet. Expo can build the installable app in the cloud
(Milestones 8–9). Install them later only if you want to build on your own computer
(then: **Java JDK 17** and **Android Studio**).

Check what you have by opening a terminal (Windows: "Command Prompt"; Mac: "Terminal") and typing:

```bash
git --version      # should print 2.x
node --version     # should print v22.x (v20 also works)
npm --version      # comes with Node
```

## 2. Get the code

```bash
git clone https://github.com/ramee0306-creator/ratna-aura.git
cd ratna-aura
npm install          # downloads all libraries (takes a few minutes the first time)
```

## 3. Run the app on your phone

```bash
cp app/.env.example app/.env     # Windows: copy app\.env.example app\.env
npm start
```

A QR code appears. Open **Expo Go** on your phone and scan it (phone and computer must be on the same Wi-Fi).

- **Without a server yet?** In `app/.env` set `EXPO_PUBLIC_DEMO_MODE=1` (leave the Supabase lines empty).
  A gold "DEMO MODE" strip appears and any 6-digit OTP lets you in, so you can click through every screen.
  Demo mode switches itself off as soon as real Supabase values are filled in.
- **With the server:** fill in the two Supabase values (step 4) and set `EXPO_PUBLIC_DEMO_MODE=0`.

## 4. Set up the server (Supabase) — once

1. **Create an account** at https://supabase.com (sign in with GitHub is easiest). Free to start.
2. **New project** → name `ratna-aura`, choose a strong database password (save it in a password manager), region **South Asia (Mumbai)**.
3. **Copy the public values** into `app/.env`: Project Settings → API Keys →
   *Project URL* → `EXPO_PUBLIC_SUPABASE_URL`, *Publishable key* → `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   Do **not** copy the *secret* key anywhere in the app.
4. **Create the tables** (from the `ratna-aura` folder):
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>   # the ref is in the project URL
   npx supabase db push
   ```
5. **Create the data-encryption key** and store it on the server:
   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   # paste the printed value after DATA_ENCRYPTION_KEY= in supabase/functions/.env
   npx supabase secrets set --env-file supabase/functions/.env
   ```
   ⚠️ Keep a safe copy of this key (password manager). **If it is lost, saved birth details cannot be read.**
6. **Deploy the server functions:** `npx supabase functions deploy`
7. **Turn on sign-in methods** (Authentication → Sign In / Providers):
   - **Google:** needs a free "OAuth client" from Google Cloud Console (https://console.cloud.google.com → APIs & Services → Credentials → Create credentials → OAuth client ID → *Web application*; add the redirect URL Supabase shows you). Paste the Client ID and Secret into Supabase.
   - **Phone:** needs an SMS provider (e.g. Twilio Verify, or MSG91 through Supabase's "Send SMS hook"). In India, SMS senders must be **DLT-registered** (this takes a few days and costs a small fee). While waiting, add **test phone numbers with fixed OTPs** on the same Phone settings page.
8. **Allow the app's return links** (Authentication → URL Configuration → Redirect URLs): add
   `ratnaaura://**` and `exp://**`.

### No-terminal alternative (everything in the Supabase website)

Steps 4–6 can also be done by copy-and-paste:

- **Tables:** SQL Editor → New query → paste the whole of each file in `supabase/migrations/`, oldest first
  → **Run**.
- **Encryption key:** Edge Functions → Secrets → add `DATA_ENCRYPTION_KEY`. To make a value, open any
  browser's developer console and run
  `btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))`.
  Save a copy in your password manager.
- **Functions:** Edge Functions → Deploy a new function → *Via Editor*. Create one called
  `birth-profiles` and one called `delete-account`, pasting the matching file from `supabase/dashboard/`.
  Then open each function's **Details** and turn **off** "Verify JWT" (the functions check the login themselves).
- After changing anything in `supabase/functions/`, run `npm run bundle-functions` and paste the new copy.
- `kundli`, `panchang` and `rashifal` need the astronomy engine file next to them, so they can only be
  deployed by the automatic *Deploy server* action (see [Updating](#6-updating)).

### Turning on the daily rashifal (Claude API key)

The rashifal is written by Claude, Anthropic's AI. It needs a paid API key, kept **only on the server**:

1. Go to https://console.anthropic.com and sign up (Google sign-in works).
2. **Settings → Billing**: add a payment card and buy a small amount of credit (e.g. $10). Under
   **Settings → Limits**, set a **monthly spend limit** (e.g. $50) so a bill can never surprise you.
3. **Settings → API Keys → Create Key**, name it `ratna-aura-server`, and copy it (it starts with `sk-ant-`).
   Never paste it into the app, a chat or Git.
4. Supabase website → your project → **Edge Functions → Secrets** → **Add new secret**: name
   `ANTHROPIC_API_KEY`, value = the key → **Save**.

That's all: the next time someone opens a rashifal, it is written and saved. Until then the app says the
daily rashifal is "not switched on yet". It is written by Claude Haiku (about ₹0.1 per reading). For richer
writing at higher cost, run in the SQL Editor:
`update app_settings set value = '"claude-sonnet-5-5"' where key = 'rashifal_model';`

## 5. Automatic checks

```bash
npm test             # database security rules, encryption, input checks, phone numbers
npm run typecheck    # finds code mistakes
npm run lint         # code style
npm run check        # all three
```

## 6. Updating

```bash
git pull             # get the latest code
npm install          # in case libraries changed
```

**The server updates itself.** Whenever server code changes on GitHub, the *Deploy server* action
(`.github/workflows/deploy-server.yml`) runs the tests, applies database changes and deploys all server
functions. It needs two secrets, added once under GitHub → repository → **Settings → Secrets and variables →
Actions**:

| Secret | Where to get it |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → your avatar → **Account preferences → Access Tokens → Generate new token** |
| `SUPABASE_DB_PASSWORD` | the database password you saved when creating the project |

You can follow each run in the repository's **Actions** tab, and start one by hand with **Run workflow**.

## Renaming the app

1. Edit [`brand.config.js`](brand.config.js): `appName`, `appNameHi`, `logo` (the gold and emerald words), `slug`, `scheme`, `androidPackage`, colours. (The tagline under the logo is `welcome.tagline` in each language file.)
2. Run `npm run make-icons` (redraws the gem icon and splash in the new colours).
3. If `scheme` changed, update the Redirect URLs in Supabase (step 4.8).

⚠️ **The Android package ID (`com.velqorastudios.ratnaaura`) can never change after the first upload to
Google Play.** Confirm the final name and package ID **before Milestone 9**.

## Publishing (Milestones 8–9, summary)

- Builds will be made with Expo's cloud builder (EAS), which needs a free Expo account (we'll ask first).
- Google Play needs a developer account (one-time **$25**) and a signed **AAB** file.
- Milestone 9 adds the store listing text and a checklist for the Data Safety form, content rating and payments.

---

## Licences you must sort out before launch

- **Swiss Ephemeris** (planet positions) is free only under the **AGPL** licence, which would
  require publishing the server's source code. It sits in its own swappable module
  (`supabase/functions/_shared/swisseph.ts` + the `@fusionstrings/swiss-eph` WebAssembly build).
  **Before launch, either buy the Swiss Ephemeris professional licence** (from Astrodienst, one-time, roughly
  CHF 750; check https://www.astro.com/swisseph) **or switch that module to a paid astrology API.**
- **Birth places** come from **GeoNames** (geonames.org), licensed **CC BY 4.0** — the app credits it in Settings.
- Fonts (Cormorant Garamond, Tiro Devanagari Hindi, Poppins, Hind) are free under the SIL Open Font License. Icons are Material Design Icons (free, Apache/MIT).
  The app icon (a faceted gem with an emerald aura in a zodiac ring) is an original drawing made by
  `scripts/make-icons.mjs`; no copyrighted images are used.

---

## Monthly cost estimates

These are **rough estimates** to plan with. Prices change, so check each provider's pricing page before launch.
1 USD ≈ ₹85–90. "Users" means people who open the app in a month.

**Assumptions:** half of users use their 3 free AI questions; 5% become paying users and ask ~30 AI questions
and send ~40 persona-chat messages a month. One "Ask AI" answer ≈ 5,000 tokens in (chart + numbers + safety
rules + question) and ≈ 1,000 tokens out. Rashifal is generated once per sign per day per language that people
actually use, and shared by everyone, so its cost does not grow with users.

### AI model choice (one setting, can be changed any time)

| Model | Price per 1M tokens (in / out) | ≈ cost per answer |
|-------|-------------------------------|-------------------|
| **Claude Opus 5.5** (`claude-opus-5-5`), default, best quality | $4 / $20 | ≈ $0.04 (₹3.5) |
| Claude Sonnet 5.5 (`claude-sonnet-5-5`), about half the cost | $2 / $10 | ≈ $0.02 (₹1.8) |
| Claude Haiku 5.5 (`claude-haiku-5-5`), cheapest, simpler answers | $0.10 / $0.50 | ≈ $0.001 (₹0.1) |

Prompt caching (re-using the fixed safety rules) lowers these further. We'll measure real costs in Milestone 5.

### Total per month

| Item | 1,000 users | 10,000 users |
|------|-------------|--------------|
| Supabase (Pro plan: database, login, functions, backups) | $25 | $25–60 (may need a bigger database add-on) |
| AI: "Ask AI" (~3,000 / ~30,000 answers) | Opus $120 · Sonnet $60 · Haiku $3 | Opus $1,200 · Sonnet $600 · Haiku $30 |
| AI: persona chats (~2,000 / ~20,000 messages, paid by users) | Opus $90 · Sonnet $45 · Haiku $3 | Opus $900 · Sonnet $450 · Haiku $25 |
| AI: daily rashifal (fixed; 12 readings per language per day; **Haiku is the current setting**) | Haiku ≈ $2–10 · Sonnet ≈ $35–200 · Opus ≈ $70–400 (≈ 6 to all 31 languages in use) | same |
| SMS OTP (~2 logins per user; less if many use Google sign-in) | $5–100 (MSG91 ≈ ₹0.2/SMS; Twilio Verify ≈ $0.05) | $50–1,000 |
| Push notifications (Expo) | free | free |
| Expo cloud builds (EAS) | free tier | free tier (or $19 plan for faster builds) |
| RevenueCat (payments helper) | free under its revenue limit | ~1% of revenue above the free limit |
| Google Play fee | 15% of in-app sales | 15% of in-app sales |
| **Rough total (excluding Play's 15%)** | **≈ $275–370** with Opus, **≈ $150–250** with Sonnet | **≈ $2,200–3,200** Opus, **≈ $1,150–2,100** Sonnet |

The AI costs of paid features (chat questions after the free 3, persona minutes/messages, PDF reports) are
covered by what users pay. Milestones 5–6 will set credit prices with a clear margin over these costs.

One-time costs: Google Play developer account $25; Swiss Ephemeris licence (≈ CHF 750) or a paid astrology API;
SMS DLT registration (small fee).
