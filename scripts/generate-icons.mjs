// Generates every PNG icon (app install, maskable, Apple touch, favicon + .ico)
// from one cute strawberry artwork. Run with: npm run icons
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

const BG = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8b5cf6"/>
    <stop offset="0.55" stop-color="#6366f1"/>
    <stop offset="1" stop-color="#38bdf8"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.42" r="0.5">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.26"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>`;

const DEFS = `
  <linearGradient id="berry" x1="0.22" y1="0.05" x2="0.82" y2="1">
    <stop offset="0" stop-color="#ff9daa"/>
    <stop offset="0.42" stop-color="#f43f52"/>
    <stop offset="1" stop-color="#c2183a"/>
  </linearGradient>
  <linearGradient id="leaf" x1="0.2" y1="0" x2="0.6" y2="1">
    <stop offset="0" stop-color="#b4f8c8"/>
    <stop offset="0.45" stop-color="#3ecb5e"/>
    <stop offset="1" stop-color="#187a3c"/>
  </linearGradient>
  <linearGradient id="stem" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5fe08c"/>
    <stop offset="1" stop-color="#187a3c"/>
  </linearGradient>
  <radialGradient id="iris" cx="0.38" cy="0.32" r="0.85">
    <stop offset="0" stop-color="#6d95e4"/>
    <stop offset="0.55" stop-color="#1b2c5e"/>
    <stop offset="1" stop-color="#0a1128"/>
  </radialGradient>
  <radialGradient id="blush" cx="0.5" cy="0.5" r="0.55">
    <stop offset="0" stop-color="#ffc6d4" stop-opacity="0.95"/>
    <stop offset="0.6" stop-color="#ff8aa6" stop-opacity="0.75"/>
    <stop offset="1" stop-color="#ff8aa6" stop-opacity="0"/>
  </radialGradient>`;

// The strawberry itself — no background, drawn inside a 512x512 box.
const seed = (x, y, rot) =>
  `<ellipse cx="${x}" cy="${y}" rx="5.4" ry="8.2" transform="rotate(${rot} ${x} ${y})" fill="#ffd45e" opacity="0.96"/>`;

const SEEDS = [
  seed(196, 232, -14),
  seed(256, 222, 0),
  seed(316, 232, 14),
  seed(166, 292, -20),
  seed(346, 292, 20),
  seed(180, 356, -16),
  seed(332, 356, 16),
  seed(210, 396, -10),
  seed(302, 396, 10),
  seed(238, 424, -6),
  seed(274, 428, 6),
].join("\n");

const leaf = (cx, cy, rot, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"
     fill="url(#leaf)" stroke="#0f5c33" stroke-width="6"/>`;

const BODY = `M256 456
  C 214 432 176 398 160 354
  C 146 316 143 276 150 246
  C 158 210 196 190 256 190
  C 316 190 354 210 362 246
  C 369 276 366 316 352 354
  C 336 398 298 432 256 456 Z`;

const ART = `
  <clipPath id="bodyClip"><path d="${BODY}"/></clipPath>

  <ellipse cx="256" cy="262" rx="206" ry="200" fill="url(#glow)"/>

  <!-- stem -->
  <rect x="247" y="92" width="17" height="86" rx="8.5"
        transform="rotate(-8 255.5 135)" fill="url(#stem)" stroke="#0f5c33" stroke-width="5"/>

  <!-- leafy crown, fanned out -->
  ${leaf(256, 156, 0, 22, 50)}
  ${leaf(234, 160, -31, 20, 46)}
  ${leaf(278, 160, 31, 20, 46)}
  ${leaf(217, 177, -62, 18, 42)}
  ${leaf(295, 177, 62, 18, 42)}

  <!-- berry body -->
  <path d="${BODY}" fill="url(#berry)" stroke="#96122c" stroke-width="10" stroke-linejoin="round"/>

  <g clip-path="url(#bodyClip)">
    <!-- shoulder shine -->
    <ellipse cx="203" cy="228" rx="34" ry="19" transform="rotate(-28 203 228)"
             fill="#ffffff" opacity="0.38"/>

    ${SEEDS}

    <!-- blush -->
    <ellipse cx="168" cy="330" rx="34" ry="18" fill="url(#blush)"/>
    <ellipse cx="344" cy="330" rx="34" ry="18" fill="url(#blush)"/>
  </g>

  <!-- eyes -->
  <ellipse cx="206" cy="290" rx="31" ry="34" fill="#ffffff" stroke="#8d0f28" stroke-width="4"/>
  <ellipse cx="306" cy="290" rx="31" ry="34" fill="#ffffff" stroke="#8d0f28" stroke-width="4"/>
  <ellipse cx="207" cy="292" rx="24.5" ry="27.5" fill="url(#iris)"/>
  <ellipse cx="307" cy="292" rx="24.5" ry="27.5" fill="url(#iris)"/>
  <circle cx="197" cy="279" r="9.5" fill="#ffffff"/>
  <circle cx="297" cy="279" r="9.5" fill="#ffffff"/>
  <circle cx="216" cy="305" r="4.6" fill="#ffffff" opacity="0.9"/>
  <circle cx="316" cy="305" r="4.6" fill="#ffffff" opacity="0.9"/>

  <!-- smile -->
  <path d="M231 336 Q 256 364 281 336" fill="none" stroke="#4a0a1c"
        stroke-width="9" stroke-linecap="round"/>
`;

const fullIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${BG}${DEFS}</defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  ${ART}
</svg>`;

// Favicon needs fewer details to stay readable at 16–32px.
const smallIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${BG}${DEFS}</defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <g transform="translate(256 258) scale(1.12) translate(-256 -256)">${ART.replace(SEEDS, "")}</g>
</svg>`;

const maskableIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${BG}${DEFS}</defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(0.84) translate(-256 -250)">${ART}</g>
</svg>`;

const render = (svg, size) =>
  sharp(Buffer.from(svg), { density: 512 }).resize(size, size, { fit: "contain" }).png({ compressionLevel: 9 }).toBuffer();

await mkdir(outDir, { recursive: true });

const sizes = [
  [512, "icon-512.png"],
  [384, "icon-384.png"],
  [192, "icon-192.png"],
  [180, "apple-touch-icon.png"],
  [32, "favicon-32.png"],
];

for (const [size, name] of sizes) {
  const svg = size <= 48 ? smallIcon : fullIcon;
  const buf = await render(svg, size);
  await writeFile(join(outDir, name), buf);
  console.log(`  ${name.padEnd(22)} ${(buf.length / 1024).toFixed(1)} KB`);
}

const maskable = await render(maskableIcon, 512);
await writeFile(join(outDir, "maskable-512.png"), maskable);
console.log(`  ${"maskable-512.png".padEnd(22)} ${(maskable.length / 1024).toFixed(1)} KB`);

// Vector copy for anyone who wants it.
await writeFile(join(root, "public", "icon.svg"), fullIcon);

// Windows/browser fallback: 32px PNG wrapped in a 1-image .ico container.
const png32 = await render(smallIcon, 32);
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6);
ico.writeUInt8(32, 7);
ico.writeUInt8(0, 8);
ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png32.length, 14);
ico.writeUInt32LE(22, 18);
await writeFile(join(root, "public", "favicon.ico"), Buffer.concat([ico, png32]));
console.log(`  ${"favicon.ico".padEnd(22)} ${((ico.length + png32.length) / 1024).toFixed(1)} KB`);
