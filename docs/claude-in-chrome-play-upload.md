# Prompt for Claude in Chrome — Ratna Aura on Google Play, up to closed testing

Copy everything below the line into Claude in Chrome. Before that, do **Step A** yourself (about 5 minutes).

## Step A — you, by hand (the upload key; Claude in Chrome cannot read files on your computer)
1. Open https://github.com/ramee0306-creator/ratna-aura/actions/workflows/make-upload-key.yml → open the latest run
   with a green tick → at the bottom, **Artifacts → upload-key** → download, then unzip it.
2. Save `upload.jks` and `passwords.txt` in your password manager or a safe folder. This is the only copy.
3. Open https://github.com/ramee0306-creator/ratna-aura/settings/secrets/actions → **New repository secret**, four times:
   - `ANDROID_UPLOAD_KEYSTORE_BASE64` → open `upload.jks.base64` in Notepad, select all, copy, paste.
   - `ANDROID_UPLOAD_STORE_PASSWORD` → the password shown in `passwords.txt`.
   - `ANDROID_UPLOAD_KEY_ALIAS` → `upload`
   - `ANDROID_UPLOAD_KEY_PASSWORD` → the same password.
4. Back on the run page, click the trash icon next to **upload-key** to delete it from GitHub.

---

You are helping me (the owner) publish my Android app **Ratna Aura** on Google Play, up to **closed testing**. I am
signed in to GitHub (account ramee0306-creator) and to Google Play Console and Google Cloud Console in this browser.
Work step by step, in order. **Stop and ask me before** anything that costs money, anything you cannot undo, and any
file upload (you cannot pick files from my computer — tell me exactly which file to choose, then wait). Do not invent
answers: use the texts given here or in the documents linked. Report briefly after each part.

Reference documents (readable once Part B1 makes the repository public):
- Guide: https://github.com/ramee0306-creator/ratna-aura/blob/main/docs/play-console-guide.md
- Store texts: https://github.com/ramee0306-creator/ratna-aura/blob/main/docs/store-listing.md
- Data safety and content rating answers: https://github.com/ramee0306-creator/ratna-aura/blob/main/docs/data-safety.md

### Part B — GitHub
1. Check https://github.com/ramee0306-creator/ratna-aura/settings/secrets/actions lists the 4 secrets
   ANDROID_UPLOAD_KEYSTORE_BASE64, ANDROID_UPLOAD_STORE_PASSWORD, ANDROID_UPLOAD_KEY_ALIAS, ANDROID_UPLOAD_KEY_PASSWORD.
   If any is missing, stop and tell me.
2. Check https://github.com/ramee0306-creator/ratna-aura/actions/workflows/make-upload-key.yml: the latest run must
   have **no** "upload-key" artifact left. If it is still there, stop and ask me to delete it.
3. **Ask me to confirm**, then make the repository public: Settings → General → Danger zone → Change repository
   visibility → Public (type the repository name to confirm). (The app is open source under the AGPL; no secrets are
   in the code.)
4. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
5. Actions → **Publish policy pages** → Run workflow (branch main). Wait until it is green, then open
   https://ramee0306-creator.github.io/ratna-aura/privacy.html and check the privacy policy shows.
6. Actions → **Build for Google Play** → Run workflow (branch main). It takes about 30 minutes; continue with Part C
   meanwhile.

### Part C — Google Cloud Console (Google sign-in for everyone)
1. Open https://console.cloud.google.com/apis/credentials/consent and pick the project used for the app's Google
   sign-in (the OAuth client used by Supabase for ratna-aura). If you are unsure which project, ask me.
2. If the publishing status is "Testing", click **Publish app** → Confirm, so status is "In production". If Google asks
   for verification, report what it asks and continue (basic e-mail/profile sign-in normally needs none).

### Part D — Play Console: create the app
1. https://play.google.com/console → **Create app**:
   - App name: `Ratna Aura: Kundli & Rashifal`
   - Default language: **English (India) – en-IN**
   - App or game: **App** · Free or paid: **Free**
   - Tick the declarations → **Create app**.

### Part E — Play Console: App content (left menu → Policy and programs → App content)
Complete each declaration:
- **Privacy policy:** `https://ramee0306-creator.github.io/ratna-aura/privacy.html`
- **App access:** "All or some functionality is restricted" → add instructions: name "Sign in", text: *Sign in with
  any Google account (Continue with Google). Test mode is on: tap Get credits → Buy to add credits without payment.*
  No username/password needed.
- **Ads:** No.
- **Content rating:** start the questionnaire; e-mail velqorasupport99@gmail.com; category "All other app types";
  answer **No** to violence, sexuality, language, controlled substances, gambling, user interaction/sharing,
  location sharing, digital purchases… **except** "Does the app allow users to purchase digital goods?" → **Yes**.
- **Target audience and content:** age groups **18 and over** only. Not designed for children.
- **News app:** No. **COVID-19 tracing:** No. **Data safety:** fill using the table in data-safety.md
  (data is encrypted in transit: Yes; users can request deletion: Yes; account deletion URL: the app itself and
  e-mail velqorasupport99@gmail.com).
- **Government app:** No. **Financial features:** "My app doesn't provide any financial features".
- **Health:** not a health app.
- **AI-generated content / Generative AI:** Yes — the app generates text with AI; users can report AI answers in the
  app (flag button next to each answer).
- If Play asks about **account deletion**: in-app (Settings → Delete my account and data) and a web request by e-mail
  to velqorasupport99@gmail.com.

### Part F — Store listing (Grow users → Store presence → Main store listing)
- App name, short description and full description: copy from store-listing.md (English).
- Graphics: **ask me to upload** these files (I will download them from
  https://github.com/ramee0306-creator/ratna-aura/tree/main/docs/store): app icon `icon-512.png`, feature graphic
  `feature-graphic.png`, phone screenshots `01-home.jpg` … `08-numerology.jpg`.
- App category: **Lifestyle**. Tags: Astrology, Horoscope, Numerology (as offered).
- Contact details: e-mail `velqorasupport99@gmail.com`, website `https://ramee0306-creator.github.io/ratna-aura/`.
- Save.

### Part G — Closed testing release
1. Check the GitHub run **Build for Google Play** (Part B6) is green. **Ask me** to download its artifact
   **ratna-aura-aab**, unzip it, and keep the `.aab` file ready.
2. Play Console → **Test and release → Testing → Closed testing** → open the default track (e.g. "Closed testing -
   Alpha") → **Create new release**.
3. If asked, accept **Play App Signing** with Google's default key.
4. ⚠️ **Ask me to confirm** before the first upload: it makes the package name **Raksha.RatnaAura** permanent. Then
   ask me to upload the `.aab` file.
5. Release name `1.0.0`. Release notes (en-IN): *First test release of Ratna Aura.* → Next → Save.
6. **Testers** tab: create an e-mail list "Ratna Aura testers" with the e-mails I give you (ask me; at least my own
   Gmail; Google needs 12 testers for 14 days before production for new personal accounts). Save, and copy the
   opt-in link for me.
7. **Countries/regions**: India (add others only if I say so).
8. **Send for review** (Publishing overview → Send changes for review). Report the status and anything Play Console
   still marks as incomplete.
