import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error -- plain JavaScript build script
import { bundle, dashboardDir, functionNames } from '../../scripts/bundle-functions.mjs';

describe('dashboard copies of the server functions', () => {
  for (const name of functionNames() as string[]) {
    it(`${name}.ts is up to date (run "npm run bundle-functions" if this fails)`, () => {
      expect(readFileSync(join(dashboardDir, `${name}.ts`), 'utf8')).toBe(bundle(name));
    });
  }
});
