import test from "node:test";
import assert from "node:assert/strict";

import { getTerrainFamily } from "../rendering/terrainAssets.js";

test("terrain family grouping supports readable material transitions", () => {
  assert.equal(getTerrainFamily("grass"), "natural");
  assert.equal(getTerrainFamily("emberGrass"), "natural");
  assert.equal(getTerrainFamily("snow"), "natural");
  assert.equal(getTerrainFamily("path"), "path");
  assert.equal(getTerrainFamily("ashPath"), "path");
  assert.equal(getTerrainFamily("snowPath"), "path");
  assert.equal(getTerrainFamily("planks"), "planks");
  assert.equal(getTerrainFamily("ruinStone"), "stone");
  assert.equal(getTerrainFamily("ash"), "scorched");
  assert.equal(getTerrainFamily("ember"), "scorched");
  assert.equal(getTerrainFamily("blight"), "blight");
  assert.equal(getTerrainFamily("water"), "water");
  assert.equal(getTerrainFamily("ice"), "ice");
});
