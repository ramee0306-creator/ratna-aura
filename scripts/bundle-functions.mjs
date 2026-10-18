// Turns each server function (plus the _shared files it uses) into ONE file,
// so it can be pasted into the Supabase website's function editor without
// installing anything. Output: supabase/dashboard/<function-name>.ts
//
//   npm run bundle-functions
//
// The test in supabase/dashboard/bundles.test.ts fails if these copies are
// out of date, so they never drift from the real source.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const functionsDir = join(root, 'supabase', 'functions');
export const dashboardDir = join(root, 'supabase', 'dashboard');

const IMPORT = /^import\s[\s\S]*?\sfrom\s+['"]([^'"]+)['"];?[ \t]*\n/gm;

/** Names of the deployable functions (every folder except _shared). */
export function functionNames() {
  return readdirSync(functionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort();
}

/** Returns the single-file version of one function. */
export function bundle(name) {
  const external = new Set();
  const seen = new Set();
  const parts = [];

  const visit = (file, isEntry) => {
    if (seen.has(file)) return;
    seen.add(file);
    let code = readFileSync(file, 'utf8');
    for (const [statement, from] of code.matchAll(IMPORT)) {
      if (from.startsWith('.')) visit(resolve(dirname(file), from), false);
      else external.add(statement.trim());
    }
    code = code.replace(IMPORT, '');
    if (!isEntry) code = code.replace(/^export (?=(async |const |let |function |type |class |interface ))/gm, '');
    const label = file.slice(functionsDir.length + 1);
    parts.push(`// ---- ${label} ----\n${code.trim()}\n`);
  };
  visit(join(functionsDir, name, 'index.ts'), true);

  return [
    `// AUTO-GENERATED from supabase/functions/${name} — do not edit by hand.`,
    '// Paste this whole file into the Supabase dashboard function editor.',
    '// Regenerate with: npm run bundle-functions',
    ...external,
    '',
    parts.join('\n'),
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(dashboardDir, { recursive: true });
  for (const name of functionNames()) {
    writeFileSync(join(dashboardDir, `${name}.ts`), bundle(name));
    console.log(`wrote supabase/dashboard/${name}.ts`);
  }
}
