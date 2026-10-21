import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.dirname(new URL(import.meta.url).pathname);
const tilesDir = path.join(root, 'tiles');
fs.mkdirSync(tilesDir, { recursive: true });

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
  const packed = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * 3, pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => { const q = a + b - c, da = Math.abs(q - a), db = Math.abs(q - b), dc = Math.abs(q - c); return da <= db && da <= dc ? a : db <= dc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = packed[y * (stride + 1)], from = y * (stride + 1) + 1, to = y * stride, prev = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= 3 ? pixels[to + x - 3] : 0, b = y ? pixels[prev + x] : 0, c = y && x >= 3 ? pixels[prev + x - 3] : 0, v = packed[from + x];
      pixels[to + x] = (v + (filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth(a, b, c) : 0)) & 255;
    }
  }
  return { width, height, pixels };
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = bytes => { let c = 0xffffffff; for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function writePng(file, width, height, pixels) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const chunk = (name, data) => { const type = Buffer.from(name), out = Buffer.alloc(data.length + 12); out.writeUInt32BE(data.length, 0); type.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc32(Buffer.concat([type, data])), data.length + 8); return out; };
  const scanlines = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) pixels.copy(scanlines, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]));
}
function extract(image, columns, rows, cell, col, row) {
  const x0 = Math.round(col * image.width / columns), x1 = Math.round((col + 1) * image.width / columns);
  const y0 = Math.round(row * image.height / rows), y1 = Math.round((row + 1) * image.height / rows);
  const side = Math.min(x1 - x0, y1 - y0), ox = x0 + Math.floor((x1 - x0 - side) / 2), oy = y0 + Math.floor((y1 - y0 - side) / 2);
  const tile = Buffer.alloc(cell * cell * 3);
  for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
    const sx = ox + Math.min(side - 1, Math.floor((x + 0.5) * side / cell)), sy = oy + Math.min(side - 1, Math.floor((y + 0.5) * side / cell));
    image.pixels.copy(tile, (y * cell + x) * 3, (sy * image.width + sx) * 3, (sy * image.width + sx) * 3 + 3);
  }
  return tile;
}
function writeAtlas(file, entries, columns) {
  const rows = Math.ceil(entries.length / columns), atlas = Buffer.alloc(columns * 24 * rows * 24 * 3);
  entries.forEach((tile, i) => { const ox = (i % columns) * 24, oy = Math.floor(i / columns) * 24; for (let y = 0; y < 24; y++) tile.copy(atlas, ((oy + y) * columns * 24 + ox) * 3, y * 72, (y + 1) * 72); });
  writePng(file, columns * 24, rows * 24, atlas);
}
function scaleNearest(image, width, height, scale) {
  const enlarged = Buffer.alloc(width * scale * height * scale * 3);
  for (let y = 0; y < height * scale; y++) for (let x = 0; x < width * scale; x++) {
    const from = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 3;
    image.copy(enlarged, (y * width * scale + x) * 3, from, from + 3);
  }
  return enlarged;
}

const materials = ['topsoil', 'compact-earth', 'clay', 'stone-layer', 'deep-rock'];
const groundSource = readPng(path.join(root, 'ground-variants-source.png'));
const groundEntries = [];
for (let variant = 0; variant < 3; variant++) for (let material = 0; material < 5; material++) {
  const tile = extract(groundSource, 5, 3, 24, material, variant);
  const name = `${materials[material]}-v${variant + 1}.png`;
  writePng(path.join(tilesDir, name), 24, 24, tile);
  groundEntries.push(tile);
}
writeAtlas(path.join(root, 'ground-variants-24px.png'), groundEntries, 5);

const checkWidth = 8 * 24, checkHeight = materials.length * (4 * 24) + (materials.length - 1) * 4;
const materialCheck = Buffer.alloc(checkWidth * checkHeight * 3, 32);
materials.forEach((material, materialIndex) => {
  const reference = readPng(path.join(root, '..', 'world-tile-sample', 'tiles', `${material}.png`)).pixels;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) {
    const variant = (x + y) % 4;
    const tile = variant === 0 ? reference : groundEntries[(variant - 1) * 5 + materialIndex];
    const px = x * 24, py = materialIndex * (4 * 24 + 4) + y * 24;
    for (let row = 0; row < 24; row++) tile.copy(materialCheck, ((py + row) * checkWidth + px) * 3, row * 72, (row + 1) * 72);
  }
});
writePng(path.join(root, 'material-repetition-check.png'), checkWidth * 4, checkHeight * 4, scaleNearest(materialCheck, checkWidth, checkHeight, 4));

const transitionNames = ['topsoil-to-compact-earth', 'compact-earth-to-clay', 'clay-to-stone-layer', 'stone-layer-to-deep-rock'];
const transitionSource = readPng(path.join(root, 'layer-transitions-source.png'));
const transitionEntries = transitionNames.map((name, i) => { const tile = extract(transitionSource, 2, 2, 24, i % 2, Math.floor(i / 2)); writePng(path.join(tilesDir, `${name}.png`), 24, 24, tile); return tile; });
writeAtlas(path.join(root, 'layer-transitions-24px.png'), transitionEntries, 2);
const transitionSheet = Buffer.alloc(48 * 48 * 3);
transitionEntries.forEach((tile, i) => { const ox = (i % 2) * 24, oy = Math.floor(i / 2) * 24; for (let y = 0; y < 24; y++) tile.copy(transitionSheet, ((oy + y) * 48 + ox) * 3, y * 72, (y + 1) * 72); });
writePng(path.join(root, 'transition-close-up.png'), 48 * 8, 48 * 8, scaleNearest(transitionSheet, 48, 48, 8));

const edgeNames = ['topsoil-wall-edge', 'compact-earth-wall-edge', 'clay-wall-edge', 'stone-layer-wall-edge', 'deep-rock-wall-edge'];
const edgeSource = readPng(path.join(root, 'ground-edges-light-tunnel-source.png'));
const edgeEntries = edgeNames.map((name, i) => { const tile = extract(edgeSource, 3, 2, 24, i % 3, Math.floor(i / 3)); writePng(path.join(tilesDir, `${name}.png`), 24, 24, tile); return tile; });
writeAtlas(path.join(root, 'ground-edges-24px.png'), edgeEntries, 5);

const transitionCheckHeight = transitionEntries.length * 24 + (transitionEntries.length - 1) * 4;
const edgeCheckHeight = 8 * 24;
const connectionCheckHeight = transitionCheckHeight + 4 + edgeCheckHeight;
const connectionCheckWidth = edgeEntries.length * (4 * 24 + 4) - 4;
const connectionCheck = Buffer.alloc(connectionCheckWidth * connectionCheckHeight * 3, 32);
transitionEntries.forEach((tile, row) => {
  const y0 = row * 28;
  for (let y = 0; y < 24; y++) for (let x = 0; x < 8; x++) tile.copy(connectionCheck, ((y0 + y) * connectionCheckWidth + x * 24) * 3, y * 72, (y + 1) * 72);
});
edgeEntries.forEach((tile, edge) => {
  const x0 = edge * 100, y0 = transitionCheckHeight + 4;
  for (let y = 0; y < 8 * 24; y++) {
    const materialTile = groundEntries[Math.floor(y / 24) % 3 * 5 + edge];
    tile.copy(connectionCheck, ((y0 + y) * connectionCheckWidth + x0) * 3, (y % 24) * 72, ((y % 24) + 1) * 72);
    for (let x = 1; x < 4; x++) materialTile.copy(connectionCheck, ((y0 + y) * connectionCheckWidth + x0 + x * 24) * 3, (y % 24) * 72, ((y % 24) + 1) * 72);
  }
});
writePng(path.join(root, 'transition-edge-check.png'), connectionCheckWidth * 4, connectionCheckHeight * 4, scaleNearest(connectionCheck, connectionCheckWidth, connectionCheckHeight, 4));
console.log(`Created ${groundEntries.length + transitionEntries.length + edgeEntries.length} tiles at 24x24.`);
