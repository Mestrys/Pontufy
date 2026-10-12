// Gera os ícones PWA do Pontufy (PNG válido via zlib + CRC32 manual, sem dependências).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function renderPng(size, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filtro "none"
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const o = rowStart + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Círculo esmeralda (#10B981) com "ponto" central escuro — fundo transparente.
function pontufyIconPixel(size) {
  const center = (size - 1) / 2;
  const radius = size * 0.34;
  const dotRadius = size * 0.14;

  return (x, y) => {
    const dx = x - center;
    const dy = y - center;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < dotRadius) return [10, 10, 10, 255];

    if (d < radius - 1) return [16, 185, 129, 255];
    if (d < radius + 1) {
      const alpha = Math.max(0, Math.min(255, Math.round((radius + 1 - d) * 128)));
      return [16, 185, 129, alpha];
    }
    return [0, 0, 0, 0];
  };
}

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [192, 512]) {
  const buffer = renderPng(size, pontufyIconPixel(size));
  const file = join(OUT_DIR, `icon-${size}x${size}.png`);
  writeFileSync(file, buffer);
  console.log(`Gerado ${file} (${buffer.length} bytes)`);
}
