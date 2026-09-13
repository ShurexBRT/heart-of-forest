import test from "node:test";
import assert from "node:assert/strict";

import { Boss } from "../entities/boss.js";

function createState() {
  return {
    player: { x: 620, y: 400, vx: 80, vy: 0, radius: 16 },
    eruptions: [],
    enemies: [],
    hostileProjectiles: [],
    particles: [],
    shake: 0,
    encounter: { bannerText: "", bannerTimer: 0 },
    arena: {
      width: 1000,
      height: 800,
      boundsPadding: 28,
      obstacles: [],
      bossAddSpawns: [
        { x: 440, y: 340 },
        { x: 560, y: 340 },
        { x: 500, y: 470 },
      ],
    },
  };
}

const CASES = [
  ["cinder_warden", "Ashen Ring", "ember"],
  ["veil_seraph", "Veilfall Halo", "frost"],
  ["elder_hollow", "Single Will", "blight"],
  ["bog_matron", "Tidewake Crown", "mire"],
  ["rootbound_custodian", "Vault Lock", "ancient"],
  ["starwoken_sentinel", "Sixfold Verdict", "ancient"],
];

for (const [bossId, label, hazardType] of CASES) {
  test(`${label} creates a readable ${hazardType} signature pattern`, () => {
    const state = createState();
    const boss = new Boss({ x: 500, y: 400 }, { x: 500, y: 400, radius: 220 }, {
      bossId,
      bossName: label,
    });
    boss.phase = 2;

    boss.beginSignature(state);

    assert.equal(state.encounter.bannerText, label);
    assert.ok(state.eruptions.length >= 3);
    assert.ok(
      state.eruptions.some((hazard) => hazard.type === hazardType),
      `${label} should advertise ${hazardType} danger`
    );
    assert.ok(boss.cooldowns.signature > 0);
  });
}

test("guardian signatures are not all the same hazard layout", () => {
  const fingerprints = new Set();

  for (const [bossId] of CASES) {
    const state = createState();
    const boss = new Boss({ x: 500, y: 400 }, { x: 500, y: 400, radius: 220 }, {
      bossId,
      bossName: bossId,
    });
    boss.phase = 2;
    boss.beginSignature(state);

    const radii = state.eruptions
      .slice(0, 12)
      .map((hazard) => Math.round(Math.hypot(hazard.x - 620, hazard.y - 400)))
      .sort((a, b) => a - b)
      .join(",");
    fingerprints.add(`${state.eruptions.length}:${radii}`);
  }

  assert.ok(fingerprints.size >= 5);
});
