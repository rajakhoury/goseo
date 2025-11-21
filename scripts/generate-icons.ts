import sharp from 'sharp';
import { resolve } from 'path';
import { mkdir } from 'fs/promises';

const sizes = [16, 32, 48, 128];
const svgPath = resolve('src/assets/icons/icon.svg');
const outputDir = resolve('public/assets/icons');

async function generateIcons() {
  await mkdir(outputDir, { recursive: true });

  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        compressionLevel: 9,
        quality: 100,
      })
      .toFile(resolve(outputDir, `icon${size}.png`));
    
    console.log(`✓ Generated icon${size}.png`);
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);