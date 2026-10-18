// Builds the birth-place list used for kundli: every Indian town in GeoNames and
// every place in the world with at least 15 000 people, each with its time zone.
//
//   npm run build-cities      ->  app/src/places/cities.data.json
//
// Data: GeoNames (geonames.org, CC BY 4.0), via the npm packages "cities.json" (names, states)
// and "all-the-cities" (population). Time zones: "@photostructure/tz-lookup" (CC0).
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'app', 'src', 'places', 'cities.data.json');

const names = require('cities.json/cities.json');
const admin1 = Object.fromEntries(require('cities.json/admin1.json').map((a) => [a.code, a.name]));
const withPopulation = require('all-the-cities');
const tzlookup = require('@photostructure/tz-lookup');

const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const key = (name, country) => `${plain(name).toLowerCase()}|${country}`;

// Population lookup: same name and country, within about 20 km.
const pop = new Map();
for (const c of withPopulation) {
  const k = key(c.name, c.country);
  if (!pop.has(k)) pop.set(k, []);
  pop.get(k).push({ lat: c.loc.coordinates[1], lon: c.loc.coordinates[0], population: c.population });
}
function populationOf(c, otherNames) {
  const near = [c.name, ...otherNames]
    .flatMap((n) => pop.get(key(n, c.country)) ?? [])
    .filter((p) => Math.abs(p.lat - c.lat) < 0.2 && Math.abs(p.lon - c.lng) < 0.2);
  return Math.max(0, ...near.map((p) => p.population));
}

// Old or popular names people still type (Indian places only).
const ALIASES = {
  Mumbai: 'Bombay', Kolkata: 'Calcutta', Chennai: 'Madras', Bengaluru: 'Bangalore', Pune: 'Poona',
  Gurugram: 'Gurgaon', Vadodara: 'Baroda', Varanasi: 'Banaras Benares Kashi', Thiruvananthapuram: 'Trivandrum',
  Kochi: 'Cochin Ernakulam', Mysuru: 'Mysore', Kozhikode: 'Calicut', Prayagraj: 'Allahabad', Shimla: 'Simla',
  Puducherry: 'Pondicherry', Mangaluru: 'Mangalore', Belagavi: 'Belgaum', Kalaburagi: 'Gulbarga',
  Visakhapatnam: 'Vizag Vishakhapatnam', Bhubaneswar: 'Bhubaneshwar', Kanpur: 'Cawnpore', Vijayawada: 'Bezawada',
  Thane: 'Thana', Panaji: 'Panjim', Tiruchirappalli: 'Trichy Tiruchi', Madurai: 'Madura', Udhagamandalam: 'Ooty',
  'New Delhi': 'Dilli', Delhi: 'Dilli',
};

const countryName = new Intl.DisplayNames(['en'], { type: 'region' });
const zones = [];
const zoneIndex = new Map();
const states = [];
const stateIndex = new Map();
const countries = {};
const indexOf = (list, map, value) => {
  if (!map.has(value)) {
    map.set(value, list.length);
    list.push(value);
  }
  return map.get(value);
};

const rows = [];
const seen = new Set();
for (const c of names) {
  const lat = Number(c.lat);
  const lon = Number(c.lng);
  const india = c.country === 'IN';
  // Indian place names are shown without accent marks (Thāne -> Thane).
  const name = india ? plain(c.name) : c.name;
  const aliases = india ? (ALIASES[name] ?? '') : '';
  const population = populationOf({ ...c, lat }, aliases ? aliases.split(' ') : []);
  if (!india && population < 15000) continue;

  const state = admin1[`${c.country}.${c.admin1}`] ?? '';
  const dedupe = `${plain(name).toLowerCase()}|${c.country}|${state}|${lat.toFixed(1)}|${lon.toFixed(1)}`;
  if (seen.has(dedupe)) continue;
  seen.add(dedupe);

  countries[c.country] ??= countryName.of(c.country) ?? c.country;
  rows.push([
    name,
    aliases,
    indexOf(states, stateIndex, india ? plain(state) : state),
    c.country,
    Math.round(lat * 1e4),
    Math.round(lon * 1e4),
    indexOf(zones, zoneIndex, tzlookup(lat, lon)),
    population,
  ]);
}
rows.sort((a, b) => b[7] - a[7] || a[0].localeCompare(b[0]));

writeFileSync(
  OUT,
  JSON.stringify({
    source: 'GeoNames (geonames.org), CC BY 4.0',
    columns: ['name', 'aliases', 'state', 'country', 'lat×10⁴', 'lon×10⁴', 'timeZone', 'population'],
    zones,
    states,
    countries,
    rows,
  }),
);
console.log(`wrote ${rows.length} places (${rows.filter((r) => r[3] === 'IN').length} in India) to app/src/places/cities.data.json`);
