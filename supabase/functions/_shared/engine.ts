// Loads the Swiss Ephemeris WebAssembly engine once per server instance.
import { load } from 'npm:@fusionstrings/swiss-eph@0.1.1';

import { swissEphemeris } from './swisseph.ts';

// The engine file is deployed next to each function that uses it (config.toml → static_files;
// `npm run sync-shared` puts the copies there).
// If it is missing, fall back to the exact same file from the npm CDN, checked by its fingerprint.
const WASM_SHA256 = '31d3406560fd39b91bc9dbfdff6c9111f170fde2db62ebe92581ae14e878744c';
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@fusionstrings/swiss-eph@0.1.1/wasm/swiss_eph.wasm';

async function wasmBytes(localFile: URL): Promise<Uint8Array> {
  try {
    return await Deno.readFile(localFile);
  } catch {
    const bytes = new Uint8Array(await (await fetch(WASM_CDN)).arrayBuffer());
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
    if (hash !== WASM_SHA256) throw new Error('Swiss Ephemeris download did not match its fingerprint');
    return bytes;
  }
}

let engine: ReturnType<typeof swissEphemeris> | null = null;

/** Pass `new URL('./swiss_eph.wasm', import.meta.url)` from the function's index.ts. */
export async function ephemeris(localFile: URL) {
  return (engine ??= swissEphemeris(await load(await wasmBytes(localFile))));
}
