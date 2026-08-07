// Generuje rastrové PWA ikony z SVG předloh.
// `sharp` NENÍ trvalá závislost (jeho nativní modul shazoval build na Windows) —
// vygenerované PNG jsou commitnuté v public/. Ikony přegeneruj jen když měníš SVG:
//   npm i -D sharp && node scripts/gen-icons.mjs && npm uninstall sharp
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

const jobs = [
  { src: "icon.svg", out: "icon-192.png", size: 192 },
  { src: "icon.svg", out: "icon-512.png", size: 512 },
  { src: "icon-maskable.svg", out: "icon-maskable-512.png", size: 512 },
  // apple-touch-icon: iOS nemá rád průhlednost, icon.svg má tmavé pozadí — OK.
  { src: "icon.svg", out: "apple-touch-icon.png", size: 180 },
];

for (const { src, out, size } of jobs) {
  await sharp(join(pub, src))
    .resize(size, size)
    .png()
    .toFile(join(pub, out));
  console.log(`✓ ${out} (${size}×${size})`);
}
