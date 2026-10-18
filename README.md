# Ratna Aura

A Vedic astrology + numerology app for Android (iOS later), by **VELQORA STUDIOS**.
English and Hindi, built so Marathi and other languages can be added.

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
| 2 | Numerology engine with tests + numerology screens | ⏳ Next |
| 3 | Kundli calculations with tests, North & South Indian charts | |
| 4 | Daily rashifal, panchang, kundli matching, numerology compatibility | |
| 5 | AI chat ("Ask AI") with free questions and credits (test payments) | |
| 6 | AI astrologer / numerologist personas with per-minute / per-message billing | |
| 7 | PDF reports, full Hindi, push notifications, admin panel, privacy policy | |
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
  src/i18n/locales/      ← all text: en.ts (English), hi.ts (Hindi)
  src/auth/              ← sign-in, consent, phone-number checks
  .env.example           ← copy to app/.env and fill in (public Supabase values only)
supabase/                ← the server
  migrations/            ← database tables and security rules
  functions/             ← server functions (run on Supabase, hold the secrets)
  functions/.env.example ← copy to supabase/functions/.env (server secrets, never in Git)
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
npx supabase db push            # if there are new files in supabase/migrations
npx supabase functions deploy   # if server functions changed
```

## Renaming the app

1. Edit [`brand.config.js`](brand.config.js): `appName`, `appNameHi`, `logo` (the gold and emerald words), `tagline`, `slug`, `scheme`, `androidPackage`, colours.
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

- **Swiss Ephemeris** (planet positions, added in Milestone 3) is free only under the **AGPL** licence, which would
  require publishing the server's source code. The calculation code will sit in its own swappable module.
  **Before launch, either buy the Swiss Ephemeris professional licence** (from Astrodienst, one-time, roughly
  CHF 750; check https://www.astro.com/swisseph) **or switch that module to a paid astrology API.**
- Fonts (Cormorant Garamond, Tiro Devanagari Hindi, Poppins, Hind) are free under the SIL Open Font License. Icons are Material Design Icons (free, Apache/MIT).
  The app icon (a faceted gem with an emerald aura in a zodiac ring) is an original drawing made by
  `scripts/make-icons.mjs`; no copyrighted images are used.

---

## Monthly cost estimates

These are **rough estimates** to plan with. Prices change, so check each provider's pricing page before launch.
1 USD ≈ ₹85–90. "Users" means people who open the app in a month.

**Assumptions:** half of users use their 3 free AI questions; 5% become paying users and ask ~30 AI questions
and send ~40 persona-chat messages a month. One "Ask AI" answer ≈ 5,000 tokens in (chart + numbers + safety
rules + question) and ≈ 1,000 tokens out. Rashifal is generated once per sign per day (2 languages) and shared
by everyone, so its cost does not grow with users.

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
| AI: daily/weekly/monthly rashifal (fixed) | ≈ $35 (Opus) / $18 (Sonnet) | same |
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
