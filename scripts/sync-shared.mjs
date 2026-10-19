// Copies code the server needs from the shared packages into supabase/functions,
// because Supabase deploys only what is inside that folder.
//
//   npm run sync-shared
//
// - packages/kundli/src      ->  supabase/functions/_shared/kundli/      (a test checks they match)
// - packages/numerology/src  ->  supabase/functions/_shared/numerology/
// - the Swiss Ephemeris WebAssembly file -> every function that lists it in supabase/config.toml (not saved in Git)
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** The shared packages the server uses, copied to supabase/functions/_shared/<name>. */
export const PACKAGES = ['kundli', 'numerology'];
export const sourceOf = (name) => join(root, 'packages', name, 'src');
export const copyOf = (name) => join(root, 'supabase', 'functions', '_shared', name);
const header = (name) => `// AUTO-COPIED from packages/${name}/src — edit the original, then run: npm run sync-shared\n`;

/** Functions whose config.toml section lists swiss_eph.wasm under static_files. */
export function engineFunctions() {
  const config = readFileSync(join(root, 'supabase', 'config.toml'), 'utf8');
  return [...config.matchAll(/\.\/functions\/([\w-]+)\/swiss_eph\.wasm/g)].map((m) => m[1]);
}

/** file name -> contents the copy of a package should have */
export function expectedCopy(name) {
  return Object.fromEntries(
    readdirSync(sourceOf(name))
      .filter((f) => f.endsWith('.ts'))
      .sort()
      .map((f) => [f, header(name) + readFileSync(join(sourceOf(name), f), 'utf8')]),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const name of PACKAGES) {
    rmSync(copyOf(name), { recursive: true, force: true });
    mkdirSync(copyOf(name), { recursive: true });
    for (const [file, text] of Object.entries(expectedCopy(name))) writeFileSync(join(copyOf(name), file), text);
    console.log(`copied packages/${name}/src -> supabase/functions/_shared/${name}`);
  }

  const wasm = join(root, 'node_modules', '@fusionstrings', 'swiss-eph', 'wasm', 'swiss_eph.wasm');
  for (const name of engineFunctions()) {
    copyFileSync(wasm, join(root, 'supabase', 'functions', name, 'swiss_eph.wasm'));
    console.log(`copied swiss_eph.wasm -> supabase/functions/${name}/`);
  }
}
