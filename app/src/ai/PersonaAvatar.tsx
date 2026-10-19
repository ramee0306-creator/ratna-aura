import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { PersonaInfo, PortraitLook } from './personas';

const INK = '#2A1E1A';
const LIP = '#9C4A3E';

/** Hair drawn behind the face (long hair falling to the shoulders). */
function HairBack({ look }: { look: PortraitLook }) {
  if (look.hair === 'long') return <Path d="M29 46 C27 24 38 16 50 16 C62 16 73 24 71 46 L73 76 C66 80 34 80 27 76 Z" fill={look.hairColor} />;
  if (look.hair === 'bun') return <Circle cx={50} cy={17} r={8} fill={look.hairColor} />;
  return null;
}

/** Hair drawn over the top of the head. */
function HairFront({ look }: { look: PortraitLook }) {
  switch (look.hair) {
    case 'short':
      return <Path d="M32 42 C30 25 40 19 50 19 C61 19 70 25 68 42 C66 33 61 28 50 28 C40 28 34 33 32 42 Z" fill={look.hairColor} />;
    case 'wavy':
      return (
        <Path
          d="M31 50 C26 30 37 18 50 18 C64 18 74 30 69 50 C68 42 66 36 62 32 C58 36 52 31 50 29 C47 33 40 33 37 31 C34 36 32 42 31 50 Z"
          fill={look.hairColor}
        />
      );
    case 'long':
    case 'bun':
      // centre parting
      return <Path d="M32 42 C31 26 40 20 50 20 C60 20 69 26 68 42 C64 32 57 27 50 26 C43 27 36 32 32 42 Z" fill={look.hairColor} />;
    case 'bald':
      return <Path d="M32 44 C32 39 33 36 34 34 L35 44 Z M68 44 C68 39 67 36 66 34 L65 44 Z" fill={look.hairColor} />;
    case 'turban':
      return (
        <G>
          <Path d="M30 38 C28 20 40 13 50 13 C60 13 72 20 70 38 C64 33 57 31 50 31 C43 31 36 33 30 38 Z" fill={look.accent} />
          <Path d="M33 33 C40 24 58 20 67 30" stroke="#00000033" strokeWidth={2} fill="none" />
          <Path d="M32 27 C42 20 56 18 66 23" stroke="#00000033" strokeWidth={2} fill="none" />
        </G>
      );
  }
}

function Beard({ look }: { look: PortraitLook }) {
  const colour = look.hairColor;
  if (look.beard === 'stubble') return <Path d="M35 50 C37 62 43 66 50 66 C57 66 63 62 65 50 C61 58 56 60 50 60 C44 60 39 58 35 50 Z" fill={colour} opacity={0.35} />;
  if (look.beard === 'short')
    return (
      <G>
        <Path d="M34 48 C35 63 42 68 50 68 C58 68 65 63 66 48 C62 58 57 60 50 60 C43 60 38 58 34 48 Z" fill={colour} />
        <Path d="M42 55 C46 52 54 52 58 55 C55 56 45 56 42 55 Z" fill={colour} />
      </G>
    );
  if (look.beard === 'full')
    return (
      <G>
        <Path d="M33 46 C33 66 41 76 50 76 C59 76 67 66 67 46 C63 57 57 60 50 60 C43 60 37 57 33 46 Z" fill={colour} />
        <Path d="M41 55 C46 51 54 51 59 55 C55 57 45 57 41 55 Z" fill={colour} />
      </G>
    );
  return null;
}

function Mark({ look }: { look: PortraitLook }) {
  if (look.mark === 'bindi') return <Circle cx={50} cy={35} r={1.6} fill="#C0262D" />;
  if (look.mark === 'tilak')
    return (
      <G>
        <Path d="M47 29 L48.5 37 M53 29 L51.5 37" stroke="#F2EEE6" strokeWidth={1.4} strokeLinecap="round" />
        <Path d="M50 31 L50 37" stroke="#C0262D" strokeWidth={1.2} strokeLinecap="round" />
      </G>
    );
  if (look.mark === 'tripundra')
    return (
      <G stroke="#F2EEE6" strokeWidth={1.2} strokeLinecap="round">
        <Path d="M42 30 L58 30 M42 32.6 L58 32.6 M42 35.2 L58 35.2" />
        <Circle cx={50} cy={32.6} r={1} fill="#C0262D" stroke="none" />
      </G>
    );
  return null;
}

function Clothes({ look }: { look: PortraitLook }) {
  return (
    <G>
      <Path d="M8 100 C11 80 27 72 50 72 C73 72 89 80 92 100 Z" fill={look.clothesColor} />
      {look.clothes === 'kurta' ? <Path d="M44 72 L50 82 L56 72" stroke="#00000040" strokeWidth={1.5} fill="none" /> : null}
      {look.clothes === 'saree' ? <Path d="M58 72 C66 73 74 76 79 80 L60 100 L44 100 C50 90 55 80 58 72 Z" fill={look.accent} /> : null}
      {look.clothes === 'shawl' ? (
        <G fill={look.accent}>
          <Path d="M20 82 C26 76 34 73 41 72 L36 100 L14 100 C15 94 17 87 20 82 Z" />
          <Path d="M80 82 C74 76 66 73 59 72 L64 100 L86 100 C85 94 83 87 80 82 Z" />
        </G>
      ) : null}
      {look.mala ? (
        <G fill="#7A3E1E">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const a = Math.PI * (0.15 + (0.7 * i) / 8);
            return <Circle key={i} cx={50 - 13 * Math.cos(a)} cy={70 + 11 * Math.sin(a)} r={1.4} />;
          })}
        </G>
      ) : null}
    </G>
  );
}

/** An illustrated portrait for each AI persona, drawn from its look (illustrations, never photos). */
export function PersonaAvatar({ persona, size = 52 }: { persona: PersonaInfo; size?: number }) {
  const { look } = persona;
  // Unique per drawing: the same persona can be on two screens at once, and a hidden screen's clip would not apply.
  const clipId = `portrait-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={50} cy={50} r={50} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Rect x={0} y={0} width={100} height={100} fill={persona.color} />
        <Circle cx={50} cy={46} r={38} fill="#FFFFFF" opacity={0.12} />
        <HairBack look={look} />
        <Clothes look={look} />
        <Rect x={43} y={56} width={14} height={18} rx={5} fill={look.skin} />
        <Rect x={43} y={60} width={14} height={6} fill="#00000018" />
        <Ellipse cx={33} cy={46} rx={3} ry={4.5} fill={look.skin} />
        <Ellipse cx={67} cy={46} rx={3} ry={4.5} fill={look.skin} />
        <Ellipse cx={50} cy={44} rx={17} ry={20} fill={look.skin} />
        <HairFront look={look} />
        <Beard look={look} />
        {/* eyebrows, eyes, nose, smile */}
        <Path d="M40 38.5 Q43.5 36.5 47 38.5 M53 38.5 Q56.5 36.5 60 38.5" stroke={INK} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <Ellipse cx={43.5} cy={43.5} rx={1.7} ry={2} fill={INK} />
        <Ellipse cx={56.5} cy={43.5} rx={1.7} ry={2} fill={INK} />
        <Path d="M50 45 Q48.5 50 50.5 50.5" stroke="#00000035" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <Path d="M45 54.5 Q50 58.5 55 54.5" stroke={look.beard === 'full' || look.beard === 'short' ? '#F2EEE6' : LIP} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Mark look={look} />
        {look.glasses ? (
          <G stroke={INK} strokeWidth={1.2} fill="#FFFFFF22">
            <Circle cx={43.5} cy={43.5} r={5} />
            <Circle cx={56.5} cy={43.5} r={5} />
            <Path d="M48.5 43 L51.5 43" />
          </G>
        ) : null}
      </G>
    </Svg>
  );
}
