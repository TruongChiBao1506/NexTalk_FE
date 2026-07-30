import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const assetsDirectory = join(process.cwd(), 'dist', 'assets');
const files = readdirSync(assetsDirectory).filter(file => file.endsWith('.js'));
const gzipSize = file => gzipSync(readFileSync(join(assetsDirectory, file))).byteLength;

const budgets = [
  { label: 'chat route', pattern: /^Chat-.*\.js$/, maxGzipBytes: 300 * 1024 },
  { label: 'chat state', pattern: /^chatStore-.*\.js$/, maxGzipBytes: 40 * 1024 },
  { label: 'any lazy JavaScript chunk', pattern: /\.js$/, maxGzipBytes: 500 * 1024 },
];

const violations = [];
for (const budget of budgets) {
  const matches = files.filter(file => budget.pattern.test(file));
  if (matches.length === 0) {
    violations.push(`${budget.label}: no matching build artifact`);
    continue;
  }
  for (const file of matches) {
    const size = gzipSize(file);
    if (size > budget.maxGzipBytes) {
      violations.push(
        `${budget.label}: ${file} is ${(size / 1024).toFixed(1)} KiB gzip `
        + `(budget ${(budget.maxGzipBytes / 1024).toFixed(0)} KiB)`
      );
    }
  }
}

if (violations.length > 0) {
  console.error(`Bundle budget failed:\n- ${violations.join('\n- ')}`);
  process.exit(1);
}

console.log('Bundle budget passed.');
