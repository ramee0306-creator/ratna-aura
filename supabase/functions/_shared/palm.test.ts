import { describe, expect, it } from 'vitest';

import { cleanReading, palmSystem, parsePhotos } from './palm.ts';

const photo = (hand: string, extra: Record<string, unknown> = {}) => ({ hand, mediaType: 'image/jpeg', data: 'A'.repeat(2000), ...extra });

describe('palm reading', () => {
  it('accepts one or two photos, one per hand', () => {
    expect(parsePhotos([photo('right')])).toHaveLength(1);
    expect(parsePhotos([photo('left'), photo('right')])).toHaveLength(2);
    expect(typeof parsePhotos([])).toBe('string');
    expect(typeof parsePhotos([photo('left'), photo('left')])).toBe('string');
    expect(typeof parsePhotos([photo('left'), photo('right'), photo('right')])).toBe('string');
  });

  it('rejects bad photos', () => {
    expect(typeof parsePhotos([photo('middle')])).toBe('string');
    expect(typeof parsePhotos([photo('left', { mediaType: 'image/gif' })])).toBe('string');
    expect(typeof parsePhotos([photo('left', { data: 'short' })])).toBe('string');
    expect(typeof parsePhotos([photo('left', { data: 'A'.repeat(1000) + '<script>' })])).toBe('string');
  });

  it('tells Claude the safety rules and the language', () => {
    const text = palmSystem('Hindi');
    expect(text).toContain('in Hindi');
    expect(text).toContain('does NOT mean a short life');
    expect(text).toContain('Never predict death');
    expect(text).toContain('You are an AI');
  });

  it('checks the answer', () => {
    expect(cleanReading({ isPalm: true, reading: ' Your heart line… ' })).toEqual({ isPalm: true, reading: 'Your heart line…' });
    expect(cleanReading({ isPalm: true, reading: '' })).toBeNull();
    expect(cleanReading(null)).toBeNull();
  });
});
