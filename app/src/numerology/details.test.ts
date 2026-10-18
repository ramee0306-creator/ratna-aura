import { describe, expect, it } from 'vitest';

import { formatDateInput, isoToDisplay, validateDetails } from './details';

const TODAY = { year: 2026, month: 10, day: 18 };

describe('numerology details form', () => {
  it('formats the date while typing', () => {
    expect(formatDateInput('1')).toBe('1');
    expect(formatDateInput('140')).toBe('14/0');
    expect(formatDateInput('1408')).toBe('14/08');
    expect(formatDateInput('14081990')).toBe('14/08/1990');
    expect(formatDateInput('14/08/19901234')).toBe('14/08/1990');
    expect(isoToDisplay('1990-08-14')).toBe('14/08/1990');
  });

  it('accepts good details and tidies the name', () => {
    expect(validateDetails({ fullName: '  Amit   Kumar ', dateText: '14/08/1990', gender: 'male' }, TODAY)).toEqual({
      ok: true,
      value: { fullName: 'Amit Kumar', birthDate: '1990-08-14', gender: 'male' },
    });
  });

  it('explains what is wrong', () => {
    expect(validateDetails({ fullName: 'अमित', dateText: '31/02/1990', gender: null }, TODAY)).toEqual({
      ok: false,
      errors: { name: 'invalidName', date: 'invalidDate' },
    });
    expect(validateDetails({ fullName: 'Amit', dateText: '19/10/2026', gender: null }, TODAY)).toEqual({
      ok: false,
      errors: { date: 'futureDate' },
    });
    expect(validateDetails({ fullName: 'Amit', dateText: '01/01/1850', gender: null }, TODAY)).toEqual({
      ok: false,
      errors: { date: 'tooOld' },
    });
  });
});
