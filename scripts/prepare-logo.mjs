import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Derivatives of the owner's original artwork; the source file is preserved.
const source = "LOGO EVOLUÇÃO VISÍVEL.png";
await mkdir("public/brand", { recursive: true });
const symbolRegion = await sharp(source).extract({ left: 0, top: 0, width: 1254, height: 735 }).png().toBuffer();
const wordmarkRegion = await sharp(source).extract({ left: 0, top: 735, width: 1254, height: 519 }).png().toBuffer();
const symbol = await sharp(symbolRegion).trim().png().toBuffer();
const wordmark = await sharp(wordmarkRegion).trim().png().toBuffer();
const icon = await sharp(symbol).resize({ height: 144 }).png().toBuffer({ resolveWithObject: true });
const text = await sharp(wordmark).resize({ width: 514 }).png().toBuffer({ resolveWithObject: true });
const horizontal = await sharp({ create: { width: 720, height: 160, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    { input: icon.data, left: 8, top: 8 },
    { input: text.data, left: 198, top: Math.round((160 - text.info.height) / 2) }
  ]).png({ compressionLevel: 9 }).toBuffer();
await sharp(horizontal).toFile("public/brand/logo-horizontal.png");
const { data, info } = await sharp(horizontal).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += info.channels) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile("public/brand/logo-horizontal-white.png");
await sharp(symbol).resize({ width: 128, height: 128, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile("public/brand/icon.png");
process.stdout.write("Logo oficial preparada para interface, fundos escuros, PDF e favicon.\n");
