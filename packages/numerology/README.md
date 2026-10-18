# @ratna/numerology

All numerology maths for Ratna Aura, in plain TypeScript with no dependencies,
so the same code can run in the app and on the server.

Every function has automatic tests with worked examples (`*.test.ts`).
Run them from the project folder with `npm test`.

| File | What it calculates |
| --- | --- |
| `reduce.ts` | Adding digits until one digit is left (keeping 11, 22, 33 where the method uses them) |
| `date.ts` | Reading and checking a date of birth |
| `letters.ts` | Chaldean and Pythagorean letter values, vowels |
| `core.ts` | Mulank, Bhagyank, life path, name number, soul urge, personality, maturity |
| `personal.ts` | Personal year, month and day |
| `planets.ts` | Number ↔ planet, planet friendships, lucky numbers/days/colours/gem |
| `loshu.ts` | Lo Shu grid, missing/repeated numbers, planes, Kua number |
| `compatibility.ts` | Compatibility between two people |
| `name-correction.ts` | Spelling suggestions that give a supportive name number |
| `vibration.ts` | Mobile, vehicle, house and business numbers |
