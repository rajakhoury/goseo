import { promises as fs } from 'fs';
import path from 'path';

async function copyWebVitals() {
  const srcs = [
    path.join('node_modules', 'web-vitals', 'dist', 'web-vitals.attribution.iife.js'),
    path.join('node_modules', 'web-vitals', 'dist', 'web-vitals.iife.js'),
  ];
  const destDir = path.join('public', 'vendor');
  const destFile = path.join(destDir, 'web-vitals.attribution.iife.js');

  try {
    await fs.mkdir(destDir, { recursive: true });
    let foundSrc: string | null = null;
    for (const s of srcs) {
      try {
        await fs.access(s);
        foundSrc = s;
        break;
      } catch {}
    }
    if (!foundSrc) {
      throw new Error('web-vitals IIFE not found in node_modules');
    }
    await fs.copyFile(foundSrc, destFile);
    console.log(`[copy-web-vitals] Copied ${foundSrc} -> ${destFile}`);
  } catch (err) {
    console.error('[copy-web-vitals] Failed to copy web-vitals IIFE:', err);
    process.exitCode = 1;
  }
}

copyWebVitals();