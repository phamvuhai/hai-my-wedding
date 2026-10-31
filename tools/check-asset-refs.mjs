// Check active local assets without a bundler or third-party dependencies.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const htmlPages = ['index.html', 'admin/index.html', 'admin/login/index.html'];
const cssFiles = ['assets/css/site.css', 'assets/css/admin.css', 'assets/css/login.css'];
const errors = [];
const references = new Set();

function assertFile(url, source) {
  const clean = url.split(/[?#]/)[0];
  if (!clean.startsWith('/') || !/\.(?:css|js|svg)$/i.test(clean)) return;
  const path = clean.slice(1);
  references.add(path);
  if (!existsSync(join(root, path))) errors.push(source + ': missing ' + clean);
}
for (const page of htmlPages) {
  const html = readFileSync(join(root, page), 'utf8');
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)) {
    assertFile(match[1], page);
  }
}
for (const cssFile of cssFiles) {
  const css = readFileSync(join(root, cssFile), 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?(\/[^)"']+)/g)) {
    assertFile(match[1], cssFile);
  }
}
function walk(folder) {
  for (const name of readdirSync(join(root, folder), { withFileTypes: true })) {
    const path = join(folder, name.name);
    if (name.isDirectory()) walk(path);
    else {
      if (/-v\d+\.(?:css|js|svg)$/i.test(basename(path))) {
        errors.push('Versioned asset filename: ' + path);
      }
      if (/\.(?:css|js|svg)$/i.test(path) && !references.has(path.replaceAll('\\', '/'))) {
        errors.push('Unreferenced asset: ' + path);
      }
    }
  }
}
walk('assets');
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
if (!config.headers.some((x) => x.source === '/assets/:path*' &&
  x.headers.some((h) => h.key.toLowerCase() === 'cache-control' && h.value.includes('no-store')))) {
  errors.push('Vercel missing no-store header for /assets/:path*');
}
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exitCode = 1;
} else {
  console.log('Asset integrity OK: ' + references.size + ' local assets, 3 page entries');
}
