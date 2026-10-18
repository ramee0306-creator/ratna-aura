import { describe, expect, it } from 'vitest';

import { formatTimeInput, to24Hour, validateKundliForm, type KundliFormInput } from './form';

const MUMBAI = {
  name: 'Mumbai',
  state: 'Maharashtra',
  country: 'IN',
  countryName: 'India',
  latitude: 19.0728,
  longitude: 72.8826,
  timezone: 'Asia/Kolkata',
  population: 1,
  label: 'Mumbai, Maharashtra, India',
};
const TODAY = { year: 2026, month: 10, day: 18 };
const base: KundliFormInput = {
  fullName: ' Priya  Sharma ',
  gender: 'female',
  relation: 'self',
  dateText: '14/08/1990',
  timeText: '10:30',
  meridiem: 'am',
  timeUnknown: false,
  place: MUMBAI,
  isPrimary: true,
};

describe('kundli form', () => {
  it('formats and converts times', () => {
    expect(formatTimeInput('0645')).toBe('06:45');
    expect(formatTimeInput('6')).toBe('6');
    expect(to24Hour('06:45', 'am')).toBe('06:45');
    expect(to24Hour('06:45', 'pm')).toBe('18:45');
    expect(to24Hour('12:10', 'am')).toBe('00:10');
    expect(to24Hour('12:10', 'pm')).toBe('12:10');
    expect(to24Hour('13:10', 'pm')).toBeNull();
    expect(to24Hour('7:60', 'am')).toBeNull();
  });

  it('builds the profile to save', () => {
    expect(validateKundliForm(base, TODAY)).toEqual({
      ok: true,
      value: {
        fullName: 'Priya Sharma',
        gender: 'female',
        relation: 'self',
        isPrimary: true,
        birthDate: '1990-08-14',
        birthTime: '10:30',
        birthPlace: { name: 'Mumbai, Maharashtra, India', latitude: 19.0728, longitude: 72.8826, timezone: 'Asia/Kolkata' },
      },
    });
  });

  it('allows an unknown birth time and names in any script', () => {
    const r = validateKundliForm({ ...base, fullName: 'प्रिया शर्मा', timeText: '', timeUnknown: true }, TODAY);
    expect(r.ok && r.value.birthTime).toBeNull();
    expect(r.ok && r.value.fullName).toBe('प्रिया शर्मा');
  });

  it('lists every problem', () => {
    expect(
      validateKundliForm({ ...base, fullName: ' ', gender: null, dateText: '31/02/1990', timeText: '25:00', place: null }, TODAY),
    ).toEqual({ ok: false, errors: ['name', 'gender', 'date', 'time', 'place'] });
    expect(validateKundliForm({ ...base, dateText: '19/10/2026' }, TODAY)).toEqual({ ok: false, errors: ['date'] });
  });
});
