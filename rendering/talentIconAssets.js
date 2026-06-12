const TALENT_ICON_PATH = "./assets/ui/talent-icons.png";
const ICON_SIZE = 96;

const TALENT_ICON_CELLS = {
  oaken_reach: [0, 0],
  waystep: [0, 1],
  counterbloom: [0, 2],
  warden_vigor: [0, 3],
  wild_harvest: [0, 4],
  heartwood_tempest: [0, 5],
  spirit_reservoir: [1, 0],
  focused_bolt: [1, 1],
  bloom_conduit: [1, 2],
  pulse_harmonics: [1, 3],
  spellbreaker: [1, 4],
  verdant_nova: [1, 5],
  deep_roots: [2, 0],
  creeping_bind: [2, 1],
  patient_brewer: [2, 2],
  field_remedy: [2, 3],
  living_circle: [2, 4],
  awaken_the_grove: [2, 5],
};

let talentIconImage = null;
let talentIconReady = false;

if (typeof Image !== "undefined") {
  talentIconImage = new Image();
  talentIconImage.addEventListener("load", () => {
    talentIconReady = true;
  });
  talentIconImage.src = TALENT_ICON_PATH;
}

export function drawTalentIcon(ctx, talentId, x, y, size, options = {}) {
  const cell = TALENT_ICON_CELLS[talentId];
  if (!talentIconReady || !talentIconImage || !cell) return false;

  const alpha = options.alpha ?? 1;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(
    talentIconImage,
    cell[0] * ICON_SIZE,
    cell[1] * ICON_SIZE,
    ICON_SIZE,
    ICON_SIZE,
    Math.round(x),
    Math.round(y),
    Math.round(size),
    Math.round(size)
  );
  ctx.restore();
  return true;
}
