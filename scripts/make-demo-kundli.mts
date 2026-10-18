// Writes the sample chart shown in demo mode (no server): app/src/kundli/demo-kundli.json
//   node --experimental-strip-types scripts/make-demo-kundli.mts
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { load } from '@fusionstrings/swiss-eph';

import { buildKundli } from '../packages/kundli/src/index.ts';
import { swissEphemeris } from '../supabase/functions/_shared/swisseph.ts';

const require = createRequire(import.meta.url);
const eph = swissEphemeris(await load(new Uint8Array(readFileSync(require.resolve('@fusionstrings/swiss-eph/wasm')))));
const kundli = buildKundli(
  { birthDate: '1990-08-14', birthTime: '10:30', latitude: 19.0728, longitude: 72.8826, timezone: 'Asia/Kolkata' },
  eph,
  Date.parse('2026-10-18T00:00:00Z'),
);
writeFileSync(new URL('../app/src/kundli/demo-kundli.json', import.meta.url), JSON.stringify(kundli));
console.log('wrote app/src/kundli/demo-kundli.json', kundli.ascendant.sign, kundli.current);
