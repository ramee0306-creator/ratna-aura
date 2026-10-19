import { expect, it } from 'vitest';

import { currentMonth, monthLabel } from './month';

it('uses the Indian calendar month', () => {
  // 31 Oct 2026, 20:00 UTC is already 1 Nov in India
  expect(currentMonth(Date.UTC(2026, 9, 31, 20))).toBe('2026-11');
  expect(currentMonth(Date.UTC(2026, 9, 15))).toBe('2026-10');
  expect(monthLabel('2026-10', 'en-IN')).toBe('October 2026');
});
