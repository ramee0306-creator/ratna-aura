import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Same short paths as the app (see app/tsconfig.json).
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./app/src/', import.meta.url)) }],
  },
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.expo/**', '**/dist/**'],
    testTimeout: 30_000,
  },
});
