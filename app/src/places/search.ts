// Searching the built-in list of birth places (see scripts/build-cities.mjs).

export type Place = {
  name: string;
  state: string;
  /** Two-letter country code, e.g. "IN" */
  country: string;
  countryName: string;
  latitude: number;
  longitude: number;
  /** IANA time zone, e.g. "Asia/Kolkata" */
  timezone: string;
  population: number;
  /** "Mumbai, Maharashtra, India" */
  label: string;
};

type Data = {
  zones: string[];
  states: string[];
  countries: Record<string, string>;
  rows: [string, string, number, string, number, number, number, number][];
};

type Entry = { place: Place; name: string; words: string[]; aliases: string[]; region: string };

const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

let entries: Entry[] | null = null;

/** The list is loaded on first use, so it does not slow down app start. */
function load(): Entry[] {
  if (entries) return entries;
  const data = require('./cities.data.json') as Data;
  entries = data.rows.map(([name, aliases, state, country, lat, lon, zone, population]) => {
    const stateName = data.states[state];
    const countryName = data.countries[country] ?? country;
    const place: Place = {
      name,
      state: stateName,
      country,
      countryName,
      latitude: lat / 1e4,
      longitude: lon / 1e4,
      timezone: data.zones[zone],
      population,
      label: [name, stateName, countryName].filter(Boolean).join(', '),
    };
    const key = plain(name);
    return { place, name: key, words: key.split(' '), aliases: aliases ? plain(aliases).split(' ') : [], region: plain(`${stateName} ${countryName}`) };
  });
  return entries;
}

/**
 * Best matches for what the user typed, e.g. "mumb", "bombay", "aurangabad, bihar".
 * Exact names first, then names starting with the text, then other matches.
 * Within each group bigger places come first, with places in `preferCountry` counted
 * five times bigger (so Hyderabad, India comes before Hyderabad, Pakistan, but the
 * city of Dubai still beats a small Indian village of the same name).
 */
export function searchPlaces(query: string, { limit = 8, preferCountry = 'IN' }: { limit?: number; preferCountry?: string } = {}): Place[] {
  const [namePart, ...rest] = query.split(',');
  const q = plain(namePart);
  const region = plain(rest.join(' '));
  if (q.length < 2) return [];

  const scored: { entry: Entry; score: number }[] = [];
  for (const entry of load()) {
    let score: number;
    if (entry.name === q) score = 0;
    else if (entry.name.startsWith(q)) score = 1;
    else if (entry.aliases.some((a) => a.startsWith(q))) score = 2;
    else if (entry.words.some((w) => w.startsWith(q))) score = 3;
    else continue;
    if (region && !region.split(' ').every((r) => entry.region.split(' ').some((w) => w.startsWith(r)))) continue;
    scored.push({ entry, score });
  }
  const weight = (p: Place) => p.population * (p.country === preferCountry ? 5 : 1);
  scored.sort((a, b) => a.score - b.score || weight(b.entry.place) - weight(a.entry.place));
  return scored.slice(0, limit).map((s) => s.entry.place);
}
