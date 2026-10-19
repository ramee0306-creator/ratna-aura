import type { Kundli } from '@ratna/kundli';
import { describe, expect, it } from 'vitest';

import en from '@/i18n/locales/en';
import demo from '@/kundli/demo-kundli.json';

import { kundliReportHtml, northChartSvg } from './kundliReport';

/** A tiny stand-in for i18next's t(): looks up English text and fills {{placeholders}}. */
const t = (key: string, options: Record<string, unknown> = {}) => {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en);
  if (typeof value !== 'string') throw new Error(`missing text: ${key}`);
  return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name]));
};

const person = { fullName: 'Amit <Kumar>', gender: 'male' as const, birthDate: '1990-08-14', birthTime: '10:30', birthPlace: { name: 'Mumbai' } };
const NOW = Date.parse('2026-10-20T00:00:00Z');

describe('kundli PDF report', () => {
  const html = kundliReportHtml({ person, kundli: demo as unknown as Kundli, t, dateLocale: 'en-IN', now: NOW, appName: 'Ratna Aura' });

  it('is a full page with the person, chart, planets, dasha and numbers', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Amit &lt;Kumar&gt;'); // names are escaped
    expect(html).toContain('<svg viewBox="0 0 400 400"');
    for (const planet of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']) expect(html).toContain(`<td>${planet}`);
    expect(html.match(/mahadasha/g)?.length).toBeGreaterThanOrEqual(9);
    expect(html).toContain('class="now"'); // the running dasha is highlighted
    expect(html).toContain('Mulank: <b>5</b>');
    expect(html).toContain('Made with Ratna Aura on');
    expect(html).toContain('not medical');
  });

  it('chart has 12 sign numbers and the lagna marker', () => {
    const svg = northChartSvg([...Array(12)].map((_, i) => ({ house: i + 1, sign: i, isAscendant: i === 0, planets: [] })), t, 'Chart');
    expect(svg.match(/class="n"/g)).toHaveLength(12);
    expect(svg).toContain('>Asc<');
  });
});
