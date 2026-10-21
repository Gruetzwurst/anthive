import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.dirname(new URL(import.meta.url).pathname);
const tileDir = path.join(root, 'tiles');
const materials = ['topsoil', 'compact-earth', 'clay', 'stone-layer', 'deep-rock'];
const edgeSource = readPng(path.join(root, 'ground-edge-variants-source.png'));
const transitionSource = readPng(path.join(root, 'layer-corner-transitions-source.png'));
const edgeTiles = [];
const transitionTiles = [];
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = bytes => { let c = 0xffffffff; for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

// The generated edge sheet has a pale separator between the two rows.
// Crop above and below it, then resize each square tile to the 24px grid.
const edgeRows = [[0, 377], [392, edgeSource.height]];
for (let material = 0; material < materials.length; material += 1) {
  for (let variant = 0; variant < 2; variant += 1) {
    const x0 = Math.round(material * edgeSource.width / materials.length);
    const x1 = Math.round((material + 1) * edgeSource.width / materials.length);
    const [y0, y1] = edgeRows[variant];
    const tile = extractSquare(edgeSource, x0, y0, x1 - x0, y1 - y0, 24);
    const suffix = variant === 0 ? 'v2' : 'v3';
    writePng(path.join(tileDir, `${materials[material]}-wall-edge-${suffix}.png`), tile);
    edgeTiles[variant * materials.length + material] = tile;
  }
}

const transitionNames = [
  'topsoil-compact-earth-corner-transition',
  'compact-earth-clay-corner-transition',
  'clay-stone-layer-corner-transition',
  'stone-layer-deep-rock-corner-transition',
];
for (let index = 0; index < transitionNames.length; index += 1) {
  const column = index % 2, row = Math.floor(index / 2);
  const x0 = Math.round(column * transitionSource.width / 2), x1 = Math.round((column + 1) * transitionSource.width / 2);
  const y0 = Math.round(row * transitionSource.height / 2), y1 = Math.round((row + 1) * transitionSource.height / 2);
  const tile = extractSquare(transitionSource, x0, y0, x1 - x0, y1 - y0, 24);
  writePng(path.join(tileDir, `${transitionNames[index]}.png`), tile);
  transitionTiles.push(tile);
}

writeAtlas(path.join(root, 'ground-edge-variants-24px.png'), edgeTiles, 5);
writeAtlas(path.join(root, 'layer-corner-transitions-24px.png'), transitionTiles, 2);
writePng(path.join(root, 'ground-edge-variants-preview.png'), scaleNearest(makeAtlas(edgeTiles, 5), 8));
writePng(path.join(root, 'layer-corner-transitions-preview.png'), scaleNearest(makeAtlas(transitionTiles, 2), 8));
console.log('Created 10 extra wall-edge variants and 4 layer-corner transitions at 24x24.');

function readPng(file) {
  const input = fs.readFileSync(file);
  const width = input.readUInt32BE(16), height = input.readUInt32BE(20);
  if (input[24] !== 8 || input[25] !== 2 || input[28] !== 0) throw new Error(`Unsupported PNG: ${file}`);
  const chunks = [];
  for (let p = 8; p < input.length;) {
    const size = input.readUInt32BE(p), type = input.toString('ascii', p + 4, p + 8);
    if (type === 'IDAT') chunks.push(input.subarray(p + 8, p + 8 + size));
    p += size + 12;
  }
  const packed = zlib.inflateSync(Buffer.concat(chunks)), stride = width * 3, pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => { const q = a + b - c, da = Math.abs(q - a), db = Math.abs(q - b), dc = Math.abs(q - c); return da <= db && da <= dc ? a : db <= dc ? b : c; };
  for (let y = 0; y < height; y += 1) {
    const filter = packed[y * (stride + 1)], from = y * (stride + 1) + 1, to = y * stride, prev = (y - 1) * stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= 3 ? pixels[to + x - 3] : 0, b = y ? pixels[prev + x] : 0, c = y && x >= 3 ? pixels[prev + x - 3] : 0, v = packed[from + x];
      pixels[to + x] = (v + (filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth(a, b, c) : 0)) & 255;
    }
  }
  return { width, height, pixels };
}

function extractSquare(image, x0, y0, width, height, size) {
  const side = Math.min(width, height), ox = x0 + Math.floor((width - side) / 2), oy = y0 + Math.floor((height - side) / 2);
  const pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const sx = ox + Math.min(side - 1, Math.floor((x + 0.5) * side / size));
    const sy = oy + Math.min(side - 1, Math.floor((y + 0.5) * side / size));
    image.pixels.copy(pixels, (y * size + x) * 3, (sy * image.width + sx) * 3, (sy * image.width + sx) * 3 + 3);
  }
  return { width: size, height: size, pixels };
}

function writeAtlas(file, entries, columns) {
  writePng(file, makeAtlas(entries, columns));
}

function makeAtlas(entries, columns) {
  const rows = Math.ceil(entries.length / columns), atlas = { width: columns * 24, height: rows * 24, pixels: Buffer.alloc(columns * 24 * rows * 24 * 3) };
  entries.forEach((tile, index) => blit(atlas, tile, index % columns * 24, Math.floor(index / columns) * 24));
  return atlas;
}

function scaleNearest(image, scale) {
  const output = { width: image.width * scale, height: image.height * scale, pixels: Buffer.alloc(image.width * image.height * scale * scale * 3) };
  for (let y = 0; y < output.height; y += 1) for (let x = 0; x < output.width; x += 1) {
    const from = (Math.floor(y / scale) * image.width + Math.floor(x / scale)) * 3;
    image.pixels.copy(output.pixels, (y * output.width + x) * 3, from, from + 3);
  }
  return output;
}

function blit(target, tile, x0, y0) {
  for (let y = 0; y < tile.height; y += 1) {
    const from = y * tile.width * 3, to = ((y0 + y) * target.width + x0) * 3;
    tile.pixels.copy(target.pixels, to, from, from + tile.width * 3);
  }
}

function writePng(file, image) {
  const { width, height, pixels } = image;
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const chunk = (name, data) => { const type = Buffer.from(name), out = Buffer.alloc(data.length + 12); out.writeUInt32BE(data.length, 0); type.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc32(Buffer.concat([type, data])), data.length + 8); return out; };
  const scanlines = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y += 1) pixels.copy(scanlines, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]));
}
