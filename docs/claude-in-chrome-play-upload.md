# Prompt for Claude in Chrome — Ratna Aura on Google Play, up to closed testing

Do **Step A** yourself first (about 5 minutes), then copy everything below the line into Claude in Chrome.

## Step A — you, by hand (backup of the upload key)
The "Make upload key" workflow has already created the key and saved the 4 `ANDROID_UPLOAD_*` secrets. Its backup
copy is kept by GitHub for **one day only**.
1. Open https://github.com/ramee0306-creator/ratna-aura/actions/workflows/make-upload-key.yml → open the latest run
   with a green tick → at the bottom, **Artifacts → upload-key** → download, then unzip it.
2. Save `upload.jks`, `upload.jks.base64` and `passwords.txt` in your password manager or a safe folder (for example
   a private Google Drive folder). This is the only backup copy.
3. On the same run page, click the trash icon next to **upload-key** to delete it from GitHub. Do the same on any
   older run that still shows an **upload-key** artifact.
4. Open https://github.com/ramee0306-creator/ratna-aura/settings/secrets/actions → delete the secret
   **SECRETS_TOKEN** (it is no longer needed).
5. Open https://github.com/settings/personal-access-tokens → find the token you made for the key → **Revoke**.

---

You are helping me (the owner) publish my Android app **Ratna Aura** on Google Play, up to **closed testing**. I am
signed in to GitHub (account ramee0306-creator) and to Google Play Console and Google Cloud Console in this browser.
Work step by step, in order. **Stop and ask me before** anything that costs money, anything you cannot undo, and any
file upload (you cannot pick files from my computer — tell me exactly which file to choose, then wait). Never show
passwords, keys or tokens in the chat. Do not invent answers: use the texts given here or in the documents linked.
Report briefly after each part.

Reference documents (readable once Part B makes the repository public):
- Guide: https://github.com/ramee0306-creator/ratna-aura/blob/main/docs/play-console-guide.md
- Store texts: https://github.com/ramee0306-creator/ratna-aura/blob/main/docs/store-listing.md
- Data safety and content rating answers: https://github.com/ramee0306-creator/ratna-aura/blob/main/docs/data-safety.md

### Part B — GitHub
1. Check https://github.com/ramee0306-creator/ratna-aura/settings/secrets/actions lists the 4 secrets
   ANDROID_UPLOAD_KEYSTORE_BASE64, ANDROID_UPLOAD_STORE_PASSWORD, ANDROID_UPLOAD_KEY_ALIAS, ANDROID_UPLOAD_KEY_PASSWORD,
   and that **SECRETS_TOKEN is gone**. If a key secret is missing, or SECRETS_TOKEN is still there, stop and tell me.
2. Open https://github.com/ramee0306-creator/ratna-aura/actions/workflows/make-upload-key.yml and open **every** run
   in the list: none may still show an **upload-key** artifact. If one does, stop and ask me to delete it (it holds
   the key and would become downloadable by anyone once the repository is public).
3. **Ask me to confirm**, then make the repository public: Settings → General → Danger zone → Change repository
   visibility → Public (type the repository name to confirm). (The app is open source under the AGPL; no secrets are
   in the code.)
4. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
5. Actions → **Publish policy pages** → Run workflow (branch main). Wait until it is green, then open
   https://ramee0306-creator.github.io/ratna-aura/privacy.html, …/terms.html and …/refund.html and check each page
   shows. If the run fails, tell me the error shown.
6. Actions → **Build for Google Play** → Run workflow (branch main). (The package ID changed to raksha.ratnaaura, so
   the earlier build cannot be used.) It takes about 30 minutes; continue with Part C meanwhile.

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
  location sharing… **except** "Does the app allow users to purchase digital goods?" → **Yes**, and "content that
  isn't part of the initial app download (e.g. generated AI content)" → **Yes** (AI answers, AI astrologers, palm
  readings, rashifal). Its follow-ups: the AI content has no violence, sexuality, bad language, drugs or gambling →
  **No**; the AI is told to refuse such content, and users can report any answer with the flag button.
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
1. **Ask me** to download the app file: open
   https://github.com/ramee0306-creator/ratna-aura/actions/workflows/build-aab.yml → the run from Part B6 (green tick,
   started today after the package ID change — not an older one) →
   **Artifacts → ratna-aura-aab** → download and unzip it, and keep the `.aab` file ready.
2. Play Console → **Test and release → Testing → Closed testing** → open the default track (e.g. "Closed testing -
   Alpha") → **Create new release**.
3. If asked, accept **Play App Signing** with Google's default key.
4. ⚠️ **Ask me to confirm** before the first upload: it makes the package name **raksha.ratnaaura** permanent. Then
   ask me to upload the `.aab` file.
5. Release name `1.0.0`. Release notes (en-IN): *First test release of Ratna Aura.* → Next → Save.
6. **Testers** tab: create an e-mail list "Ratna Aura testers" with the e-mails I give you (ask me; at least my own
   Gmail; Google needs 12 testers for 14 days before production for new personal accounts). Save, and copy the
   opt-in link for me.
7. **Countries/regions**: India (add others only if I say so).
8. **Send for review** (Publishing overview → Send changes for review). Report the status and anything Play Console
   still marks as incomplete.
