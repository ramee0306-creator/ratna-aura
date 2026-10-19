import type { ChartBox } from '@ratna/kundli';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { languageInfo } from '@/i18n/languages';
import { chartFont, colors, fonts } from '@/theme';

export type ChartStyle = 'north' | 'south';

const SIZE = 400;
const LINE = colors.gold;

type Label = { text: string; color: string };

function useLabels() {
  const { t } = useTranslation();
  return (box: ChartBox): Label[] => [
    ...(box.isAscendant ? [{ text: t('kundli.short.asc'), color: colors.goldBright }] : []),
    ...box.planets.map((p) => ({
      text: `${t(`kundli.short.${p.body}`)}${p.retrograde ? t('kundli.short.retro') : ''}`,
      color: p.body === 'rahu' || p.body === 'ketu' ? colors.textMuted : colors.text,
    })),
  ];
}

/** Writes labels in rows of `perRow`, centred on (x, y). */
function Labels({ labels, x, y, perRow, size = 17 }: { labels: Label[]; x: number; y: number; perRow: number; size?: number }) {
  const { i18n } = useTranslation();
  const rows: Label[][] = [];
  for (let i = 0; i < labels.length; i += perRow) rows.push(labels.slice(i, i + perRow));
  const lineHeight = size + 4;
  const top = y - ((rows.length - 1) * lineHeight) / 2;
  return (
    <>
      {rows.map((row, r) => {
        const width = 34;
        const left = x - ((row.length - 1) * width) / 2;
        return row.map((label, c) => (
          <SvgText
            key={`${r}-${c}`}
            x={left + c * width}
            y={top + r * lineHeight}
            fill={label.color}
            fontSize={size}
            fontFamily={chartFont(i18n.language, 'semibold')}
            fontWeight="600"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {label.text}
          </SvgText>
        ));
      })}
    </>
  );
}

// North Indian chart: houses are fixed (house 1 at the top), the sign numbers move.
// For each house: where the planets go, how many fit per row, and where its sign number goes.
const NORTH: { x: number; y: number; perRow: number; sx: number; sy: number }[] = [
  { x: 200, y: 98, perRow: 3, sx: 200, sy: 178 }, // 1  top diamond
  { x: 100, y: 38, perRow: 3, sx: 100, sy: 82 }, // 2
  { x: 38, y: 100, perRow: 1, sx: 82, sy: 100 }, // 3
  { x: 98, y: 200, perRow: 3, sx: 178, sy: 200 }, // 4  left diamond
  { x: 38, y: 300, perRow: 1, sx: 82, sy: 300 }, // 5
  { x: 100, y: 362, perRow: 3, sx: 100, sy: 318 }, // 6
  { x: 200, y: 302, perRow: 3, sx: 200, sy: 222 }, // 7  bottom diamond
  { x: 300, y: 362, perRow: 3, sx: 300, sy: 318 }, // 8
  { x: 362, y: 300, perRow: 1, sx: 318, sy: 300 }, // 9
  { x: 302, y: 200, perRow: 3, sx: 222, sy: 200 }, // 10 right diamond
  { x: 362, y: 100, perRow: 1, sx: 318, sy: 100 }, // 11
  { x: 300, y: 38, perRow: 3, sx: 300, sy: 82 }, // 12
];

function NorthChart({ boxes }: { boxes: ChartBox[] }) {
  const labelsFor = useLabels();
  const { i18n } = useTranslation();
  return (
    <>
      <Rect x={1} y={1} width={SIZE - 2} height={SIZE - 2} fill={colors.backgroundDeep} stroke={LINE} strokeWidth={2} rx={6} />
      <Line x1={0} y1={0} x2={SIZE} y2={SIZE} stroke={LINE} strokeWidth={1.5} />
      <Line x1={SIZE} y1={0} x2={0} y2={SIZE} stroke={LINE} strokeWidth={1.5} />
      <Polygon points="200,1 399,200 200,399 1,200" fill="none" stroke={LINE} strokeWidth={1.5} />
      {boxes.map((box, i) => {
        const pos = NORTH[i];
        return (
          <G key={box.house}>
            <SvgText x={pos.sx} y={pos.sy} fill={colors.goldDeep} fontSize={15} fontFamily={chartFont(i18n.language, 'medium')} textAnchor="middle" alignmentBaseline="middle">
              {box.sign + 1}
            </SvgText>
            <Labels labels={labelsFor(box)} x={pos.x} y={pos.y} perRow={pos.perRow} />
          </G>
        );
      })}
    </>
  );
}

// South Indian chart: signs are fixed (Pisces top-left, then clockwise), the lagna is marked.
const SOUTH_CELL: [number, number][] = [
  [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0],
]; // index = sign (0 = Aries)

function SouthChart({ boxes, title }: { boxes: ChartBox[]; title: string }) {
  const labelsFor = useLabels();
  const { i18n } = useTranslation();
  const cell = SIZE / 4;
  const bySign = new Map(boxes.map((b) => [b.sign, b]));
  return (
    <>
      <Rect x={1} y={1} width={SIZE - 2} height={SIZE - 2} fill={colors.backgroundDeep} stroke={LINE} strokeWidth={2} rx={6} />
      {SOUTH_CELL.map(([c, r], sign) => {
        const box = bySign.get(sign)!;
        const x = c * cell;
        const y = r * cell;
        return (
          <G key={sign}>
            <Rect x={x} y={y} width={cell} height={cell} fill="none" stroke={LINE} strokeWidth={1.2} />
            {box.isAscendant ? <Line x1={x} y1={y + 26} x2={x + 26} y2={y} stroke={colors.goldBright} strokeWidth={2} /> : null}
            <SvgText x={x + cell - 8} y={y + 14} fill={colors.goldDeep} fontSize={12} fontFamily={chartFont(i18n.language, 'medium')} textAnchor="end" alignmentBaseline="middle">
              {sign + 1}
            </SvgText>
            <Labels labels={labelsFor(box)} x={x + cell / 2} y={y + cell / 2 + 6} perRow={2} size={16} />
          </G>
        );
      })}
      <SvgText x={200} y={200} fill={colors.gold} fontSize={22} fontFamily={languageInfo(i18n.language)?.script === 'latin' ? fonts.displaySemi : chartFont(i18n.language, 'semibold')} textAnchor="middle" alignmentBaseline="middle">
        {title}
      </SvgText>
    </>
  );
}

/** A square kundli chart, drawn in North or South Indian style. */
export function KundliChart({ boxes, style, title }: { boxes: ChartBox[]; style: ChartStyle; title: string }) {
  return (
    <View style={{ width: '100%', maxWidth: 400, aspectRatio: 1, alignSelf: 'center' }} accessibilityRole="image" accessibilityLabel={title}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {style === 'north' ? <NorthChart boxes={boxes} /> : <SouthChart boxes={boxes} title={title} />}
      </Svg>
    </View>
  );
}
