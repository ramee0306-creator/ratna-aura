import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { load } from '@fusionstrings/swiss-eph';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildPanchang } from './kundli/index.ts';
import { cleanRashifal, RASHIFAL_SCHEMA, RASHIFAL_SYSTEM, rashifalPrompt, skyNotes } from './rashifal.ts';
import { addDays, isCalendarDate, parsePlaceRequest, todayIn } from './requests.ts';
import { swissEphemeris } from './swisseph.ts';

let eph: ReturnType<typeof swissEphemeris>;
beforeAll(async () => {
  const wasm = createRequire(import.meta.url).resolve('@fusionstrings/swiss-eph/wasm');
  eph = swissEphemeris(await load(new Uint8Array(readFileSync(wasm))));
});

const DELHI = { latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' };

describe('rashifal sky notes', () => {
  it('counts the planets from the Moon sign and describes the day', () => {
    const p = buildPanchang({ date: '2024-04-23', ...DELHI }, eph);
    const mesha = skyNotes(0, eph, p);
    expect(mesha).toContain('Day: Tuesday. Tithi at sunrise: Shukla Purnima.');
    expect(mesha).toContain('Nakshatra of the day: Chitra. Yoga: Vajra.');
    expect(mesha).toContain('The Moon moves from Kanya (Virgo) into Tula (Libra) during the day.');
    expect(mesha).toContain('- Sun (Surya) in Mesha (Aries): 1st house');
    expect(mesha).toContain('- Saturn (Shani) in Kumbha (Aquarius): 11th house');
    // the same sky from Meena: everything one house later
    expect(skyNotes(11, eph, p)).toContain('- Sun (Surya) in Mesha (Aries): 2nd house');
    expect(skyNotes(11, eph, p)).toContain('- Saturn (Shani) in Kumbha (Aquarius): 12th house');
  });
});

describe('rashifal instructions', () => {
  it('carry the safety rules', () => {
    for (const rule of ['never certainty', 'Never frighten', 'No medical, legal or financial advice', 'No black magic', 'gemstones']) {
      expect(RASHIFAL_SYSTEM).toContain(rule);
    }
  });

  it('ask for the right sign, date and language', () => {
    const text = rashifalPrompt({ sign: 4, date: '2026-10-19', language: 'Tamil', sky: 'SKY' });
    expect(text).toContain('Simha (Leo) for 2026-10-19, in Tamil');
    expect(text).toContain('SKY');
  });

  it('schema lists every field as required', () => {
    expect([...RASHIFAL_SCHEMA.required].sort()).toEqual(Object.keys(RASHIFAL_SCHEMA.properties).sort());
  });
});

describe('cleanRashifal', () => {
  const good = { headline: ' A calm day ', overview: 'o', love: 'l', career: 'c', money: 'm', health: 'h', tip: 't', luckyColour: 'Green', luckyNumber: 5 };
  it('accepts a full answer and trims it', () => {
    expect(cleanRashifal(good)).toEqual({ ...good, headline: 'A calm day' });
  });
  it('rejects missing or empty text', () => {
    expect(cleanRashifal({ ...good, love: '' })).toBeNull();
    expect(cleanRashifal({ ...good, money: undefined })).toBeNull();
    expect(cleanRashifal('text')).toBeNull();
  });
  it('keeps the lucky number between 1 and 9', () => {
    expect(cleanRashifal({ ...good, luckyNumber: 0 })!.luckyNumber).toBe(1);
    expect(cleanRashifal({ ...good, luckyNumber: 23 })!.luckyNumber).toBe(6);
  });
});

describe('request checks', () => {
  it('dates', () => {
    expect(isCalendarDate('2026-02-28')).toBe(true);
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(isCalendarDate('26-2-3')).toBe(false);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(todayIn('Asia/Kolkata', Date.parse('2026-10-18T19:00:00Z'))).toBe('2026-10-19'); // 00:30 in India
  });

  it('panchang places', () => {
    expect(parsePlaceRequest({ date: '2026-10-19', ...DELHI })).toEqual({ date: '2026-10-19', ...DELHI });
    expect(parsePlaceRequest({ date: '2026-10-19', ...DELHI, timezone: 'Mars/Olympus' })).toMatch(/timezone/);
    expect(parsePlaceRequest({ date: '2026-10-19', ...DELHI, latitude: 78 })).toMatch(/latitude/);
    expect(parsePlaceRequest(undefined)).toMatch(/date/);
  });
});
