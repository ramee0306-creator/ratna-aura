# Launch checklist (before the first Google Play release)

⚠️ **The package ID `Raksha.RatnaAura` can NEVER change after the first upload to Google Play.**
If you want a different one (for example with "raksha" in it), change `androidPackage` in `brand.config.js` *before*
uploading anything.

## Accounts (each needs your decision; some cost money)
- [ ] Google Play Console developer account — one-time **US$25** (play.google.com/console). Use the support Gmail.
      New personal accounts must run a **closed test with at least 12 testers for 14 days** before production.
- [ ] RevenueCat account (free until revenue grows) — for Google Play purchases.
- [ ] (Optional) Firebase project — only if you later want server-sent push notifications.

## App and server
- [ ] Turn **test payments off**: Admin panel → Payments → *Live* (after RevenueCat is set up) or *Off*.
- [ ] Set your real credit pack prices (Play Console products + Admin panel/`credit_packs`).
- [ ] Make yourself admin (README → Milestone 7) and check the Admin panel numbers.
- [ ] Publish the Google sign-in (OAuth consent screen → "In production") so anyone can sign in.
- [ ] Phone OTP: SMS provider with DLT registration, or keep Google sign-in only at launch.
- [x] **Swiss Ephemeris licence**: the app is open source under the AGPL (`LICENSE`); make the repository public.
- [ ] Lawyer review of `docs/privacy-policy.md` and `docs/terms-of-use.md`. They are published by GitHub Pages
      (Settings → Pages → Source: GitHub Actions) at https://ramee0306-creator.github.io/ratna-aura/privacy.html.
- [ ] Native-speaker review of the translations (at least Hindi and your main markets).
- [ ] Test on a real phone: sign-in, kundli, PDF, rashifal, panchang, milan, Ask AI, personas, purchase, delete account.

## Google Play
- [ ] Create the app in Play Console (default language English (India), app, free, declarations).
- [ ] Upload key: create it once (README → Publishing → Upload key) and keep a backup; add the 4 GitHub secrets.
- [ ] Play App Signing: accept (Google keeps the app signing key; your upload key can be reset if lost).
- [ ] In-app products (Monetize → Products → In-app products): `q10`, `q30`, `q100` as **one-time** products.
- [ ] Subscription `premium` with base plans `monthly`, `quarterly`, `yearly` (+ 7-day free-trial offer on `yearly`);
      prices must match `subscription_plans` in the Admin panel. Turn on the grace period.
- [ ] Store screenshots: the app blocks screenshots, so take them from the web demo or a build made with
      `ALLOW_SCREENSHOTS=1` (README → Screenshots are blocked).
- [ ] Store listing (`docs/store-listing.md`), Data safety (`docs/data-safety.md`), content rating, target audience 18+.
- [ ] GitHub → Actions → *Build for Google Play* → upload the `.aab` to **Internal testing** first, then closed testing.
