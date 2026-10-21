// Placeholder colors are kept outside the world data so they can later be
// replaced with a tile or sprite renderer without changing terrain semantics.
export const TERRAIN_PALETTE = {
  sky: 0x83c9df,
  open: 0xb68a5b,
  soil: 0x493c39,
  soilLine: 0x5d4b44,
  deepSoil: 0x39343a,
  bottomSoil: 0x2d2e37,
  grass: 0x78a843,
  grassLight: 0x9bc85a,
  stone: 0x77736d,
  stoneLine: 0xaaa49a,
  deepRock: 0x2d2e37,
  gradeSoil: [0x584738, 0x51443b, 0x48444b, 0x3d3e49],
} as const;
