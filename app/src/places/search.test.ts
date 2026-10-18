import { describe, expect, it } from 'vitest';

import { searchPlaces } from './search';

const labels = (q: string, o?: Parameters<typeof searchPlaces>[1]) => searchPlaces(q, o).map((p) => p.label);

describe('birth place search', () => {
  it('finds big Indian cities with their state and time zone', () => {
    const [mumbai] = searchPlaces('Mumbai');
    expect(mumbai).toMatchObject({ name: 'Mumbai', state: 'Maharashtra', country: 'IN', countryName: 'India', timezone: 'Asia/Kolkata' });
    expect(mumbai.latitude).toBeCloseTo(19.07, 1);
    expect(mumbai.longitude).toBeCloseTo(72.88, 1);
  });

  it('matches the start of a name, without accents or capitals', () => {
    expect(labels('mumb')[0]).toBe('Mumbai, Maharashtra, India');
    expect(labels('thane')[0]).toBe('Thane, Maharashtra, India');
    expect(labels('VARANASI')[0]).toBe('Varanasi, Uttar Pradesh, India');
  });

  it('understands old names', () => {
    expect(labels('Bombay')[0]).toBe('Mumbai, Maharashtra, India');
    expect(labels('bangalore')[0]).toBe('Bengaluru, Karnataka, India');
    expect(labels('Allahabad')[0]).toBe('Prayagraj, Uttar Pradesh, India');
    expect(labels('cochin')[0]).toBe('Kochi, Kerala, India');
  });

  it('can narrow by state or country after a comma', () => {
    const both = labels('Aurangabad');
    expect(both.slice(0, 2).sort()).toEqual(['Aurangabad, Bihar, India', 'Aurangabad, Maharashtra, India']);
    expect(labels('Aurangabad, bihar')).toEqual(['Aurangabad, Bihar, India']);
    expect(labels('London, united kingdom')[0]).toBe('London, England, United Kingdom');
  });

  it('prefers India, but finds places abroad too', () => {
    expect(labels('Hyderabad')[0]).toBe('Hyderabad, Telangana, India');
    expect(searchPlaces('Hyderabad').some((p) => p.country === 'PK')).toBe(true);
    expect(searchPlaces('New York')[0]).toMatchObject({ country: 'US', timezone: 'America/New_York' });
    expect(searchPlaces('Dubai')[0].timezone).toBe('Asia/Dubai');
  });

  it('needs at least two letters and respects the limit', () => {
    expect(searchPlaces('m')).toEqual([]);
    expect(searchPlaces('san', { limit: 3 })).toHaveLength(3);
  });
});
