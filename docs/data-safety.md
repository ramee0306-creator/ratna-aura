# Google Play "Data safety" form — suggested answers

Based on what the app actually does (see `docs/privacy-policy.md`). Check again before submitting.

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes (HTTPS).
**Do you provide a way for users to request that their data is deleted?** Yes — in the app (Settings → Delete my
account and data) and by e-mail.

| Data type | Collected | Shared* | Required? | Purpose |
|---|---|---|---|---|
| Personal info → Name | Yes | No | Required to make a kundli | App functionality |
| Personal info → Email address (Google sign-in) | Yes | No | Optional (phone also possible) | Account management |
| Personal info → Phone number | Yes | No | Optional (Google also possible) | Account management |
| Personal info → Other info (date/time/place of birth, gender) | Yes | No | Required for kundli | App functionality |
| Financial info → Purchase history | Yes | No | Optional | App functionality |
| Messages → Other in-app messages (AI chats) | Yes | No | Optional | App functionality |
| App activity → App interactions (credits used, tools unlocked) | Yes | No | Required | App functionality, Fraud prevention |
| Photos and videos → Photos (palm photos) | Yes, processed ephemerally (not stored) | No | Optional (only for palm reading) | App functionality |
| App info and performance → Crash logs / diagnostics | Yes (server logs) | No | Required | App functionality |

*Sending data to **service providers** that process it on our behalf (Supabase, Anthropic, RevenueCat, Google) is
**not** "sharing" under Google's definition, as long as they only process it for us.

Not collected: location, contacts, other photos or videos, audio files (voice is turned into text on the phone),
calendar, device or other IDs, web browsing.

## Content rating questionnaire (IARC)
- Category: Reference, News, or Educational → or "All other app types".
- Violence, sexual content, profanity, drugs, gambling: **No**.
- User-generated content shared with others: **No** (chats are private with the AI).
- Does the app allow users to interact or exchange information? **No** (AI only, no user-to-user chat).
- Expected rating: **Everyone / 3+**; the app itself requires 18+ at sign-up (set "Target audience: 18 and over").

## Target audience and content
- Target age group: **18 and over** only.
- Ads: **No ads**.
- Government app: No. Financial features: No (credits are a digital good sold through Google Play billing).
- AI-generated content: Yes — the app shows AI-generated text; users can report problems via the support e-mail.
