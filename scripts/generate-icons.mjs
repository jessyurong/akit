/**
 * Generates the PWA icon set with zero dependencies.
 * Usage: node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("public/icons");
mkdirSync(OUT, { recursive: true });

/* ---------------- PNG writer ---------------- */

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
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------------- Drawing ---------------- */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const mixColor = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];

function rotEllipse(x, y, rx, ry, ang) {
  const c = Math.cos(-ang);
  const s = Math.sin(-ang);
  const nx = (x * c - y * s) / rx;
  const ny = (x * s + y * c) / ry;
  return nx * nx + ny * ny;
}

function colorAt(u, v, scale) {
  // Background gradient: violet → indigo → sky
  const t = clamp((u * 0.55 + v * 0.75) / 1.2);
  let rgb = t < 0.55 ? mixColor([124, 58, 237], [99, 102, 241], t / 0.55) : mixColor([99, 102, 241], [56, 189, 248], (t - 0.55) / 0.45);

  // Recenter for maskable safe zone
  const cu = (u - 0.5) / scale + 0.5;
  const cv = (v - 0.5) / scale + 0.5;

  // Soft glow behind the berry
  const glow = Math.hypot(cu - 0.5, cv - 0.45);
  if (glow < 0.44) {
    const k = 1 - glow / 0.44;
    rgb = mixColor(rgb, [255, 255, 255], 0.16 * k * k);
  }

  /* ---------------- strawberry body ---------------- */
  const bx = 0.5;
  const by = 0.43;
  const dx = cu - bx;
  const dy = cv - by;

  const halfWidth = (y) => {
    if (y <= 0) return 0.3 * Math.sqrt(Math.max(0, 1 - (y / 0.25) ** 2));
    return 0.3 * Math.pow(Math.max(0, 1 - y / 0.41), 0.6);
  };

  const hw = halfWidth(dy);
  const inBody = dy > -0.25 && dy < 0.41 && Math.abs(dx) < hw;

  if (inBody) {
    const shade = clamp((dy + 0.25) / 0.66);
    rgb = mixColor([255, 150, 172], [176, 18, 58], shade);

    // shoulder highlight
    if (rotEllipse(cu - 0.36, cv - 0.3, 0.11, 0.07, -0.4) < 1) {
      rgb = mixColor(rgb, [255, 235, 238], 0.45);
    }

    // seeds
    const rows = [
      { y: -0.15, xs: [-0.19, -0.065, 0.065, 0.19] },
      { y: -0.05, xs: [-0.245, -0.08, 0.08, 0.245] },
      { y: 0.06, xs: [-0.19, -0.065, 0.065, 0.19] },
      { y: 0.17, xs: [-0.145, -0.05, 0.05, 0.145] },
      { y: 0.27, xs: [-0.1, 0, 0.1] },
      { y: 0.36, xs: [-0.05, 0.05] },
    ];
    for (const row of rows) {
      for (const sx of row.xs) {
        const px = bx + sx;
        const py = by + row.y;
        if (Math.abs(sx) > halfWidth(row.y) - 0.02) continue;
        if (rotEllipse(cu - px, cv - py, 0.0115, 0.018, 0.25) < 1) rgb = [255, 238, 196];
      }
    }

    // eyes
    for (const ex of [-0.115, 0.115]) {
      if (Math.hypot(cu - (bx + ex), cv - 0.42) < 0.036) rgb = [255, 255, 255];
      if (Math.hypot(cu - (bx + ex), cv - 0.425) < 0.018) rgb = [72, 8, 29];
      if (Math.hypot(cu - (bx + ex - 0.012), cv - 0.404) < 0.007) rgb = [255, 255, 255];
    }

    // cheeks
    if (Math.hypot((cu - 0.365) / 1.6, cv - 0.5) < 0.028 || Math.hypot((cu - 0.635) / 1.6, cv - 0.5) < 0.028) {
      rgb = mixColor(rgb, [255, 228, 236], 0.55);
    }

    // smile
    if (cv > 0.505) {
      const ed = ((cu - 0.5) / 0.048) ** 2 + ((cv - 0.5) / 0.038) ** 2;
      if (ed > 0.55 && ed < 1.7) rgb = [91, 10, 30];
    }
  }

  /* ---------------- leafy crown ---------------- */
  const crownY = 0.21;
  const crownAngles = [-1.25, -0.82, -0.38, 0, 0.38, 0.82, 1.25];
  for (const a of crownAngles) {
    const lx = 0.5 + Math.sin(a) * 0.075;
    const ly = crownY - Math.cos(a) * 0.085;
    if (rotEllipse(cu - lx, cv - ly, 0.036, 0.082, -a) < 1) {
      rgb = mixColor([52, 211, 153], [21, 128, 61], clamp((cv - 0.1) / 0.3));
    }
  }

  // stem
  if (rotEllipse(cu - 0.5, cv - 0.135, 0.014, 0.045, 0) < 1) rgb = [22, 101, 52];

  // floating bubbles
  if (Math.hypot(u - 0.17, v - 0.2) < 0.04) rgb = mixColor(rgb, [255, 255, 255], 0.35);
  if (Math.hypot(u - 0.85, v - 0.74) < 0.03) rgb = mixColor(rgb, [255, 255, 255], 0.3);
  if (Math.hypot(u - 0.8, v - 0.17) < 0.019) rgb = mixColor(rgb, [255, 255, 255], 0.3);

  return rgb;
}

function render(size, scale) {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          const c = colorAt(u, v, scale);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function make(name, size, scale) {
  const png = encodePNG(size, size, render(size, scale));
  writeFileSync(resolve(OUT, name), png);
  console.log(`  ${name}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log("Generating icons:");
make("icon-192.png", 192, 0.98);
make("icon-512.png", 512, 0.98);
make("icon-384.png", 384, 0.98);
make("maskable-512.png", 512, 0.76);
make("apple-touch-icon.png", 180, 1.0);
make("favicon-32.png", 32, 1.0);
console.log("Done.");
