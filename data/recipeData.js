export const RECIPE_DEFS = {
  barkskin_draught: {
    id: "barkskin_draught",
    name: "Barkskin Draught",
    description: "Reduces thorn damage by 25% until Ayla sleeps or drinks another preparation.",
    outputItemId: "barkskin_draught",
    outputAmount: 1,
    costSilver: 8,
    ingredients: {
      moonleaf: 2,
      ironbark: 1,
    },
  },
  antitoxin_bloom: {
    id: "antitoxin_bloom",
    name: "Antitoxin Bloom",
    description: "Reduces mire damage by 25% until Ayla sleeps or drinks another preparation.",
    outputItemId: "antitoxin_bloom",
    outputAmount: 1,
    costSilver: 10,
    ingredients: {
      moonleaf: 1,
      bog_amber: 2,
    },
  },
};
