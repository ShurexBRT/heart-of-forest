import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOTS = ["core", "data", "entities", "rendering", "systems", "ui", "world"];
const SKIP_DIRECTORIES = new Set([".git", "node_modules"]);
const errors = [];

function collectFiles(dir, predicate, result = []) {
  if (!existsSync(dir)) return result;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRECTORIES.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, predicate, result);
    } else if (predicate(full)) {
      result.push(full);
    }
  }
  return result;
}

function display(path) {
  return relative(ROOT, path).replaceAll("\\", "/");
}

function recordMissing(owner, specifier, resolved) {
  errors.push(`${display(owner)} -> ${specifier} (missing ${display(resolved)})`);
}

function resolveLocal(owner, specifier) {
  const cleaned = specifier.split(/[?#]/, 1)[0];
  if (!cleaned || /^(?:[a-z]+:|#|\/\/)/i.test(cleaned)) return null;
  if (cleaned.startsWith("/")) return resolve(ROOT, `.${cleaned}`);
  return resolve(dirname(owner), cleaned);
}

function checkReference(owner, specifier) {
  const target = resolveLocal(owner, specifier);
  if (!target) return;
  if (!existsSync(target)) recordMissing(owner, specifier, target);
}

function extractHtmlReferences(html) {
  const refs = [];
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
    refs.push(match[1]);
  }
  return refs;
}

function extractJsImports(source) {
  const refs = new Set();
  const patterns = [
    /\bimport\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+[^"']*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) refs.add(match[1]);
  }
  return [...refs];
}

function extractAssetStrings(source) {
  const refs = new Set();
  for (const match of source.matchAll(/["']((?:\.\.\/|\.\/)?assets\/[^"']+)["']/g)) {
    refs.add(match[1]);
  }
  return [...refs];
}

function extractCssUrls(source) {
  const refs = new Set();
  for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    refs.add(match[1]);
  }
  return [...refs];
}

const indexPath = resolve(ROOT, "index.html");
if (!existsSync(indexPath)) {
  errors.push("index.html is missing");
} else {
  const html = readFileSync(indexPath, "utf8");
  for (const ref of extractHtmlReferences(html)) checkReference(indexPath, ref);
}

const jsFiles = SOURCE_ROOTS.flatMap((root) =>
  collectFiles(resolve(ROOT, root), (file) => file.endsWith(".js"))
);
for (const entry of ["main.js", "bootstrap.js"]) {
  const full = resolve(ROOT, entry);
  if (existsSync(full)) jsFiles.push(full);
}

for (const file of jsFiles) {
  const source = readFileSync(file, "utf8");
  for (const specifier of extractJsImports(source)) {
    if (specifier.startsWith(".")) checkReference(file, specifier);
  }
  for (const asset of extractAssetStrings(source)) checkReference(file, asset);
}

const cssFiles = collectFiles(ROOT, (file) => file.endsWith(".css"));
for (const file of cssFiles) {
  const source = readFileSync(file, "utf8");
  for (const ref of extractCssUrls(source)) {
    if (!ref.startsWith("data:")) checkReference(file, ref);
  }
}

if (errors.length) {
  console.error("[smoke-static] Broken local references detected:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `[smoke-static] OK: index shell, ${jsFiles.length} JS modules, imports and local asset references resolve.`
);
