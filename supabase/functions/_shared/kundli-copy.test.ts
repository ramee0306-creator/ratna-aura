import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// @ts-expect-error -- plain JavaScript build script
import { expectedKundliCopy, kundliCopy } from '../../../scripts/sync-shared.mjs';

it('the server copy of packages/kundli is up to date (run "npm run sync-shared" if this fails)', () => {
  const expected = expectedKundliCopy() as Record<string, string>;
  expect(readdirSync(kundliCopy).sort()).toEqual(Object.keys(expected));
  for (const [file, text] of Object.entries(expected)) expect(readFileSync(join(kundliCopy, file), 'utf8')).toBe(text);
});
