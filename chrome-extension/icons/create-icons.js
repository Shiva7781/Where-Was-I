/**
 * Generates PNG icons for the Chrome extension using only Node.js built-ins.
 * Run once: node icons/create-icons.js
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ──────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG chunk builder ─────────────────────────────────────────────
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf  = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ── Draw a simple globe icon ──────────────────────────────────────
// Returns raw RGBA pixel rows (each row = [r,g,b,a] × width)
function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);   // RGBA
  const cx = size / 2;
  const cy = size / 2;
  const R  = size / 2 - 1;
  const BG = [11, 17, 32, 255];    // #0b1120 (dark navy)
  const GLOBE = [59, 130, 246, 255];  // #3b82f6 (blue)
  const LINE  = [96, 165, 250, 255]; // lighter blue lines
  const WHITE = [248, 250, 252, 255];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const off = (y * size + x) * 4;

      if (dist > R) {
        // Outside circle — transparent
        pixels[off]     = BG[0];
        pixels[off + 1] = BG[1];
        pixels[off + 2] = BG[2];
        pixels[off + 3] = 0;
        continue;
      }

      // Inside globe
      let color = GLOBE;

      // Equator line (±10% of R)
      if (Math.abs(dy) < R * 0.1) color = LINE;

      // Vertical meridian (±10% of R)
      if (Math.abs(dx) < R * 0.1) color = LINE;

      // Rim highlight (outer ring)
      if (dist > R * 0.85) color = WHITE;

      pixels[off]     = color[0];
      pixels[off + 1] = color[1];
      pixels[off + 2] = color[2];
      pixels[off + 3] = color[3];
    }
  }
  return pixels;
}

// ── Encode as PNG ─────────────────────────────────────────────────
function createPNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8]  = 8; // bit depth
  ihdrData[9]  = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const pixels = drawIcon(size);

  // Build raw scanlines (filter byte 0 per row)
  const raw = Buffer.allocUnsafe(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0; // filter: None
    pixels.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Write files ───────────────────────────────────────────────────
const outDir = path.join(__dirname);
const sizes  = [16, 32, 48, 128];

for (const size of sizes) {
  const outPath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(outPath, createPNG(size));
  console.log(`✅ Created ${outPath}`);
}

console.log('\nDone! Load the chrome-extension/ folder in chrome://extensions (Developer mode).');
