// The kundli PDF report: one self-contained HTML page that the phone turns into a PDF (expo-print).
// Pure function, so it can be tested; the text comes in already translated through `t`.
import { BODIES, chartBoxes, type ChartBox, currentDasha, formatDegrees, type Kundli, manglik, NAKSHATRAS, SIGNS } from '@ratna/kundli';
import { bhagyank, isLatinName, loShuGrid, mulank, nameNumber, parseIsoDate } from '@ratna/numerology';

import { NORTH } from '@/kundli/chartGeometry';

type T = (key: string, options?: Record<string, unknown>) => string;

export type ReportPerson = {
  fullName: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  birthTime: string | null;
  birthPlace: { name: string };
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The North Indian chart as an SVG string (same layout as the screen). */
export function northChartSvg(boxes: ChartBox[], t: T, title: string): string {
  const label = (box: ChartBox) => [
    ...(box.isAscendant ? [t('kundli.short.asc')] : []),
    ...box.planets.map((p) => `${t(`kundli.short.${p.body}`)}${p.retrograde ? t('kundli.short.retro') : ''}`),
  ];
  const parts = boxes.map((box, i) => {
    const pos = NORTH[i];
    const labels = label(box);
    const rows: string[][] = [];
    for (let r = 0; r < labels.length; r += pos.perRow) rows.push(labels.slice(r, r + pos.perRow));
    const top = pos.y - ((rows.length - 1) * 21) / 2;
    const text = rows
      .map((row, r) =>
        row
          .map((l, c) => `<text x="${pos.x - ((row.length - 1) * 34) / 2 + c * 34}" y="${top + r * 21}" class="p">${esc(l)}</text>`)
          .join(''),
      )
      .join('');
    return `<text x="${pos.sx}" y="${pos.sy}" class="n">${box.sign + 1}</text>${text}`;
  });
  return `<svg viewBox="0 0 400 400" width="340" height="340" role="img" aria-label="${esc(title)}">
<rect x="1" y="1" width="398" height="398" fill="#fff" stroke="#8a6d1f" stroke-width="2"/>
<line x1="0" y1="0" x2="400" y2="400" stroke="#8a6d1f"/><line x1="400" y1="0" x2="0" y2="400" stroke="#8a6d1f"/>
<polygon points="200,1 399,200 200,399 1,200" fill="none" stroke="#8a6d1f"/>
${parts.join('\n')}
</svg>`;
}

export function kundliReportHtml(opts: { person: ReportPerson; kundli: Kundli; t: T; dateLocale: string; now: number; appName: string }): string {
  const { person, kundli, t, now } = opts;
  const date = new Intl.DateTimeFormat(opts.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
  const d = (ms: number) => date.format(new Date(ms));
  const sign = (i: number) => esc(t(`kundli.signs.${SIGNS[i]}`));
  const moon = kundli.planets.find((p) => p.body === 'moon')!;
  const running = currentDasha(kundli.dashas, now);
  const m = manglik(kundli);

  const planetRows = [
    `<tr><td>${esc(t('kundli.details.lagna'))}</td><td>${sign(kundli.ascendant.sign)}</td><td>${formatDegrees(kundli.ascendant.degreeInSign)}</td><td>${esc(t(`kundli.nakshatras.${NAKSHATRAS[kundli.ascendant.nakshatra]}`))}</td><td>1</td></tr>`,
    ...BODIES.map((body) => {
      const p = kundli.planets.find((x) => x.body === body)!;
      const tags = [p.retrograde ? t('kundli.planetsTable.retrograde') : '', p.dignity ? t(`kundli.planetsTable.${p.dignity}`) : ''].filter(Boolean).join(', ');
      return `<tr><td>${esc(t(`kundli.bodies.${body}`))}${tags ? ` <small>(${esc(tags)})</small>` : ''}</td><td>${sign(p.sign)}</td><td>${formatDegrees(p.degreeInSign)}</td><td>${esc(t(`kundli.nakshatras.${NAKSHATRAS[p.nakshatra]}`))} ${p.pada}</td><td>${p.house}</td></tr>`;
    }),
  ].join('\n');

  const dashaRows = kundli.dashas
    .map((md) => {
      const isNow = md.start <= now && now < md.end;
      return `<tr${isNow ? ' class="now"' : ''}><td>${esc(t('kundli.dasha.mahadasha', { planet: t(`kundli.bodies.${md.lord}`) }))}</td><td>${d(md.start)} – ${d(md.end)}</td></tr>`;
    })
    .join('\n');

  const birth = parseIsoDate(person.birthDate);
  const numbers = birth
    ? [
        `${esc(t('numerology.core.mulank'))}: <b>${mulank(birth)}</b>`,
        `${esc(t('numerology.core.bhagyank'))}: <b>${bhagyank(birth)}</b>`,
        ...(isLatinName(person.fullName) ? [`${esc(t('numerology.core.name'))}: <b>${nameNumber(person.fullName, 'chaldean').number}</b>`] : []),
        `${esc(t('numerology.loShu.missing'))}: <b>${loShuGrid(birth).missing.join(', ') || '–'}</b>`,
      ]
    : [];

  const chartTitle = t('kundli.chart.lagna');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(person.fullName)} – ${esc(t('kundli.title'))}</title>
<style>
  body { font-family: 'Noto Sans', 'Noto Sans Devanagari', sans-serif; color: #1d1b33; margin: 28px; font-size: 13px; }
  h1 { font-size: 22px; margin: 0; color: #5a3f0a; } h2 { font-size: 15px; margin: 22px 0 8px; color: #5a3f0a; border-bottom: 1px solid #d9c48a; padding-bottom: 3px; }
  .brand { color: #8a6d1f; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; } td, th { text-align: left; padding: 4px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { font-size: 11px; color: #666; } tr.now td { background: #fbf3dc; font-weight: bold; }
  .grid { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; } .facts td:first-child { color: #666; width: 42%; }
  svg .n { font-size: 14px; fill: #8a6d1f; text-anchor: middle; dominant-baseline: middle; }
  svg .p { font-size: 16px; font-weight: 600; fill: #1d1b33; text-anchor: middle; dominant-baseline: middle; }
  .note { color: #666; font-size: 11px; margin-top: 24px; } .page { page-break-before: always; }
</style></head><body>
<div class="brand">${esc(opts.appName)}</div>
<h1>${esc(person.fullName)}</h1>
<div>${esc(t('kundli.details.born'))}: ${esc(person.birthDate)}${person.birthTime ? `, ${esc(person.birthTime)}` : ''} · ${esc(person.birthPlace.name)}</div>
${kundli.timeKnown ? '' : `<p class="note">${esc(t('kundli.details.timeUnknown'))}</p>`}
<div class="grid">
  <div><h2>${esc(chartTitle)}</h2>${northChartSvg(chartBoxes(kundli, kundli.timeKnown ? 'lagna' : 'moon'), t, chartTitle)}</div>
  <div style="flex:1;min-width:220px"><h2>${esc(t('kundli.tabs.details'))}</h2><table class="facts">
    <tr><td>${esc(t('kundli.details.lagna'))}</td><td>${sign(kundli.ascendant.sign)} ${formatDegrees(kundli.ascendant.degreeInSign)}</td></tr>
    <tr><td>${esc(t('kundli.details.rashi'))}</td><td>${sign(moon.sign)}</td></tr>
    <tr><td>${esc(t('kundli.details.nakshatra'))}</td><td>${esc(t(`kundli.nakshatras.${NAKSHATRAS[moon.nakshatra]}`))}, ${esc(t('kundli.details.pada', { pada: moon.pada }))}</td></tr>
    ${running ? `<tr><td>${esc(t('kundli.dasha.current'))}</td><td>${esc(t(`kundli.bodies.${running.mahadasha}`))} – ${esc(t(`kundli.bodies.${running.antardasha}`))}</td></tr>` : ''}
    <tr><td>${esc(t('jyotish.milan.manglikTitle'))}</td><td>${esc(t(m.manglik ? 'jyotish.milan.manglikYes' : 'jyotish.milan.manglikNo'))}</td></tr>
    <tr><td>${esc(t('kundli.details.ayanamsa'))}</td><td>${formatDegrees(kundli.ayanamsa)}</td></tr>
  </table>
  ${numbers.length ? `<h2>${esc(t('home.numerology'))}</h2><p>${numbers.join('<br>')}</p>` : ''}
  </div>
</div>
<h2>${esc(t('kundli.tabs.planets'))}</h2>
<table><tr><th>${esc(t('kundli.planetsTable.planet'))}</th><th>${esc(t('kundli.planetsTable.sign'))}</th><th>${esc(t('kundli.planetsTable.degree'))}</th><th>${esc(t('kundli.planetsTable.nakshatra'))}</th><th>${esc(t('kundli.planetsTable.house'))}</th></tr>
${planetRows}</table>
<h2 class="page">${esc(t('kundli.tabs.dasha'))}</h2>
<p class="note">${esc(t('kundli.dasha.intro'))}</p>
<table>${dashaRows}</table>
<p class="note">${esc(t('privacy.advice'))}<br>${esc(t('extra.report.footer', { date: d(now), engine: kundli.engine }))}</p>
</body></html>`;
}
