import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SHEET_PATH = new URL("../assets/bosses/boss-v1-directional-game-sheet.png", import.meta.url);
const METADATA_PATH = new URL("../assets/bosses/boss-v1-directional-metadata.json", import.meta.url);

test("boss sprite sheet preserves the fixed directional atlas contract", () => {
  const png = readFileSync(SHEET_PATH);
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 896);

  const metadata = JSON.parse(readFileSync(METADATA_PATH, "utf8"));
  assert.equal(metadata.cellSize, 128);
  assert.deepEqual(metadata.columns, ["down", "right", "left", "up"]);
  assert.deepEqual(metadata.rows, [
    "rootwarden",
    "bog_matron",
    "cinder_warden",
    "veil_seraph",
    "elder_hollow",
    "rootbound_custodian",
    "starwoken_sentinel",
  ]);
});
