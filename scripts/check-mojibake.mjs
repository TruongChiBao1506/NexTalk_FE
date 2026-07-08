import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const ignoredDirs = new Set(['.git', 'dist', 'node_modules', 'target']);
const textFilePattern = /\.(css|html|java|json|md|properties|ts|tsx|txt|yml|yaml)$/;
const mojibakePattern = /\uFFFD|Ã|Ä|Â|Æ|â€|â€¢|â€¦|ï»¿|áº|á»/;

const matches = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(path.join(dir, entry.name));
      }
      continue;
    }

    if (!textFilePattern.test(entry.name)) continue;

    const filePath = path.join(dir, entry.name);
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line, index) => {
      if (mojibakePattern.test(line)) {
        matches.push({
          filePath: path.relative(rootDir, filePath),
          lineNumber: index + 1,
          line: line.trim(),
        });
      }
    });
  }
};

walk(rootDir);

if (matches.length > 0) {
  console.error('Found possible Vietnamese mojibake:');
  for (const match of matches) {
    console.error(`${match.filePath}:${match.lineNumber}: ${match.line}`);
  }
  process.exit(1);
}

console.log('No Vietnamese mojibake patterns found.');
