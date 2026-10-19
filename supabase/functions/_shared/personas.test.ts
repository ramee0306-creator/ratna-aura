import { expect, it } from 'vitest';

import { PERSONAS as APP, SESSION_MINUTES as APP_MINUTES } from '../../../app/src/ai/personas';
import { PERSONAS, personaInstructions, SESSION_MINUTES } from './personas.ts';

it('the app and the server list the same personas, billing and prices', () => {
  const pick = (p: { id: string; name: string; billing: string; price: number }) => ({ id: p.id, name: p.name, billing: p.billing, price: p.price });
  expect(APP.map(pick)).toEqual(PERSONAS.map(pick));
  expect(APP_MINUTES).toEqual(SESSION_MINUTES);
});

it('every persona says it is an AI', () => {
  for (const p of PERSONAS) {
    const text = personaInstructions(p);
    expect(text).toContain(`"${p.name}", an AI persona`);
    expect(text).toContain('not a real person');
    expect(text).toContain('introduce yourself as an AI');
  }
});
