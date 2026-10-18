// Which sign and which planets go in each box of the chart drawings.
import type { Kundli } from './chart.ts';
import type { Body } from './zodiac.ts';

export type ChartKind = 'lagna' | 'navamsa' | 'moon';

export type ChartBox = {
  /** House 1–12 counted from the chart's first house */
  house: number;
  /** 0 = Aries … 11 = Pisces */
  sign: number;
  planets: { body: Body; retrograde: boolean; degreeInSign: number }[];
  isAscendant: boolean;
};

/**
 * Twelve boxes, house 1 first.
 * - lagna: the birth chart (D1), house 1 = ascendant sign
 * - navamsa: the D9 chart, house 1 = the ascendant's navamsa sign
 * - moon: Chandra kundli, house 1 = Moon sign (useful when the birth time is unknown)
 */
export function chartBoxes(kundli: Kundli, kind: ChartKind): ChartBox[] {
  const signOf = (p: { sign: number; navamsaSign: number }) => (kind === 'navamsa' ? p.navamsaSign : p.sign);
  const moon = kundli.planets.find((p) => p.body === 'moon')!;
  const first = kind === 'moon' ? moon.sign : signOf(kundli.ascendant);
  return Array.from({ length: 12 }, (_, i) => {
    const sign = (first + i) % 12;
    return {
      house: i + 1,
      sign,
      planets: kundli.planets
        .filter((p) => signOf(p) === sign)
        .map((p) => ({ body: p.body, retrograde: p.retrograde, degreeInSign: p.degreeInSign })),
      isAscendant: signOf(kundli.ascendant) === sign,
    };
  });
}
