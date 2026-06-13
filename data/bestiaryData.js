export const BESTIARY_DEFS = {
  thornling: {
    id: "thornling",
    chapter: "heartwood",
    name: "Thornling",
    unknownName: "Briar Footprints",
    role: "Close-range harrier",
    damageType: "thorn",
    summary:
      "A young forest spirit twisted into a territorial hunter by the pressure around the broken Heartroot.",
    clues: [
      "Staff strikes interrupt its close pressure and refill Spirit.",
      "Spirit Bolt is safest while it crosses open ground.",
    ],
  },
  rootwarden: {
    id: "rootwarden",
    chapter: "heartwood",
    name: "Rootwarden",
    unknownName: "The Crowned Guardian",
    role: "Heartwood guardian",
    damageType: "thorn",
    counterItemId: "barkskin_draught",
    summary:
      "An ancient keeper forced to defend the wounded root. Its rage is a symptom of the forest's fracture, not simple malice.",
    clues: [
      "Barkskin softens thorn damage but is preparation, not a gate.",
      "Root Crown always leaves a readable escape gap before the thorns close.",
    ],
  },
};
