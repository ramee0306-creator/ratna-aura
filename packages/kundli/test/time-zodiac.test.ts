import { describe, expect, it } from 'vitest';

import { dignity, formatDegrees, isValidTimeZone, julianDay, nakshatraOf, navamsaSign, normalize, offsetMs, signIndex, zonedTimeToUtc } from '../src/index.ts';

const iso = (ms: number) => new Date(ms).toISOString();

describe('birth time to Universal Time', () => {
  it('India is 5½ hours ahead of UTC', () => {
    expect(iso(zonedTimeToUtc({ year: 1990, month: 8, day: 14, hour: 10, minute: 30 }, 'Asia/Kolkata'))).toBe('1990-08-14T05:00:00.000Z');
    expect(iso(zonedTimeToUtc({ year: 2000, month: 1, day: 1, hour: 0, minute: 15 }, 'Asia/Kolkata'))).toBe('1999-12-31T18:45:00.000Z');
  });

  it('knows India used +6:30 "war time" in 1943', () => {
    expect(iso(zonedTimeToUtc({ year: 1943, month: 6, day: 1, hour: 12, minute: 0 }, 'Asia/Kolkata'))).toBe('1943-06-01T05:30:00.000Z');
  });

  it('handles summer time abroad', () => {
    expect(iso(zonedTimeToUtc({ year: 2024, month: 7, day: 1, hour: 12, minute: 0 }, 'America/New_York'))).toBe('2024-07-01T16:00:00.000Z');
    expect(iso(zonedTimeToUtc({ year: 2024, month: 1, day: 15, hour: 12, minute: 0 }, 'America/New_York'))).toBe('2024-01-15T17:00:00.000Z');
    expect(offsetMs(Date.UTC(2024, 6, 1), 'Europe/London')).toBe(3_600_000);
  });

  it('checks time-zone names', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });

  it('Julian Day of 1 Jan 2000, 12:00 UT is 2451545', () => {
    expect(julianDay(Date.UTC(2000, 0, 1, 12))).toBe(2451545);
  });
});

describe('signs, nakshatras and navamsa', () => {
  it('signs', () => {
    expect(signIndex(0)).toBe(0);
    expect(signIndex(29.999)).toBe(0);
    expect(signIndex(175.38)).toBe(5); // Virgo
    expect(signIndex(-10)).toBe(11); // Pisces
    expect(normalize(725)).toBe(5);
  });

  it('nakshatras are 13°20′ each, with 4 padas of 3°20′', () => {
    expect(nakshatraOf(0)).toEqual({ index: 0, pada: 1 }); // Ashwini
    expect(nakshatraOf(3.4)).toEqual({ index: 0, pada: 2 });
    expect(nakshatraOf(13.34)).toEqual({ index: 1, pada: 1 }); // Bharani
    expect(nakshatraOf(126.6)).toEqual({ index: 9, pada: 2 }); // Magha starts at 120°; pada 2 is 123°20′–126°40′
    expect(nakshatraOf(126.7)).toEqual({ index: 9, pada: 3 });
    expect(nakshatraOf(359.99)).toEqual({ index: 26, pada: 4 }); // Revati
  });

  it('navamsa: movable signs start from themselves, fixed from the 9th, dual from the 5th', () => {
    expect(navamsaSign(0)).toBe(0); // Aries 0° -> Aries
    expect(navamsaSign(3.4)).toBe(1); // Aries 3°24′ -> Taurus
    expect(navamsaSign(30)).toBe(9); // Taurus 0° -> Capricorn
    expect(navamsaSign(60)).toBe(6); // Gemini 0° -> Libra
    expect(navamsaSign(90)).toBe(3); // Cancer 0° -> Cancer
    expect(navamsaSign(359.9)).toBe(11); // Pisces 29°54′ -> Pisces
  });

  it('dignity', () => {
    expect(dignity('sun', 0)).toBe('exalted');
    expect(dignity('sun', 6)).toBe('debilitated');
    expect(dignity('sun', 4)).toBe('own');
    expect(dignity('mercury', 5)).toBe('exalted'); // exalted beats own sign
    expect(dignity('jupiter', 9)).toBe('debilitated');
    expect(dignity('saturn', 10)).toBe('own');
    expect(dignity('rahu', 10)).toBeNull();
  });

  it('formats degrees', () => {
    expect(formatDegrees(25.3828)).toBe('25°23′');
    expect(formatDegrees(9.9999)).toBe('10°00′');
  });
});
