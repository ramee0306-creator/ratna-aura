// AUTO-COPIED from packages/numerology/src — edit the original, then run: npm run sync-shared
// Compatibility between two people from their Mulank and Bhagyank.
import { numberRelation, type PersonNumbers, type Relation } from './planets.ts';

const POINTS: Record<Relation, number> = { same: 2, friend: 2, neutral: 1, enemy: 0 };

/** 0–4: how a regards b plus how b regards a. */
const mutual = (a: number, b: number) => POINTS[numberRelation(a, b)] + POINTS[numberRelation(b, a)];

export type CompatibilityLevel = 'excellent' | 'good' | 'average' | 'challenging';

export type Compatibility = {
  /** 0–100 */
  score: number;
  level: CompatibilityLevel;
  parts: {
    mulank: number; // 0–4
    bhagyank: number; // 0–4
    cross: number; // 0–8 (A's Mulank with B's Bhagyank, and A's Bhagyank with B's Mulank)
  };
};

/**
 * Mulank ↔ Mulank and Bhagyank ↔ Bhagyank count 35% each;
 * the two cross pairs count 15% each. The result is the same whichever person comes first.
 */
export function compatibility(a: PersonNumbers, b: PersonNumbers): Compatibility {
  const mulankPart = mutual(a.mulank, b.mulank);
  const bhagyankPart = mutual(a.bhagyank, b.bhagyank);
  const cross = mutual(a.mulank, b.bhagyank) + mutual(a.bhagyank, b.mulank);
  const score = Math.round(((mulankPart / 4) * 35 + (bhagyankPart / 4) * 35 + (cross / 8) * 30) * 100) / 100;
  const rounded = Math.round(score);
  const level: CompatibilityLevel =
    rounded >= 75 ? 'excellent' : rounded >= 55 ? 'good' : rounded >= 35 ? 'average' : 'challenging';
  return { score: rounded, level, parts: { mulank: mulankPart, bhagyank: bhagyankPart, cross } };
}
