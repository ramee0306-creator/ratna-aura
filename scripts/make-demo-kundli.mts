// Writes the samples shown in demo mode (no server):
//   app/src/kundli/demo-kundli.json, demo-kundli-2.json (for Kundli Milan) and app/src/jyotish/demo-panchang.json
//   node --experimental-strip-types scripts/make-demo-kundli.mts
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { load } from '@fusionstrings/swiss-eph';

import { buildKundli, buildPanchang } from '../packages/kundli/src/index.ts';
import { swissEphemeris } from '../supabase/functions/_shared/swisseph.ts';

const require = createRequire(import.meta.url);
const eph = swissEphemeris(await load(new Uint8Array(readFileSync(require.resolve('@fusionstrings/swiss-eph/wasm')))));
const now = Date.parse('2026-10-18T00:00:00Z');
const write = (path: string, data: unknown) => {
  writeFileSync(new URL(`../${path}`, import.meta.url), JSON.stringify(data));
  console.log('wrote', path);
};

write(
  'app/src/kundli/demo-kundli.json',
  buildKundli({ birthDate: '1990-08-14', birthTime: '10:30', latitude: 19.0728, longitude: 72.8826, timezone: 'Asia/Kolkata' }, eph, now),
);
write(
  'app/src/kundli/demo-kundli-2.json',
  buildKundli({ birthDate: '1993-02-03', birthTime: '06:15', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata' }, eph, now),
);
write('app/src/jyotish/demo-panchang.json', buildPanchang({ date: '2024-04-23', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }, eph));
