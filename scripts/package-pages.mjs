import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';

const output = '_site';
const runtimeEntries = [
  'index.html',
  'bootstrap.js',
  'main.js',
  'style.css',
  'shell-polish.css',
  'assets',
  'core',
  'data',
  'entities',
  'rendering',
  'systems',
  'ui',
  'world',
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of runtimeEntries) {
  if (!existsSync(entry)) {
    throw new Error(`Required Pages runtime entry is missing: ${entry}`);
  }

  cpSync(entry, join(output, basename(entry)), { recursive: true });
}

process.stdout.write(`[pages] Packaged ${runtimeEntries.length} runtime entries into ${output}.\n`);
