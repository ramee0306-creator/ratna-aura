// Copies code the server needs from the shared packages into supabase/functions,
// because Supabase deploys only what is inside that folder.
//
//   npm run sync-shared
//
// - packages/kundli/src  ->  supabase/functions/_shared/kundli/   (a test checks they match)
// - the Swiss Ephemeris WebAssembly file -> every function that lists it in supabase/config.toml (not saved in Git)
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const kundliSource = join(root, 'packages', 'kundli', 'src');
export const kundliCopy = join(root, 'supabase', 'functions', '_shared', 'kundli');
const HEADER = '// AUTO-COPIED from packages/kundli/src — edit the original, then run: npm run sync-shared\n';

/** Functions whose config.toml section lists swiss_eph.wasm under static_files. */
export function engineFunctions() {
  const config = readFileSync(join(root, 'supabase', 'config.toml'), 'utf8');
  return [...config.matchAll(/\.\/functions\/([\w-]+)\/swiss_eph\.wasm/g)].map((m) => m[1]);
}

/** file name -> contents the copy should have */
export function expectedKundliCopy() {
  return Object.fromEntries(
    readdirSync(kundliSource)
      .filter((f) => f.endsWith('.ts'))
      .sort()
      .map((f) => [f, HEADER + readFileSync(join(kundliSource, f), 'utf8')]),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  rmSync(kundliCopy, { recursive: true, force: true });
  mkdirSync(kundliCopy, { recursive: true });
  for (const [file, text] of Object.entries(expectedKundliCopy())) writeFileSync(join(kundliCopy, file), text);
  console.log('copied packages/kundli/src -> supabase/functions/_shared/kundli');

  const wasm = join(root, 'node_modules', '@fusionstrings', 'swiss-eph', 'wasm', 'swiss_eph.wasm');
  for (const name of engineFunctions()) {
    copyFileSync(wasm, join(root, 'supabase', 'functions', name, 'swiss_eph.wasm'));
    console.log(`copied swiss_eph.wasm -> supabase/functions/${name}/`);
  }
}
