// The planet positions come from an "ephemeris" — a separate, swappable module.
// Ratna Aura uses the Swiss Ephemeris on the server (see supabase/functions/_shared/swisseph.ts);
// anything else that implements this interface (for example a paid astrology API) can replace it.

export type PlanetState = {
  /** Sidereal (Lahiri) longitude in degrees, 0 ≤ x < 360 */
  longitude: number;
  /** Degrees per day; negative means retrograde */
  speed: number;
};

export type GrahaPositions = Record<'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu', PlanetState>;

export interface Ephemeris {
  /** Short description shown in reports, e.g. "Swiss Ephemeris 2.10 (Moshier), Lahiri" */
  readonly name: string;
  /** Sidereal positions (Lahiri ayanamsa) at a moment given as Julian Day (UT). Rahu = lunar node. */
  positions(jdUt: number): GrahaPositions;
  /** Sidereal ascendant (lagna) in degrees for a place. Longitude is positive east. */
  ascendant(jdUt: number, latitude: number, longitude: number): number;
  /** Lahiri ayanamsa in degrees. */
  ayanamsa(jdUt: number): number;
}
