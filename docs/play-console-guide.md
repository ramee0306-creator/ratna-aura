# Putting Ratna Aura on Google Play — step by step

You can follow this yourself, or give it to **Claude in Chrome** ("Follow docs/play-console-guide.md in the
ratna-aura repository, part by part, and stop to ask me before anything that costs money or is permanent").
Everything below is free on an existing Play Console account.

⚠️ **The package ID `raksha.ratnaaura` becomes permanent with the first upload in Part 3.**

## Part 0 — before Play Console (GitHub, once)
1. **Upload key.** GitHub → ratna-aura → **Actions** → **Make upload key** → open the latest run (green tick) →
   **Artifacts → upload-key** → download and unzip.
   - Save `upload.jks` and `passwords.txt` in your password manager (this is the only copy).
   - GitHub → ratna-aura → **Settings → Secrets and variables → Actions → New repository secret**, four times, with the
     names and values listed in `passwords.txt` (the value of `ANDROID_UPLOAD_KEYSTORE_BASE64` is the whole contents of
     `upload.jks.base64`).
   - Back on the run page, delete the **upload-key** artifact (trash icon).
2. **Make the repository public** (needed for the open-source licence and for the policy web pages):
   ratna-aura → **Settings → General → Danger zone → Change visibility → Public**.
3. **Policy web pages:** ratna-aura → **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then
   **Actions → Publish policy pages → Run workflow**. After 1–2 minutes these addresses work:
   - https://ramee0306-creator.github.io/ratna-aura/privacy.html
   - https://ramee0306-creator.github.io/ratna-aura/terms.html
   - https://ramee0306-creator.github.io/ratna-aura/refund.html
4. **Google sign-in for everyone:** Google Cloud Console → the project used for Google sign-in →
   **APIs & Services → OAuth consent screen → Publish app** (status "In production").

## Part 1 — create the app
Play Console → **Create app**:
- App name: **Ratna Aura: Kundli & Rashifal**
- Default language: **English (India) – en-IN**
- App or game: **App** · Free or paid: **Free** (purchases happen inside the app)
- Tick the declarations (Developer Program Policies, US export laws) → **Create app**.
- When asked about **Play App Signing**, accept Google's default (Google keeps the app signing key).

## Part 2 — App content (Policy → App content)
- **Privacy policy:** https://ramee0306-creator.github.io/ratna-aura/privacy.html
- **App access:** "All or some functionality is restricted" → instructions: *"Sign in with any Google account
  (Continue with Google). Test mode is on: tap Get credits → Buy to add credits without payment."*
- **Ads:** No, the app does not contain ads.
- **Content rating:** answers in `docs/data-safety.md` → *Content rating questionnaire*.
- **Target audience:** **18 and over** only.
- **Data safety:** answers in `docs/data-safety.md` (table at the top).
- **Government app:** No · **Financial features:** none · **Health:** not a health app.
- **AI-generated content:** Yes — users can report AI answers in the app (flag button).
- **News app:** No.

## Part 3 — first upload (Internal testing)
1. GitHub → ratna-aura → **Actions → Build for Google Play → Run workflow**. When it finishes (about 30 minutes),
   download the artifact **ratna-aura-aab** and unzip it (a `.aab` file).
2. Play Console → **Testing → Internal testing → Create new release** → upload the `.aab`.
   ⚠️ This fixes the package ID `raksha.ratnaaura` forever.
3. Release name: `1.0.0 (1)` · Release notes (en-IN): *First test release.* → **Next → Save → Start rollout**.
4. **Testers** tab → create a list with your Gmail (and anyone helping test) → copy the **opt-in link**, open it on
   your phone, accept, and install Ratna Aura from Google Play.

## Part 4 — store listing (Grow → Store presence → Main store listing)
- Texts: `docs/store-listing.md` (app name, short description, full description).
- Graphics from `docs/store/`: app icon `icon-512.png`, feature graphic `feature-graphic.png`, phone screenshots
  `01-home.jpg` … `08-numerology.jpg`.
- Category **Lifestyle** · Tags: Astrology, Horoscope, Numerology.
- Contact e-mail **velqorasupport99@gmail.com** · Website: https://ramee0306-creator.github.io/ratna-aura/

## Part 5 — closed testing, then production
- Personal accounts created after November 2023: run a **closed test with at least 12 testers for 14 days**
  (Testing → Closed testing), then apply for production access.
- Before production: switch real payments on (README → *Real payments*: Play products `q10` ₹74, `q30` ₹194,
  `q100` ₹524 and subscription `premium` with `monthly` ₹299, `quarterly` ₹749, `yearly` ₹2,249 + 7-day trial;
  RevenueCat; then Admin panel → Payments → **Live**). Test mode gives free credits to everyone, so it must not be on
  in production.
