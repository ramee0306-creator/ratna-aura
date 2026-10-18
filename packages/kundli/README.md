# @ratna/kundli

The Vedic birth-chart (kundli) logic for Ratna Aura, in plain TypeScript.

It does **not** compute planet positions itself. Those come from an `Ephemeris`
(see `src/ephemeris.ts`), so the astronomy engine can be swapped:

- today: the Swiss Ephemeris, on the server (`supabase/functions/_shared/swisseph.ts`, AGPL);
- later, if preferred: a licensed Swiss Ephemeris or a paid astrology API — write another
  object with the same three methods and nothing else changes.

| File | What it does |
| --- | --- |
| `time.ts` | Local birth time + time zone → Universal Time and Julian Day (handles India's 1942–45 war time) |
| `zodiac.ts` | Signs, nakshatras and padas, navamsa sign, sign lords, exaltation/debilitation |
| `chart.ts` | Builds the whole kundli: lagna, planets, houses (whole-sign), retrograde, dasha |
| `dasha.ts` | Vimshottari mahadasha and antardasha dates |
| `layout.ts` | Which sign and planets go in each house box (birth chart, navamsa, Moon chart) |

The server keeps its own copy in `supabase/functions/_shared/kundli/` — run
`npm run sync-shared` after changing files here (a test checks they match).
