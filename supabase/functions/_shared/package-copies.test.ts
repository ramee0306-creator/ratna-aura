import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// @ts-expect-error -- plain JavaScript build script
import { copyOf, expectedCopy, PACKAGES } from '../../../scripts/sync-shared.mjs';

it.each(PACKAGES as string[])('the server copy of packages/%s is up to date (run "npm run sync-shared" if this fails)', (name) => {
  const expected = expectedCopy(name) as Record<string, string>;
  expect(readdirSync(copyOf(name)).sort()).toEqual(Object.keys(expected));
  for (const [file, text] of Object.entries(expected)) expect(readFileSync(join(copyOf(name), file), 'utf8')).toBe(text);
});
