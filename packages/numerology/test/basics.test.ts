import { describe, expect, it } from 'vitest';

import { ageOn, dateDigits, digitSum, isLatinName, nameWords, parseIndianDate, parseIsoDate, reduce, sumDigitsIn, toIsoDate } from '../src';

describe('reducing numbers', () => {
  it('adds digits once', () => {
    expect(digitSum(1990)).toBe(19);
    expect(digitSum(0)).toBe(0);
  });

  it('reduces to one digit', () => {
    expect(reduce(1990)).toBe(1); // 19 -> 10 -> 1
    expect(reduce(29)).toBe(2); // 11 -> 2
    expect(reduce(999)).toBe(9); // 27 -> 9
    expect(reduce(9)).toBe(9);
    expect(reduce(0)).toBe(0);
  });

  it('can stop at master numbers 11, 22, 33', () => {
    expect(reduce(29, { keepMasters: true })).toBe(11);
    expect(reduce(38, { keepMasters: true })).toBe(11);
    expect(reduce(22, { keepMasters: true })).toBe(22);
    expect(reduce(33, { keepMasters: true })).toBe(33);
    expect(reduce(44, { keepMasters: true })).toBe(8);
  });

  it('rejects negative and decimal numbers', () => {
    expect(() => reduce(-1)).toThrow();
    expect(() => reduce(1.5)).toThrow();
  });

  it('adds the digits inside text', () => {
    expect(sumDigitsIn('98-76')).toBe(30);
    expect(sumDigitsIn('no digits')).toBe(0);
  });
});

describe('dates', () => {
  it('reads YYYY-MM-DD and DD/MM/YYYY', () => {
    expect(parseIsoDate('1990-08-14')).toEqual({ year: 1990, month: 8, day: 14 });
    expect(parseIndianDate('14/08/1990')).toEqual({ year: 1990, month: 8, day: 14 });
    expect(parseIndianDate('1-1-1998')).toEqual({ year: 1998, month: 1, day: 1 });
    expect(toIsoDate({ year: 1998, month: 1, day: 1 })).toBe('1998-01-01');
  });

  it('rejects dates that do not exist', () => {
    expect(parseIsoDate('2023-02-29')).toBeNull();
    expect(parseIsoDate('2024-02-29')).not.toBeNull(); // leap year
    expect(parseIsoDate('1900-02-29')).toBeNull(); // not a leap year
    expect(parseIndianDate('31/04/2000')).toBeNull();
    expect(parseIndianDate('14/13/1990')).toBeNull();
    expect(parseIndianDate('hello')).toBeNull();
  });

  it('lists the digits of DD MM YYYY', () => {
    expect(dateDigits({ year: 1990, month: 8, day: 14 })).toEqual([1, 4, 0, 8, 1, 9, 9, 0]);
  });

  it('works out age', () => {
    const birth = { year: 2008, month: 10, day: 19 };
    expect(ageOn(birth, { year: 2026, month: 10, day: 18 })).toBe(17);
    expect(ageOn(birth, { year: 2026, month: 10, day: 19 })).toBe(18);
  });
});

describe('names', () => {
  it('keeps only English letters, grouped by word', () => {
    expect(nameWords('  Amit  kumar ')).toEqual(['AMIT', 'KUMAR']);
    expect(nameWords('José-Maria')).toEqual(['JOSE', 'MARIA']);
    expect(nameWords("D'Souza 2")).toEqual(['D', 'SOUZA']);
  });

  it('tells English-letter names from other scripts', () => {
    expect(isLatinName('Amit Kumar')).toBe(true);
    expect(isLatinName('अमित')).toBe(false);
    expect(isLatinName('Amit कुमार')).toBe(false);
    expect(isLatinName('123')).toBe(false);
  });
});
