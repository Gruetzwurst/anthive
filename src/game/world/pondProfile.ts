// Visual cross-section only. No terrain, collision, or resource data is changed.
export function createPondProfile(
  centerX: number,
  tile: number,
  scale: number,
  surfaceAt: (column: number) => number,
) {
  const depths = [0.7, 1.3, 1.9, 2.4, 2.8, 3, 3.1, 3, 2.8, 2.4, 1.9, 1.3, 0.7];
  const width = tile * scale;
  const left = centerX - depths.length * width / 2;
  const ground = depths.map((_, index) => surfaceAt(Math.floor((left + (index + 0.5) * width) / tile)) * tile);
  const waterY = Math.max(...ground) + tile * 0.3 * scale;
  return {
    waterY,
    columns: depths.map((depth, index) => ({
      x: left + index * width,
      width,
      clearFromY: ground[index],
      surfaceY: waterY,
      bottomY: waterY + depth * width,
    })),
  };
}
