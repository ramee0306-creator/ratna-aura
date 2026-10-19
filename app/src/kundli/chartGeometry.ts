// Where things go in the 400×400 kundli chart drawings (used by the screen and the PDF report).

// North Indian chart: houses are fixed (house 1 at the top), the sign numbers move.
// For each house: where the planets go, how many fit per row, and where its sign number goes.
export const NORTH: { x: number; y: number; perRow: number; sx: number; sy: number }[] = [
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

// South Indian chart: signs are fixed (Pisces top-left, then clockwise), the lagna is marked.
export const SOUTH_CELL: [number, number][] = [
  [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0],
]; // index = sign (0 = Aries)

