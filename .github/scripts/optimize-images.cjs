// Shrinks oversized photos in img/ in place (same file name and format, so links keep working).
// - Longest side is limited to MAX_SIDE pixels (never enlarged).
// - Re-encoded at a web-friendly quality; phone rotation is applied and location data removed.
// - A file is only replaced if the new one is smaller or had to be resized.
// Usage: node optimize-images.cjs <folder>
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const MAX_SIDE = 1600;
const MAX_BYTES = 350 * 1024; // files under this size and within MAX_SIDE are left alone
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

async function optimize(file) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTS.has(ext)) return;
  const input = fs.readFileSync(file);
  const meta = await sharp(input).metadata();
  if ((meta.pages || 1) > 1) return; // leave animated images alone

  // Size after applying phone rotation
  const rotated = (meta.orientation || 1) >= 5;
  const w = rotated ? meta.height : meta.width;
  const h = rotated ? meta.width : meta.height;
  const tooBig = Math.max(w, h) > MAX_SIDE;
  if (!tooBig && input.length <= MAX_BYTES) return;

  let img = sharp(input).rotate().resize({
    width: MAX_SIDE,
    height: MAX_SIDE,
    fit: "inside",
    withoutEnlargement: true,
  });
  if (ext === ".png") img = img.png({ compressionLevel: 9, palette: true, quality: 85 });
  else if (ext === ".webp") img = img.webp({ quality: 80 });
  else img = img.jpeg({ quality: 80, mozjpeg: true });

  const output = await img.toBuffer();
  if (!tooBig && output.length >= input.length) return;
  fs.writeFileSync(file, output);
  console.log(`${file}: ${w}x${h} ${(input.length / 1024).toFixed(0)} KB -> ${(output.length / 1024).toFixed(0)} KB`);
}

(async () => {
  const dir = process.argv[2] || "img";
  let failed = 0;
  for (const file of walk(dir)) {
    try {
      await optimize(file);
    } catch (e) {
      failed++;
      console.error(`Skipped ${file}: ${e.message}`);
    }
  }
  if (failed) console.log(`${failed} file(s) could not be processed and were left unchanged.`);
})();
