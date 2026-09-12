import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["core", "data", "entities", "rendering", "systems", "ui", "world"];

function collectFiles(dir, predicate, result = []) {
  for (const entry of readdirSync(dir)) {
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

function run(label, command, args) {
  process.stdout.write(`\n[verify] ${label}\n`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const jsFiles = ROOTS.flatMap((root) => collectFiles(root, (file) => file.endsWith(".js")));
jsFiles.push("main.js", "bootstrap.js");

for (const file of jsFiles) {
  run(`syntax ${relative(process.cwd(), file)}`, process.execPath, ["--check", file]);
}

const testFiles = collectFiles("tests", (file) => file.endsWith(".test.mjs"));
run(`${testFiles.length} test files`, process.execPath, ["--test", ...testFiles]);

process.stdout.write("\n[verify] All syntax checks and tests passed.\n");
