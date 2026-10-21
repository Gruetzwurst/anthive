import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.dirname(new URL(import.meta.url).pathname);
const tilesDir = path.join(root, 'tiles');
const materials = ['topsoil', 'compact-earth', 'clay', 'stone-layer', 'deep-rock'];
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = bytes => { let c = 0xffffffff; for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const source = readPng(path.join(root, 'ground-corners-source.png'));
const tiles = [];

for (let material = 0; material < materials.length; material += 1) {
  for (let corner = 0; corner < 2; corner += 1) {
    const tile = extract(source, 5, 2, 24, material, corner);
    const cornerName = corner === 0 ? 'inner' : 'outer';
    writePng(path.join(tilesDir, `${materials[material]}-${cornerName}-corner.png`), tile);
    tiles.push(tile);
  }
}

writeAtlas(path.join(root, 'ground-corners-24px.png'), tiles, 5);
writePng(path.join(root, 'ground-tunnel-layout-preview.png'), createTunnelPreview());

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
  for (let y = 0; y < height; y += 1) {
    const filter = packed[y * (stride + 1)], from = y * (stride + 1) + 1, to = y * stride, prev = (y - 1) * stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= 3 ? pixels[to + x - 3] : 0, b = y ? pixels[prev + x] : 0, c = y && x >= 3 ? pixels[prev + x - 3] : 0, v = packed[from + x];
      pixels[to + x] = (v + (filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth(a, b, c) : 0)) & 255;
    }
  }
  return { width, height, pixels };
}

function writePng(file, image) {
  const { width, height, pixels } = image;
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const chunk = (name, data) => { const type = Buffer.from(name), out = Buffer.alloc(data.length + 12); out.writeUInt32BE(data.length, 0); type.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc32(Buffer.concat([type, data])), data.length + 8); return out; };
  const scanlines = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y += 1) pixels.copy(scanlines, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]));
}

function extract(image, columns, rows, cell, col, row) {
  const x0 = Math.round(col * image.width / columns), x1 = Math.round((col + 1) * image.width / columns);
  const y0 = Math.round(row * image.height / rows), y1 = Math.round((row + 1) * image.height / rows);
  const side = Math.min(x1 - x0, y1 - y0), ox = x0 + Math.floor((x1 - x0 - side) / 2), oy = y0 + Math.floor((y1 - y0 - side) / 2);
  const pixels = Buffer.alloc(cell * cell * 3);
  for (let y = 0; y < cell; y += 1) for (let x = 0; x < cell; x += 1) {
    const sx = ox + Math.min(side - 1, Math.floor((x + 0.5) * side / cell)), sy = oy + Math.min(side - 1, Math.floor((y + 0.5) * side / cell));
    image.pixels.copy(pixels, (y * cell + x) * 3, (sy * image.width + sx) * 3, (sy * image.width + sx) * 3 + 3);
  }
  return { width: cell, height: cell, pixels };
}

function writeAtlas(file, entries, columns) {
  const rows = Math.ceil(entries.length / columns), atlas = { width: columns * 24, height: rows * 24, pixels: Buffer.alloc(columns * 24 * rows * 24 * 3) };
  entries.forEach((tile, i) => blit(atlas, tile, (i % columns) * 24, Math.floor(i / columns) * 24));
  writePng(file, atlas);
}

function blit(target, sourceTile, x0, y0) {
  for (let y = 0; y < sourceTile.height; y += 1) {
    const sourceOffset = y * sourceTile.width * 3;
    const targetOffset = ((y0 + y) * target.width + x0) * 3;
    sourceTile.pixels.copy(target.pixels, targetOffset, sourceOffset, sourceOffset + sourceTile.width * 3);
  }
}

function createTunnelPreview() {
  const columns = 26, rows = 20, tileSize = 24;
  const target = { width: columns * tileSize, height: rows * tileSize, pixels: Buffer.alloc(columns * tileSize * rows * tileSize * 3) };
  const groundVariants = materials.map(material => [1, 2, 3].map(variant => readPng(path.join(tilesDir, `${material}-v${variant}.png`))));
  const edgeTiles = materials.map(material => readPng(path.join(tilesDir, `${material}-wall-edge.png`)));
  const cornerTiles = materials.map(material => [
    readPng(path.join(tilesDir, `${material}-inner-corner.png`)),
    readPng(path.join(tilesDir, `${material}-outer-corner.png`)),
  ]);
  const layerAt = row => Math.min(4, Math.floor(row / 4));
  const open = new Set();
  const addRect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) open.add(`${x},${y}`); };

  addRect(8, 2, 10, 16);
  addRect(3, 5, 18, 7);
  addRect(14, 7, 16, 13);
  addRect(14, 11, 23, 13);

  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    const material = layerAt(row), variant = (column + row) % 3;
    blit(target, groundVariants[material][variant], column * tileSize, row * tileSize);
  }

  const openColor = [192, 151, 99];
  for (const key of open) {
    const [column, row] = key.split(',').map(Number);
    fillCell(target, column, row, tileSize, openColor);
  }

  const directions = [
    { name: 'left', dx: -1, dy: 0 }, { name: 'right', dx: 1, dy: 0 },
    { name: 'up', dx: 0, dy: -1 }, { name: 'down', dx: 0, dy: 1 },
  ];
  for (const key of open) {
    const [column, row] = key.split(',').map(Number);
    const walls = directions.filter(({ dx, dy }) => !open.has(`${column + dx},${row + dy}`));
    if (walls.length === 0) continue;
    const material = layerAt(row), x = column * tileSize, y = row * tileSize;
    if (walls.length === 1) {
      blit(target, orient(edgeTiles[material], wallRotation(walls[0].name)), x, y);
      continue;
    }
    const adjacent = walls.some(wall => walls.some(other => wall.dx !== other.dx && wall.dy !== other.dy));
    if (adjacent) {
      const pair = walls.slice(0, 2);
      const corner = cornerTiles[material][0];
      blit(target, orient(corner, cornerRotation(pair)), x, y);
    } else {
      for (const wall of walls.slice(0, 2)) blit(target, orient(edgeTiles[material], wallRotation(wall.name)), x, y);
    }
  }

  const scaled = { width: target.width * 2, height: target.height * 2, pixels: Buffer.alloc(target.width * target.height * 12) };
  for (let y = 0; y < scaled.height; y += 1) for (let x = 0; x < scaled.width; x += 1) {
    const from = (Math.floor(y / 2) * target.width + Math.floor(x / 2)) * 3;
    target.pixels.copy(scaled.pixels, (y * scaled.width + x) * 3, from, from + 3);
  }
  return scaled;
}

function fillCell(target, column, row, tileSize, color) {
  const x0 = column * tileSize, y0 = row * tileSize;
  for (let y = 0; y < tileSize; y += 1) for (let x = 0; x < tileSize; x += 1) {
    const offset = ((y0 + y) * target.width + x0 + x) * 3;
    target.pixels[offset] = color[0]; target.pixels[offset + 1] = color[1]; target.pixels[offset + 2] = color[2];
  }
}

function orient(tile, quarterTurns) {
  const output = { width: tile.width, height: tile.height, pixels: Buffer.alloc(tile.pixels.length) };
  for (let y = 0; y < tile.height; y += 1) for (let x = 0; x < tile.width; x += 1) {
    let tx = x, ty = y;
    if (quarterTurns === 1) { tx = tile.width - 1 - y; ty = x; }
    if (quarterTurns === 2) { tx = tile.width - 1 - x; ty = tile.height - 1 - y; }
    if (quarterTurns === 3) { tx = y; ty = tile.height - 1 - x; }
    const from = (y * tile.width + x) * 3, to = (ty * tile.width + tx) * 3;
    tile.pixels.copy(output.pixels, to, from, from + 3);
  }
  return output;
}

function wallRotation(wall) {
  return ({ right: 0, down: 1, left: 2, up: 3 })[wall];
}

function cornerRotation(walls) {
  const pair = new Set(walls.map(wall => wall.name));
  if (pair.has('up') && pair.has('right')) return 0;
  if (pair.has('right') && pair.has('down')) return 1;
  if (pair.has('down') && pair.has('left')) return 2;
  return 3;
}

console.log('Created 10 corner tiles at 24x24, a 5x2 atlas, and the tunnel layout preview.');
