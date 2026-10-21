export function applySurfaceSkyMask(
  sourcePixels: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(sourcePixels);

  for (let column = 0; column < width; column += 1) {
    let firstGrassRow = -1;

    for (let row = 0; row < height; row += 1) {
      const offset = (row * width + column) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      if (green > red * 1.15 && green > blue * 1.05) {
        firstGrassRow = row;
        break;
      }
    }

    if (firstGrassRow < 0) continue;

    for (let row = 0; row < firstGrassRow; row += 1) {
      pixels[(row * width + column) * 4 + 3] = 0;
    }
  }

  return pixels;
}
